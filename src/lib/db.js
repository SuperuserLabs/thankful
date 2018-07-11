import Dexie from 'dexie';
import _ from 'lodash';
import isReserved from 'github-reserved-names';

let _db = undefined;

// In the future, use private fields instead:
//   https://github.com/tc39/proposal-class-fields
// I thought I could use symbols, but that didn't work out.
let modelAttrs = {};

class Model {
  constructor() {}

  async save() {
    // Does an update if the row already exists, otherwise does a put.
    let keyname = modelAttrs[this.constructor].key;
    let key = this[keyname];
    let table = modelAttrs[this.constructor].table;
    return table.add(this).catch(() => table.update(key, this));
  }

  put() {
    let table = modelAttrs[this.constructor].table;
    return table.put(this);
  }

  delete() {
    let key = this[modelAttrs[this.constructor].key];
    let table = modelAttrs[this.constructor].table;
    return table.delete(key);
  }
}

export class Activity extends Model {
  constructor(url, title, duration, creator) {
    super();
    // Clean title from leading ({number}) as common for
    // notification counters on e.g. YouTube.
    if (title !== undefined) {
      title = title.replace(/^\([0-9]+\)\s*/, '');
    }

    this.url = url;
    this.title = title;
    this.duration = duration;
    this.creator = creator;
  }
}

export class Creator extends Model {
  constructor(url, name, ignore = false) {
    super();
    if (typeof url !== 'string') {
      throw 'url was invalid type';
    }
    this.url = url;
    this.name = name;
    this.ignore = ignore;
  }
}

export class Donation {
  constructor(creatorUrl, weiAmount, usdAmount, transaction) {
    this.date = new Date();
    this.url = creatorUrl;
    this.weiAmount = weiAmount;
    this.usdAmount = usdAmount;
    this.transaction = transaction;
  }
}

export class Database {
  constructor() {
    _db = new Dexie('Thankful');
    _db.version(1).stores({
      activity: '&url, title, duration, creator',
      creator: '&url, name',
    });
    _db.version(2).stores({
      donations: '++id, date, url, weiAmount, usdAmount',
    });
    _db.version(3).stores({
      creator: '&url, name, ignore',
    });

    _db.activity.mapToClass(Activity);
    modelAttrs[Activity.prototype.constructor] = {
      table: _db.activity,
      key: 'url',
    };
    _db.creator.mapToClass(Creator);
    modelAttrs[Creator.prototype.constructor] = {
      table: _db.creator,
      key: 'url',
    };
    _db.donations.mapToClass(Donation);
    modelAttrs[Donation.prototype.constructor] = {
      table: _db.donations,
      key: 'id',
    };
    this.db = _db;
  }

  async getActivity(url) {
    return await this.db.activity.get({ url: url });
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

  async getCreators(limit) {
    return this.db.creator.limit(limit || 100).toArray();
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
    return this.db.activity.get({ url: url }).then(activity => {
      if (activity === undefined) {
        activity = {
          url: url,
          duration: 0,
        };
      }
      activity.duration += duration;
      Object.assign(activity, options);
      return this.db.activity.put(activity);
    });
  }

  async connectActivityToCreator(url, creator) {
    return this.logActivity(url, 0, { creator: creator });
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
          return _.zip(donations, names).map(p => {
            p[0].creator = p[1].name;
            return p[0];
          });
        })
      )
      .catch(err => {
        console.log("Couldn't get donation history from db:", err);
      });
  }

  async attributeGithubActivity() {
    // If getActivities() takes a long time to run, consider using:
    //    http://dexie.org/docs/WhereClause/WhereClause.startsWith()
    let activities = await this.getActivities({ withCreators: false });
    activities = _.filter(activities, a => {
      return a.url.includes('https://github.com/');
    });

    let promises = _.map(activities, async a => {
      let u = new URL(a.url);
      let user_or_org = u.pathname.split('/')[1];
      if (user_or_org.length > 0 && !isReserved.check(user_or_org)) {
        let creator_url = `https://github.com/${user_or_org}`;
        await new Creator(creator_url, user_or_org).save();
        await this.connectActivityToCreator(a.url, creator_url);
      }
    });

    await Promise.all(promises);
    return null;
  }
}
