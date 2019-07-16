import Dexie from 'dexie';
import axios from 'axios';
import {
  concat,
  map,
  sumBy,
  countBy,
  find,
  some,
  flatten,
  intersection,
} from 'lodash';
import isReserved from 'github-reserved-names';
import addressRegistry from '../../dist/crypto_addresses.json';

import { registerListener } from '../background/messaging.ts';
import { canonicalizeUrl } from './url.ts';
import { isBackgroundPage, isTesting } from './util.ts';
import {
  IActivity,
  IDonation,
  Donation,
  IThank,
  Thank,
  ICreator,
  Creator,
} from './models.ts';

// Send a message to the background script worker
async function _sendMessage(type: string, data: any[]): Promise<any> {
  let browser = require('webextension-polyfill');
  return await browser.runtime.sendMessage({ type, data });
}

// Handles unhandled promise rejections
// https://dexie.org/docs/Promise/unhandledrejection-event
function handler(event) {
  event.preventDefault(); // Prevents default handler (would log to console).
  console.warn('Unhandled promise rejection:', event.reason);
}

if (window) window.addEventListener('unhandledrejection', handler);

// Doesn't like when you add the descriptor argument for whatever reason ("Unable to resolve signature of method decorator when called as an expression.")
type TDecorator = (
  target: any,
  propertyKey: string,
  ...args: any[]
) => PropertyDescriptor;

// A decorator that will throw an error if the decorated
// function is called outside of the background script.
function onlyInBackgroundPage(): TDecorator {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    if (!isBackgroundPage() && !isTesting()) {
      descriptor.value = function(...args: any[]): any {
        throw `Function ${propertyKey} only allowed to run in background page`;
      };
    }
    return descriptor;
  };
}

// Registers a function as callable through messaging,
// will call using messaging if necessary.
function messageListener(name?: string): TDecorator {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    if (isBackgroundPage() || isTesting()) {
      // Function initialized in background page, register listener.
      name = name || propertyKey;
      registerListener(descriptor.value, { name });
    } else {
      // Function not initialized in background page, redirect to sendMessage.
      descriptor.value = async function(...args: any[]): Promise<any> {
        return await _sendMessage(propertyKey, args);
      };
    }
    return descriptor;
  };
}

let _db: Database | null = null;

export function getDatabase(): Database {
  if (_db === null) {
    _db = new Database();
  }
  return _db;
}

// For how to use Dexie in Typescript, read:
//  https://dexie.org/docs/Typescript
export class Database extends Dexie {
  activities: Dexie.Table<IActivity, number>;
  creators: Dexie.Table<ICreator, number>;
  donations: Dexie.Table<IDonation, number>;
  thanks: Dexie.Table<IThank, number>;

  constructor() {
    super('Thankful');

    // Only run constructor in background page, non-background requests will be redirected to the background page using messageListener.
    if (!isBackgroundPage() && !isTesting()) {
      return;
    }

    // Define tables and indexes
    // (Here's where the implicit table props are dynamically created)
    this.version(1).stores({
      activity: '&url, title, duration, creator',
      creator: '&url, name',
    });
    this.version(2).stores({
      donations: '++id, date, url, weiAmount, usdAmount',
    });
    this.version(3).stores({
      creator: '&url, name, ignore',
    });
    this.version(4)
      .stores({
        thanks: '++id, url, date, title, creator',
      })
      .upgrade(async trans => {
        let activities = await trans['activity'].toArray();
        trans['activity'].clear();
        activities.forEach(a => {
          this.logActivity(a.url, a.duration, {
            title: a.title,
            creator: a.creator,
          });
        });
      });
    /* Version 6 upgrade summary:
     * Drop tables activity and creator to allow better naming and integer primary key.
     * thanks: 'creator' key (which was the url of a creator) replaced by creator_id
     * donations: 'url' key (which was the url of a creator) replaced by creator_id
     * creators: 'url' becomes multi-valued
     */
    this.version(5)
      .stores({
        activities: '++id, &url, title, duration, creator_id',
        creators: '++id, *url, name, ignore',
        thanks: '++id, url, date, title, creator_id',
        donations: '++id, date, creator_id, weiAmount, usdAmount',
      })
      .upgrade(async trans => {
        let activities = await trans['activity'].toArray();
        await trans['activities'].bulkAdd(activities);

        let creators = await trans['creator'].toArray();
        trans['creators'].bulkAdd(creators.map(c => ({ ...c, url: [c.url] })));

        await trans['thanks'].toCollection().modify(t =>
          trans['creators'].get({ url: t.creator }).then(c => {
            t.creator_id = c.id;
            delete t.creator;
          })
        );

        await trans['donations'].toCollection().modify(d =>
          trans['creators'].get({ url: d.url }).then(c => {
            d.creator_id = c.id;
            delete d.url;
          })
        );
      });

    // The following lines are needed for it to work across typescipt using babel-preset-typescript:
    this.activities = this.table('activities');
    this.creators = this.table('creators');
    this.donations = this.table('donations');
    this.thanks = this.table('thanks');
  }

