import Dexie from 'dexie';
import { concat, map, sumBy } from 'lodash';
import isReserved from 'github-reserved-names';

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
    return this.updateCreator('https://getthankful.io', 'Thankful Team', {
      // Erik's address
      // TODO: Change to a multisig wallet
      address: '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35',
      info:
        'Be thankful for Thankful, donate so we can keep helping people to be thankful!',
      priority: 1,
      share: 0.1,
    });
  }

  @messageListener()
  async getActivity(url): Promise<IActivity> {
    return await this.activities.get({ url: canonicalizeUrl(url) });
  }

  @messageListener()
  async getActivities({ limit = 1000, withCreators = null } = {}): Promise<
    IActivity[]
  > {
    let coll = this.activities.orderBy('duration').reverse();
    if (withCreators !== null) {
      if (withCreators) {
        coll = coll.filter(a => a.creator_id !== undefined);
      } else {
        coll = coll.filter(a => a.creator_id === undefined);
      }
    }
    if (limit && limit >= 0) {
      coll = coll.limit(limit);
    }
    return coll.toArray();
  }

  // TODO: rename to getCreatorWithUrl or something
  @messageListener()
  async getCreator(url): Promise<ICreator> {
    // get() gets a creator where the url array contains the url
    return this.creators.get({ url: url });
  }

  @messageListener()
  async getCreatorWithId(id): Promise<ICreator> {
    return this.creators.get(id);
  }

  @messageListener()
  async getCreators({
    limit = 100,
    withDurations = false,
    withThanksAmount = false,
  } = {}): Promise<ICreator[]> {
    await this.attributeGithubActivity();
    let creators = await this.creators.limit(limit).toArray();
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
  async getCreatorActivity(creator_id): Promise<IActivity[]> {
    // Get all activity connected to a certain creator
    return this.activities
      .where('creator_id')
      .equals(creator_id)
      .toArray();
  }

  @messageListener()
  async logActivity(url, duration, options = {}) {
    // Adds a duration to a URL if activity for URL already exists,
    // otherwise creates new Activity with the given duration.
    url = canonicalizeUrl(url);
    return this.activities
      .get({ url: url })
      .then(activity => {
        if (activity === undefined) {
          activity = {
            url: url,
            duration: 0,
          };
        }
        activity.duration += duration;
        Object.assign(activity, options);
        return this.activities.put(activity);
      })
      .catch(err => {
        throw 'Could not log activity, ' + err;
      });
  }

  @messageListener()
  async connectThanksToCreator(url: string, creator_id: number) {
    url = canonicalizeUrl(url);
    await this.thanks
      .where('url')
      .equals(url)
      .modify({ creator_id: creator_id })
      .catch(err => {
        throw 'Could not connect Thanks to creator, ' + err;
      });
  }

  @messageListener()
  async connectActivityToCreator(url: string, creator_id: number) {
    url = canonicalizeUrl(url);
    await this.activities
      .where('url')
      .equals(url)
      .modify({ creator_id: creator_id })
      .catch(err => {
        throw 'Could not connect Activity to creator, ' + err;
      });
  }

  @messageListener()
  async connectUrlToCreator(url, creator_url) {
    try {
      url = canonicalizeUrl(url);
      let creator = await this.getCreator(creator_url);
      await Promise.all([
        this.connectThanksToCreator(url, creator.id),
        this.connectActivityToCreator(url, creator.id),
      ]);
    } catch (err) {
      throw 'Could not connect URL to creator, ' + err;
    }
  }

  @messageListener()
  async logDonation(creator_id, weiAmount, usdAmount, hash, net_id) {
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
  async getDonation(id): Promise<IDonation> {
    return this.donations.get(id).then(d => this.donationWithCreator(d));
  }

  @messageListener()
  async donationWithCreator(donation): Promise<IDonation> {
    donation.creator = await this.getCreatorWithId(donation.creator_id);
    return donation;
  }

  @messageListener()
  async getDonations(limit = 100): Promise<Donation[]> {
    try {
      let donations = await this.donations
        .reverse()
        .limit(limit)
        .toArray();
      return await Promise.all(donations.map(d => this.donationWithCreator(d)));
    } catch (err) {
      console.log("Couldn't get donation history from db:", err);
    }
  }

  @messageListener()
  async lastDonationDate(): Promise<Date | null> {
    // TODO: Combine with behavior defined in Vuex to reduce code duplication
    let donation: IDonation = await this.getDonations(1)[0];
    return donation !== undefined ? new Date(donation.date) : null;
  }

  @messageListener()
  async attributeGithubActivity() {
    try {
      // If getActivities() takes a long time to run, consider using:
      //    http://dexie.org/docs/WhereClause/WhereClause.startsWith()
      const logs = concat(
        await this.getActivities({ withCreators: false }),
        await this.thanks.filter(t => t.creator_id === undefined).toArray()
      ).filter(a => {
        return a.url.includes('https://github.com/');
      });

      let promises = map(logs, async a => {
        let u = new URL(a.url);
        let user_or_org = u.pathname.split('/')[1];
        if (user_or_org.length > 0 && !isReserved.check(user_or_org)) {
          let creator_url = `https://github.com/${user_or_org}`;
          await this.updateCreator(creator_url, user_or_org);
          await this.connectUrlToCreator(a.url, creator_url);
        }
      });

      await Promise.all(promises);
      return null;
    } catch (err) {
      throw 'Could not attribute Github activity, ' + err;
    }
  }

  @messageListener()
  async updateCreator(
    url,
    name,
    {
      urls = [],
      ignore = null,
      address = null,
      priority = null,
      share = null,
      info = null,
    } = {}
  ) {
    let creators = this.creators;
    const withDefault = (maybe, def) => (maybe === null ? def : maybe);
    this.transaction('rw', creators, async () => {
      let creator = await creators.get({ url: url });
      if (creator) {
        let urlSet = new Set([...creator.url, ...urls]);
        creator = {
          id: creator.id,
          url: Array.from(urlSet) as string[],
          name: name,
          ignore: withDefault(ignore, creator.ignore),
          address: withDefault(address, creator.address),
          priority: withDefault(priority, creator.priority),
          share: withDefault(share, creator.share),
          info: withDefault(info, creator.info),
        };
        return creators.put(creator);
      } else {
        let urlSet = new Set([url, ...urls]);
        creator = {
          url: Array.from(urlSet),
          name: name,
          ignore: !!ignore,
          address: address,
          priority: priority,
          share: share,
          info: info,
        };
        return creators.add(creator);
      }
    });
  }

  @messageListener()
  async logThank(url, title) {
    let activity = await this.activities.get({ url: url });
    let creator_id = activity !== undefined ? activity.creator_id : undefined;
    return this.thanks.add(new Thank(url, title, creator_id)).catch(err => {
      throw 'Logging thank failed: ' + err;
    });
  }

  @messageListener()
  async getUrlThanksAmount(url): Promise<number> {
    url = canonicalizeUrl(url);
    return this.thanks
      .where('url')
      .equals(url)
      .count()
      .catch(err => {
        throw 'Could not count url thanks: ' + err;
      });
  }

  @messageListener()
  async getCreatorThanksAmount(creator_id): Promise<number> {
    return this.thanks
      .where('creator_id')
      .equals(creator_id)
      .count()
      .catch(err => {
        throw 'Could not count creator thanks: ' + err;
      });
  }
}
