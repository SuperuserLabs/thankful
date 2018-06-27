import Dexie from 'dexie';
import Promise from 'bluebird';
import _ from 'lodash';

let _db = undefined;

export class Activity {
  constructor(url, title, duration, creator) {
    this.url = url;
    this.title = title;
    this.duration = duration;
    this.creator = creator;
  }

  save() {
    return _db.activity.put(this);
  }
}

export class Creator {
  constructor(url, name) {
    if (typeof url !== 'string') {
      throw 'url was invalid type';
    }
    this.url = url;
    this.name = name;
  }

  save() {
    return _db.creator.put(this);
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

    _db.activity.mapToClass(Activity);
    _db.creator.mapToClass(Creator);
    _db.donations.mapToClass(Donation);
    this.db = _db;
  }

  getActivity(url) {
    return this.db.activity.get({ url: url });
  }

  getActivities({ limit = 100, withCreators = null } = {}) {
    let coll = this.db.activity;
    if (withCreators !== null) {
      if (withCreators) {
        coll = coll.filter(a => a.creator !== undefined);
      } else {
        coll = coll.filter(a => a.creator === undefined);
      }
    }
    return coll.limit(limit).toArray();
  }

  getCreator(url) {
    return this.db.creator.get({ url: url });
  }

  getCreators(limit) {
    return this.db.creator.limit(limit || 100).toArray();
  }

  getCreatorActivity(c_url) {
    // Get all activity connected to a certain creator
    return this.db.activity
      .where('creator')
      .equals(c_url)
      .toArray();
  }

  getTimeForCreators() {
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

  logActivity(url, duration, options = {}) {
    // TODO: Use update instead of put if url exists
    // Adds a duration to a URL if activity for URL already exists,
    // otherwise creates new Activity with the given duration.
    return this.db.activity.get({ url: url }).then(activity => {
      if (activity === undefined) {
        activity = Object.assign(
          {
            url: url,
            duration: 0,
          },
          options
        );
      }
      activity.duration += duration;
      return this.db.activity.put(activity);
    });
  }

  connectActivityToCreator(url, creator) {
    return this.db.activity.update(url, { creator: creator });
  }

  logDonation(creatorUrl, weiAmount, usdAmount, hash) {
    return this.db.donations.add(
      new Donation(creatorUrl, weiAmount.toString(), usdAmount.toString(), hash)
    );
  }

  getDonations(limit = 10) {
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
}
