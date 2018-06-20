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
  const db = new Database();
  const url = 'https://www.youtube.com/watch?v=OkFdqqyI8y4';

  it('correctly adds activity', async () => {
    await db.logActivity(url, 13.37);
    let activity = await db.getActivity(url);
    expect(activity.duration).toBeCloseTo(13.37, 3);

    await db.logActivity(url, 10);
    activity = await db.getActivity(url);
    expect(activity.duration).toBeCloseTo(23.37, 3);
  });

  it('correctly adds activity', async () => {
    let activity = new Activity(url, undefined, 13.37);
    await activity.save();
    activity = await db.getActivity(url);
    expect(activity.duration).toBeCloseTo(13.37, 3);

    activity.duration += 10;
    await activity.save();
    activity = await db.getActivity(url);
    expect(activity.duration).toBeCloseTo(23.37, 3);
  });
});

describe('Creator', () => {
  const db = new Database();
  const c_name = 'Bethesda Softworks';
  const c_url = 'https://www.youtube.com/channel/UCvZHe-SP3xC7DdOk4Ri8QBw';
  const a_title = 'Elder Scrolls 6 Trailer';
  const a_url = 'https://www.youtube.com/watch?v=OkFdqqyI8y4';

  it('get all creators', async () => {
    await new Creator(c_url, c_name).save();
    await new Creator('testurl', 'testname').save();

    let creators = await db.getCreators();
    expect(creators).toHaveLength(2);
  });

  it('correctly adds creator', async () => {
    await new Creator(c_url, c_name).save();

    let creator = await db.getCreator(c_url);
    expect(creator.url).toBe(c_url);
    expect(creator.name).toBe(c_name);
  });

  it('connect activity to creator', async () => {
    let key = await new Creator(c_url, c_name).save();

    // Test fetching creator by key
    let creator = await db.getCreator(key);
    expect(creator.url).toBe(c_url);
    expect(creator.name).toBe(c_name);

    let activity = new Activity(a_url, a_title);
    await activity.save();
    await db.connectActivityToCreator(activity.url, c_url);

    let creatorActivity = await db.getCreatorActivity(c_url);
    expect(creatorActivity).toHaveLength(1);
  });
});