  @messageListener()
  async initThankfulTeamCreator() {
    return this.updateCreator('https://getthankful.io', {
      // Erik's address
      // TODO: Change to a multisig wallet
      name: 'Thankful Team',
      address: '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35',
      info:
        'Be thankful for Thankful, donate so we can keep helping people to be thankful!',
      priority: 1,
      share: 0.1,
    });
  }

  @messageListener()
  async getActivity(url: string): Promise<IActivity> {
    return await this.activities.get({ url: canonicalizeUrl(url) });
  }

  // Get activities from database
  //
  // Options:
  //   withCreators = null    Includes all activity, without creator set
  //   withCreators = true    Only includes activity with an attributed creator, and sets creator_id
  //   withCreators = false   Only includes activity without an attributed creator
  @messageListener()
  async getActivities({
    limit = 10000,
    withCreators = null,
    withThanks = false,
  } = {}): Promise<IActivity[]> {
    let coll = this.activities.orderBy('duration').reverse();

    if (withCreators !== null) {
      coll = coll.filter(a => {
        if (withCreators) {
          return a.creator_id !== undefined;
        } else {
          return a.creator_id === undefined;
        }
      });
    }

    if (limit && limit >= 0) {
      coll = coll.limit(limit);
    }

    let activities = await coll.toArray();
    if (withThanks) {
      // Populate the activities with their number of thanks
      let thanksPerUrl = countBy(await this.thanks.toArray(), t => t.url);
      activities = activities.map(a => {
        a.thanks = thanksPerUrl[a.url] || 0;
        return a;
      });
    }

    return activities;
  }

  @messageListener()
  async deleteUnattributedActivities(): Promise<number> {
    let deleteCount = await this.activities
      .filter(a => a.creator_id === undefined)
      .delete();
    return deleteCount;
  }

  // TODO: rename to getCreatorWithUrl or something
  @messageListener()
  async getCreator(url: string): Promise<ICreator | null> {
    // get() gets a creator where the url array contains the url
    return (await this.creators.get({ url: url })) || null;
  }

  @messageListener()
  async getCreatorWithId(id: number): Promise<ICreator | null> {
    return (await this.creators.get(id)) || null;
  }

  @messageListener()
  async getCreators({
    limit = 1000,
    withDurations = false,
    withThanksAmount = false,
  } = {}): Promise<ICreator[]> {
    try {
      await this.attributeActivity();
    } catch (error) {
      console.error("Couldn't attribute activity");
      console.error(error);
    }

    let coll = this.creators.reverse();
    if (limit && limit >= 0) {
      coll = coll.limit(limit);
    }

    let creators = await coll.toArray();
    if (withDurations) {
      await Promise.all(
        map(creators, async c => {
          let activities = await this.getCreatorActivity(c.id);
          c.duration = sumBy(activities, 'duration');
          return c;
        })
      );
    }
    if (withThanksAmount) {
      await Promise.all(
        map(creators, async c => {
          c.thanksAmount = await this.getCreatorThanksAmount(c.id);
          return c;
        })
      );
    }
    return creators;
  }

  @messageListener()
  async getCreatorActivity(creator_id: number): Promise<IActivity[]> {
    // Get all activity connected to a certain creator
    return this.activities
      .where('creator_id')
      .equals(creator_id)
      .toArray();
  }

