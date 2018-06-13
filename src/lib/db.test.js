import assert from 'assert';

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
      .addActivity(url, 13.37)
      .then(() => {
        return db.getActivity(url);
      })
      .then(activity => {
        assert(activity.duration == 13.37);
      })
      .then(_ => {
        return db.addActivity(url, 10);
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
  let name = 'Bethesda Softworks';
  let url = 'https://www.youtube.com/channel/UCvZHe-SP3xC7DdOk4Ri8QBw';

  it('correctly adds creator', () => {
    let creator = new Creator(url, name);
    return creator
      .save()
      .then(() => {
        return db.getCreator(url);
      })
      .then(activity => {
        expect(creator.url).toBe(url);
        expect(creator.name).toBe(name);
      });
  });
});
