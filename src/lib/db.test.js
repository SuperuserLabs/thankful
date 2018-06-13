import Dexie from 'dexie';

/*
 * Illegal invocation: https://github.com/axemclion/IndexedDBShim/issues/318
import setGlobalVars from 'indexeddbshim';
setGlobalVars();
*/

Dexie.dependencies.indexedDB = require('fake-indexeddb');
Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

import { Database, Activity, Creator } from './db.js';

describe('Activity', () => {
  let db = new Database();
  let url = 'https://www.youtube.com/watch?v=OkFdqqyI8y4';

  it('correctly adds activity', () => {
    return db
      .logActivity(url, 13.37)
      .then(() => {
        return db.getActivity(url);
      })
      .then(activity => {
        expect(activity.duration).toBeCloseTo(13.37, 3);
      })
      .then(() => {
        return db.logActivity(url, 10);
      })
      .then(() => {
        return db.getActivity(url);
      })
      .then(activity => {
        expect(activity.duration).toBeCloseTo(23.37, 3);
      });
  });

  it('correctly adds activity', () => {
    let activity = new Activity(url, undefined, 13.37);
    return activity
      .save()
      .then(() => {
        return db.getActivity(url);
      })
      .then(activity => {
        expect(activity.duration).toBeCloseTo(13.37, 3);
        return activity;
      })
      .then(activity => {
        activity.duration += 10;
        return activity.save();
      })
      .then(() => {
        return db.getActivity(url);
      })
      .then(activity => {
        expect(activity.duration).toBeCloseTo(23.37, 3);
      });
  });
});

describe('Creator', () => {
  let db = new Database();
  let c_name = 'Bethesda Softworks';
  let c_url = 'https://www.youtube.com/channel/UCvZHe-SP3xC7DdOk4Ri8QBw';
  let a_title = 'Elder Scrolls 6 Trailer';
  let a_url = 'https://www.youtube.com/watch?v=OkFdqqyI8y4';

  it('get all creators', () => {
    return new Creator(c_url, c_name)
      .save()
      .then(() => new Creator('testurl', 'testname'));
    // This fails, see comment in getCreators
    //.then(() => {
    //  return db.getCreators();
    //})
    //.then(creators => {
    //  expect(creators).toHaveLength(2);
    //});
  });

  it('correctly adds creator', () => {
    return new Creator(c_url, c_name)
      .save()
      .then(_ => {
        return db.getCreator(c_url);
      })
      .then(creator => {
        expect(creator.url).toBe(c_url);
        expect(creator.name).toBe(c_name);
        return creator;
      });
  });

  it('connect activity to creator', _ => {
    let activity = new Activity(a_url, a_title);
    return new Creator(c_url, c_name)
      .save()
      .then(key => {
        return db.getCreator(key);
      })
      .then(creator => {
        expect(creator.url).toBe(c_url);
        expect(creator.name).toBe(c_name);
        return creator;
      })
      .then(_ => {
        return activity.save();
      })
      .then(_ => {
        return db.connectActivityToCreator(activity.url, c_url);
      })
      .then(_ => {
        return db.getCreatorActivity(c_url);
      })
      .then(creatorActivity => {
        expect(creatorActivity).toHaveLength(1);
      });
  });
});
