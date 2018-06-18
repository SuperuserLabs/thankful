import Dexie from 'dexie';

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
    this.url = url;
    this.name = name;
  }

  save() {
    return _db.creator.put(this);
  }
}

export class Database {
  constructor() {
    _db = new Dexie('Thankful');
    _db.version(1).stores({
      activity: '&url, title, duration, creator',
      creator: '&url, name',
    });
    _db.activity.mapToClass(Activity);
    _db.creator.mapToClass(Creator);
    this.db = _db;
  }

  getActivity(url) {
    return this.db.activity.get({ url: url });
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

  logActivity(url, duration, options = {}) {
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
    return this.db.activity.put({ url: url, creator: creator });
  }
}
