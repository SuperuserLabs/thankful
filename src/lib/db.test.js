import assert from 'assert';
import { Database } from './db.js';

import Dexie from 'dexie';
Dexie.dependencies.indexedDB = require('fake-indexeddb');
Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

describe('addActivity', () => {
  it('correctly adds activity', () => {
    let db = new Database();
    let url = 'https://youtube.com/watch?v=test';
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
        assert(activity.duration.toFixed(3) == 23.37);
      });
  });
});
