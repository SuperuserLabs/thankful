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
  constructor(url, name, duration, creator) {
    this.url = url;
    this.name = name;
    this.duration = duration;
    this.creator = creator;
  }

  save() {
    return _db.creator.put(this);
  }
}

export class Database {
  constructor() {
    _db = new Dexie('Thankful');
    _db.version(1).stores({
      activity: '&url, title, duration, creator_id',
      creator: '++id, &url, name',
    });
    _db.activity.mapToClass(Activity);
    _db.creator.mapToClass(Creator);
    this.db = _db;
  }

  getActivity(url) {
    return this.db.activity.get({ url: url });
  }

  addActivity(url, duration, title, creator) {
    // Adds a duration to a URL if activity for URL already exists,
    // otherwise creates new Activity with the given duration.
    return this.db.activity.get({ url: url }).then(activity => {
      if (activity === undefined) {
        activity = { url: url, duration: 0, title: title };
      }
      activity.duration += duration;
      return this.db.activity.put(activity);
    });
  }

  getCreator(url) {
    return this.db.creator.get({ url: url });
  }
}