  @messageListener()
  async logActivity(url: string, duration: number, options = {}) {
    // Adds a duration to a URL if activity for URL already exists,
    // otherwise creates new Activity with the given duration.
    url = canonicalizeUrl(url);
    let activity = await this.activities.get({ url: url });

    if (activity === undefined) {
      activity = {
        url: url,
        duration: 0,
      };
    }
    activity.duration += duration;
    Object.assign(activity, options);
    return this.activities.put(activity);
  }

  @messageListener()
  async connectThanksToCreator(url: string, creator_id: number) {
    url = canonicalizeUrl(url);
    await this.thanks
      .where('url')
      .equals(url)
      .modify({ creator_id: creator_id });
  }

  @messageListener()
  async connectActivityToCreator(url: string, creator_id: number) {
    url = canonicalizeUrl(url);
    await this.activities
      .where('url')
      .equals(url)
      .modify({ creator_id: creator_id });
  }

  @messageListener()
  async connectUrlToCreator(url: string, creator_url: string) {
    url = canonicalizeUrl(url);
    let creator = await this.getCreator(creator_url);
    if (!creator) {
      console.error(
        `Couldn't connect url to creator, no creator found with url: ${creator_url}`
      );
      return;
    }
    await Promise.all([
      this.connectThanksToCreator(url, creator.id),
      this.connectActivityToCreator(url, creator.id),
    ]);
  }

  @messageListener()
  async cleanDisconnected() {
    // Cleans activities with creators assigned that no longer exist
    let creatorIds = await this.creators.toCollection().primaryKeys();
    let no_modified = await this.activities
      .where('creator_id')
      .noneOf(creatorIds)
      .filter(t => t.creator_id !== undefined)
      .modify({ creator_id: undefined });
    console.log(
      `Deassociated ${no_modified} activities with dead creator links`
    );
  }

  @messageListener()
  async logDonation(creator_id: number, weiAmount, usdAmount, hash, net_id) {
    return this.donations.add(
      new Donation(
        creator_id,
        weiAmount.toString(),
        usdAmount.toString(),
        hash,
        net_id
      )
    );
  }

  @messageListener()
  async getDonation(id: number): Promise<IDonation> {
    return this.donations.get(id).then(d => this.donationWithCreator(d));
  }

  @messageListener()
  async donationWithCreator(donation: IDonation): Promise<IDonation> {
    donation.creator = await this.getCreatorWithId(donation.creator_id);
    return donation;
  }

  @messageListener()
  async getDonations(limit: number = 100): Promise<Donation[]> {
    let donations = await this.donations
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray();
    return await Promise.all(donations.map(d => this.donationWithCreator(d)));
  }

  @messageListener()
  async attributeActivity() {
    await this._attributeGithubActivity();
  }

  @messageListener()
  async _attributeGithubActivity() {
    // If getActivities() takes a long time to run, consider using:
    //    http://dexie.org/docs/WhereClause/WhereClause.startsWith()
    const items = concat(
      await this.thanks
        .where('url')
        .startsWith('https://github.com/')
        .filter(t => t.creator_id === undefined)
        .toArray(),
      await this.activities
        .where('url')
        .startsWith('https://github.com/')
        .filter(t => t.creator_id === undefined)
        .toArray()
    );

    await Promise.all(
      map(items, async a => {
        let u = new URL(a.url);
        let user_or_org = u.pathname.split('/')[1];
        if (user_or_org.length > 0 && !isReserved.check(user_or_org)) {
          let creator_url = `https://github.com/${user_or_org}`;
          await this.updateCreator(creator_url, { name: user_or_org });
          await this.connectUrlToCreator(a.url, creator_url);
        }
      })
    );

    return null;
  }

