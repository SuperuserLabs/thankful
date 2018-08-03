import Dexie from 'dexie';
import _ from 'lodash';
import { canonicalizeUrl } from './url.js';
import isReserved from 'github-reserved-names';
import { Activity, Creator, Donation, Thank, registerModel } from './models.js';

export { Activity, Creator };

let _db = undefined;

function dbinit() {
  if (_db !== undefined) {
    return _db;
  }
  let db = new Dexie('Thankful');
  db.version(1).stores({
    activity: '&url, title, duration, creator',
    creator: '&url, name',
  });
  db.version(2).stores({
    donations: '++id, date, url, weiAmount, usdAmount',
  });
  db.version(3).stores({
    creator: '&url, name, ignore',
  });
  db.version(4)
    .stores({
      thanks: '++id, url, date, title, creator',
    })
    .upgrade(trans => {
      return trans.activity.toArray().then(activities => {
        trans.activity.clear();
        activities.forEach(a => {
          this.logActivity(a.url, a.duration, {
            title: a.title,
            creator: a.creator,
          });
        });
      });
    });
  /* Version 5 upgrade summary:
   * Drop tables activity and creator to allow better naming and integer primary key.
   * thanks: 'creator' key (which was the url of a creator) replaced by creator_id
   * donations: 'url' key (which was the url of a creator) replaced by creator_id
   * creators: 'url' becomes multi-valued
   */
  db.version(5)
    .stores({
      activity: null,
      activities: '++id, &url, title, duration, creator_id',
      creator: null,
      creators: '++id, *url, name, ignore',
      thanks: '++id, url, date, title, creator_id',
      donations: '++id, date, creator_id, weiAmount, usdAmount',
    })
    .upgrade(trans => {
      trans.activity
        .toArray()
        .then(activities => trans.activities.bulkAdd(activities))
        .then(() =>
          trans.creator
            .toArray()
            .then(creators =>
              trans.creators.bulkAdd(
                creators.map(c => ({ ...c, url: [c.url] }))
              )
            )
        )
        .then(() =>
          trans.thanks.toCollection().modify(t =>
            trans.creators.get({ url: t.creator }).then(c => {
              t.creator_id = c.id;
              delete t.creator;
            })
          )
        )
        .then(() =>
          trans.donations.toCollection().modify(d =>
            trans.creators.get({ url: d.url }).then(c => {
              d.creator_id = c.id;
              delete d.url;
            })
          )
        );
    });

  registerModel(db, Activity, db.activities, 'url');
  registerModel(db, Creator, db.creators, 'url');
  registerModel(db, Donation, db.donations, 'id');
  registerModel(db, Thank, db.thanks, 'id');

  _db = db;
  return db;
}

export class Database {
  constructor() {
    this.db = dbinit();
  }

  async getActivity(url) {
    return await this.db.activities.get({ url: canonicalizeUrl(url) });
  }

  async getActivities({ limit = 1000, withCreators = null } = {}) {
    let coll = this.db.activities.orderBy('duration').reverse();
    if (withCreators !== null) {
      if (withCreators) {
        coll = coll.filter(a => a.creator !== undefined);
      } else {
        coll = coll.filter(a => a.creator === undefined);
      }
    }
    if (limit && limit >= 0) {
      coll = coll.limit(limit);
    }
    return coll.toArray();
  }

  async getCreator(url) {
    return this.db.creators.get({ url: url });
  }

  async getCreators({
    limit = 100,
    withDurations = false,
    withThanksAmount = false,
  } = {}) {
    let creators = await this.db.creators.limit(limit).toArray();
    if (withDurations) {
      await Promise.all(
        _.map(creators, async c => {
          let activities = await this.getCreatorActivity(c.id);
          c.duration = _.sumBy(activities, 'duration');
          return c;
        })
      );
    }
    if (withThanksAmount) {
      await Promise.all(
        _.map(creators, async c => {
          c.thanksAmount = await this.getCreatorThanksAmount(c.url);
          return c;
        })
      );
    }
    return creators;
  }

