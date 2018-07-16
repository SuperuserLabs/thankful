import Dexie from 'dexie';
import _ from 'lodash';
import { canonicalizeUrl } from './url.js';
import isReserved from 'github-reserved-names';
import Promise from 'bluebird';
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

  registerModel(db, Activity, db.activity, 'url');
  registerModel(db, Creator, db.creator, 'url');
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
    return await this.db.activity.get({ url: canonicalizeUrl(url) });
  }

  async getActivities({ limit = 1000, withCreators = null } = {}) {
    let coll = this.db.activity.orderBy('duration').reverse();
    if (withCreators !== null) {
      if (withCreators) {
        coll = coll.filter(a => a.creator !== undefined);
      } else {
        coll = coll.filter(a => a.creator === undefined);
      }
    }
    return coll.limit(limit).toArray();
  }

  async getCreator(url) {
    return this.db.creator.get({ url: url });
  }

  async getCreators({ limit = 100, withTimespent = false } = {}) {
    let creators = await this.db.creator.limit(limit).toArray();
    if (withTimespent) {
      await Promise.all(
        _.map(creators, async c => {
          let activities = await this.getCreatorActivity(c.url);
          c.duration = _.sumBy(activities, 'duration');
          return c;
        })
      );
    }
    return creators;
  }

  async getCreatorActivity(c_url) {
    // Get all activity connected to a certain creator
    return this.db.activity
      .where('creator')
      .equals(c_url)
      .toArray();
  }

  async getTimeForCreators() {
    let creatorCollection = this.db.creator;
    return creatorCollection.toArray(creators => {
      // Query related properties:
      var activityPromises = creators.map(creator =>
        this.getCreatorActivity(creator.url)
      );

      // Await genres and albums queries:
      return Promise.all(activityPromises).then(activities => {
        // Now we have all foreign keys resolved and
        // we can put the results onto the bands array
        // before returning it:
        creators.forEach((creator, i) => {
          creator.duration = _.sum(_.map(activities[i], a => a.duration || 0));
        });
        return creators;
      });
    });
  }

  async logActivity(url, duration, options = {}) {
    // TODO: Use update instead of put if url exists
    // Adds a duration to a URL if activity for URL already exists,
    // otherwise creates new Activity with the given duration.
    url = canonicalizeUrl(url);
    return this.db.activity
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
        return this.db.activity.put(activity);
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
    await this.db.activity
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

  async getDonations(limit = 10) {
    return this.db.donations
      .reverse()
      .limit(limit)
      .toArray()
      .then(donations =>
        Promise.all(donations.map(d => this.getCreator(d.url))).then(names => {
          return _.zip(donations, names)
            .map(p => {
              p[0].creator = p[1].name;
              return p[0];
            })
            .map(d => {
              d.date = new Date(d.date);
              return d;
            });
        })
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
}