  @messageListener()
  async _attributeActivityToCreatorFromRegistry() {
    /*
     * Attributes activity whose URLs starts with a creator URL in the registry
     * Works for basic websites, GitHub, etc.
     * Doesn't work for YouTube
     */

    let registryUrls: string[] = flatten(map(addressRegistry, c => c.urls));

    let activities = await this.activities
      .where('url')
      .startsWithAnyOf(registryUrls)
      //.filter(a => a.creator_id === undefined)
      .toArray();
    // console.info(`Found unattributed activities with entries in registry: ${activities.length}`);

    // Import creators to database
    await Promise.all(
      map(activities, async a => {
        let reg_creator = find(addressRegistry, c =>
          some(c.urls, url => a.url.startsWith(url))
        );

        // TODO: Check if creator is already in database
        await this.updateCreator(reg_creator.urls[0], {
          name: reg_creator.name,
          address: reg_creator['eth address'],
          url: reg_creator.urls,
        });
        let db_creator = await this.getCreator(reg_creator.urls[0]);
        console.log(
          'New creator with activity found in registry:',
          db_creator.name
        );
      })
    );

    // Attribute activity to creators
    let creators = await this.creators.toArray();
    await Promise.all(
      map(creators, async (c: ICreator) => {
        if (c.url && c.url.length > 0) {
          let acts = await this.activities
            .where('url')
            .startsWithAnyOf(c.url)
            .toArray();
          await Promise.all(
            map(acts, async a => {
              await this.connectActivityToCreator(a.url, c.id);
            })
          );
        } else {
          console.error(`No urls for creator ${c.name}`);
        }
      })
    );
    return null;
  }

  @messageListener()
  async _attributeAddressToCreatorFromRegistry() {
    // Attributes addresses to creators that have matching URLs in the registry
    let registryUrls: string[] = flatten(map(addressRegistry, c => c.urls));

    let creators = await this.creators
      .where('url')
      .anyOf(registryUrls)
      .toArray();
    // console.info(`Found creators with entries in registry: ${creators.length}`);

    // Import creators to database
    await Promise.all(
      map(creators, async c => {
        let reg_creator = find(
          addressRegistry,
          reg_c => intersection(reg_c.urls, c.url).length > 0
        );
        if (!reg_creator) return;

        await this.updateCreator(c.url[0], {
          name: reg_creator.name,
          address: reg_creator['eth address'],
          url: Array.from(new Set([...c.url, ...reg_creator.urls])),
        });

        let db_creator = await this.getCreator(c.url[0]);
        console.log(
          'New address for creator found in registry:',
          db_creator.name
        );
      })
    );
    return null;
  }

  @messageListener()
  async updateCreator(
    key_url: string,
    {
      name = null,
      url = [],
      ignore = null,
      address = null,
      priority = null,
      share = null,
      info = null,
    }: {
      name?: string;
      url?: string[];
      ignore?: boolean;
      address?: string;
      priority?: number;
      share?: number;
      info?: string;
    } = {}
  ) {
    let creators = this.creators;
    const withDefault = (maybe, def) => (maybe === null ? def : maybe);
    this.transaction('rw', creators, async () => {
      let urlSet = new Set([key_url, ...url]);

      let creator = null;
      // If urlSet is larger than 1, we need to check all the keys if they have a matching creator
      if (urlSet.size > 1) {
        creator = find(
          await Promise.all(
            map(
              Array.from(urlSet),
              async url => await creators.get({ url: url })
            )
          )
        );
      } else {
        creator = await creators.get({ url: key_url });
      }

      if (creator) {
        urlSet = new Set([...urlSet, ...creator.url]);
        creator = {
          id: creator.id,
          url: Array.from(urlSet) as string[],
          name: withDefault(name, creator.name),
          ignore: withDefault(ignore, creator.ignore),
          address: withDefault(address, creator.address),
          priority: withDefault(priority, creator.priority),
          share: withDefault(share, creator.share),
          info: withDefault(info, creator.info),
        };
        //console.log('Putting creator: ', creator);
        return creators.put(creator);
      } else {
        creator = {
          url: Array.from(urlSet) as string[],
          name: name,
          ignore: !!ignore,
          address: address,
          priority: priority,
          share: share,
          info: info,
        };
        //console.log('Adding creator: ', creator);
        return creators.add(creator);
      }
    });
  }

  @messageListener()
  async logThank(url: string, title: string) {
    let activity = await this.activities.get({ url: url });
    let creator_id = activity !== undefined ? activity.creator_id : undefined;
    return this.thanks.add(new Thank(url, title, creator_id));
  }

  @messageListener()
  async getUrlThanksAmount(url: string): Promise<number> {
    url = canonicalizeUrl(url);
    return this.thanks
      .where('url')
      .equals(url)
      .count();
  }

  @messageListener()
  async getCreatorThanksAmount(creator_id: number): Promise<number> {
    return this.thanks
      .where('creator_id')
      .equals(creator_id)
      .count();
  }
}