  async getCreatorActivity(creator_id) {
    // Get all activity connected to a certain creator
    return this.db.activities
      .where('creator_id')
      .equals(creator_id)
      .toArray();
  }

  async logActivity(url, duration, options = {}) {
    // Adds a duration to a URL if activity for URL already exists,
    // otherwise creates new Activity with the given duration.
    url = canonicalizeUrl(url);
    return this.db.activities
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
        return this.db.activities.put(activity);
      })
      .catch(err => {
        throw 'Could not log activity, ' + err;
      });
  }

  async connectThanksToCreator(url, creator) {
    url = canonicalizeUrl(url);
    await this.db.thanks
      .where('url')
      .equals(url)
      .modify({ creator: creator })
      .catch(err => {
        throw 'Could not connect Thanks to creator, ' + err;
      });
  }

  async connectActivityToCreator(url, creator) {
    url = canonicalizeUrl(url);
    await this.db.activities
      .where('url')
      .equals(url)
      .modify({ creator: creator })
      .catch(err => {
        throw 'Could not connect Activity to creator, ' + err;
      });
  }

  async connectUrlToCreator(url, creator) {
    try {
      url = canonicalizeUrl(url);
      await Promise.all([
        this.connectThanksToCreator(url, creator),
        this.connectActivityToCreator(url, creator),
      ]);
    } catch (err) {
      throw 'Could not connect URL to creator, ' + err;
    }
  }

  async logDonation(creatorUrl, weiAmount, usdAmount, hash) {
    return this.db.donations.add(
      new Donation(creatorUrl, weiAmount.toString(), usdAmount.toString(), hash)
    );
  }

  async getDonation(id) {
    return this.db.donations.get(id).then(d => this.donationWithCreator(d));
  }

  async donationWithCreator(donation) {
    return _.assign(
      await this.getCreator(donation.url),
      _.update(donation, 'date', date => new Date(date))
    );
  }

  async getDonations(limit = 100) {
    return this.db.donations
      .reverse()
      .limit(limit)
      .toArray()
      .then(donations =>
        Promise.all(donations.map(d => this.donationWithCreator(d)))
      )
      .catch(err => {
        console.log("Couldn't get donation history from db:", err);
      });
  }

  async attributeGithubActivity() {
    try {
      // If getActivities() takes a long time to run, consider using:
      //    http://dexie.org/docs/WhereClause/WhereClause.startsWith()
      const logs = _.concat(
        await this.getActivities({ withCreators: false }),
        await this.db.thanks.filter(t => t.creator === undefined).toArray()
      ).filter(a => {
        return a.url.includes('https://github.com/');
      });

      let promises = _.map(logs, async a => {
        let u = new URL(a.url);
        let user_or_org = u.pathname.split('/')[1];
        if (user_or_org.length > 0 && !isReserved.check(user_or_org)) {
          let creator_url = `https://github.com/${user_or_org}`;
          await new Creator(creator_url, user_or_org).save();
          await this.connectUrlToCreator(a.url, creator_url);
        }
      });

      await Promise.all(promises);
      return null;
    } catch (err) {
      throw 'Could not attribute Github activity, ' + err;
    }
  }

  async logThank(url, title, creator_url) {
    return this.db.thanks.add(new Thank(url, title, creator_url)).catch(err => {
      throw 'Logging thank failed: ' + err;
    });
  }

  async getUrlThanksAmount(url) {
    url = canonicalizeUrl(url);
    return this.db.thanks
      .where('url')
      .equals(url)
      .count()
      .catch(err => {
        throw 'Could not count url thanks: ' + err;
      });
  }

  async getCreatorThanksAmount(creator_url) {
    creator_url = canonicalizeUrl(creator_url);
    return this.db.thanks
      .where('creator')
      .equals(creator_url)
      .count()
      .catch(err => {
        throw 'Could not count creator thanks: ' + err;
      });
  }
}
