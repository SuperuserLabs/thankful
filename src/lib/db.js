import Dexie from 'dexie';

export class Database {
  constructor() {
    this.db = new Dexie('thankful');
    this.db.version(1).stores({
      activity: 'url, title, duration, creator',
      creator: 'url, title',
    });
  }

  getActivity(url) {
    return this.db.activity.get({ url: url });
  }

  addActivity(url, duration) {
    return this.db.activity.get({ url: url }).then(activity => {
      if (activity === undefined) {
        activity = { url: url, duration: 0 };
      }
      activity.duration += duration;
      return this.db.activity.put(activity);
    });
  }
}
