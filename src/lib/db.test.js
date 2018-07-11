import Dexie from 'dexie';
import _ from 'lodash';

/*
 * Illegal invocation: https://github.com/axemclion/IndexedDBShim/issues/318
import setGlobalVars from 'indexeddbshim';
setGlobalVars();
*/

Dexie.dependencies.indexedDB = require('fake-indexeddb');
Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

import { Database, Activity, Creator } from './db.js';

async function clearDB(db) {
  await db.db.creator.clear();
  await db.db.activity.clear();
  await db.db.donations.clear();
  await db.db.thanks.clear();
}

describe('Activity', () => {
  const db = new Database();
  const url = 'https://www.youtube.com/watch?v=OkFdqqyI8y4';

  beforeEach(async () => {
    await clearDB(db);
  });

  it('logs activity using logActivity', async () => {
    await db.logActivity(url, 13.37);
    let activity = await db.getActivity(url);
    expect(activity.duration).toBeCloseTo(13.37, 3);

    await db.logActivity(url, 10);
    activity = await db.getActivity(url);
    expect(activity.duration).toBeCloseTo(23.37, 3);
  });

  it('logs activity by manually editing the Activity object', async () => {
    let activity = new Activity(url, undefined, 13.37);
    await activity.save();
    activity = await db.getActivity(url);
    expect(activity.duration).toBeCloseTo(13.37, 3);

    activity.duration += 10;
    await activity.save();
    activity = await db.getActivity(url);
    expect(activity.duration).toBeCloseTo(23.37, 3);
  });

  it('get activity filtered by (un)known creators', async () => {
    await db.logActivity(url, 13.37);
    await db.connectActivityToCreator(url, 'https://creatorurl.com');
    await db.logActivity(url + 'qwe', 13.37);
    await db.logActivity(url + 'asd', 13.37);

    let acts_all = await db.getActivities({});
    expect(acts_all).toHaveLength(3);

    let acts_with_creators = await db.getActivities({ withCreators: true });
    _.forEach(acts_with_creators, a => {
      expect(a.creator).not.toEqual(undefined);
    });
    expect(acts_with_creators).toHaveLength(1);

    let acts_without_creators = await db.getActivities({ withCreators: false });
    _.forEach(acts_without_creators, a => {
      expect(a.creator).toEqual(undefined);
    });
    expect(acts_without_creators).toHaveLength(2);
  });
});

describe('Creator', () => {
  const db = new Database();
  const c_name = 'Bethesda Softworks';
  const c_url = 'https://www.youtube.com/channel/UCvZHe-SP3xC7DdOk4Ri8QBw';
  const a_title = 'Elder Scrolls 6 Trailer';
  const a_url = 'https://www.youtube.com/watch?v=OkFdqqyI8y4';

  beforeEach(async () => {
    await clearDB(db);
  });

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

  it('add creator and connect activity to creator', async () => {
    let key = await new Creator(c_url, c_name).save();

    // Test fetching creator by key
    let creator = await db.getCreator(key);
    expect(creator.url).toBe(c_url);
    expect(creator.name).toBe(c_name);

    let activity = new Activity(a_url, a_title, 10);
    await activity.save();
    await db.connectActivityToCreator(activity.url, c_url);

    let creatorActivity = await db.getCreatorActivity(c_url);
    expect(creatorActivity).toHaveLength(1);
    expect(creatorActivity[0].duration).toBeCloseTo(10);
  });

  it('gets duration of all activity by creator', async () => {
    let c_key = await new Creator(c_url, c_name).save();
    let duration = 10;
    await new Activity(a_url, a_title, duration, c_key).save();

    let result = await db.getTimeForCreators();
    expect(result[0].duration).toBeCloseTo(duration);
  });

  it('correctly deletes creator', async () => {
    let creator = await db.getCreator(c_url);
    expect(creator).toBeUndefined(creator);

    await new Creator(c_url, c_name).save();

    creator = await db.getCreator(c_url);
    expect(creator.url).toBe(c_url);
    expect(creator.name).toBe(c_name);
    await creator.delete();

    creator = await db.getCreator(c_url);
    expect(creator).toBeUndefined(creator);
  });
});

describe('GitHub activity', () => {
  const db = new Database();

  beforeEach(async () => {
    await clearDB(db);
  });

  it('attributes activity', async () => {
    let c_url = 'https://github.com/SuperuserLabs';
    let url = 'https://github.com/SuperuserLabs/thankful';
    await db.logActivity(url, 10);
    await db.attributeGithubActivity();
    let activity = await db.getActivity(url);
    expect(activity.creator).toEqual(c_url);
    let creator = await db.getCreator(c_url);
    expect(creator.url).toEqual(c_url);
  });

  it('should not attribute non-user pages', async () => {
    let url = 'https://github.com/orgs/SuperuserLabs';
    await db.logActivity(url, 10);
    await db.attributeGithubActivity();
    let activity = await db.getActivity(url);
    expect(activity.creator).toBeUndefined();
  });
});

describe('Thanks', () => {
  const db = new Database();
  const thxUrl = 'https://www.youtube.com/watch?v=OkFdqqyI8y4';
  const thxUrlNotCanon = thxUrl + '&t=123';
  const thxTitle = 'Elder Scrolls 6 Trailer';
  const thxCreatorUrl =
    'https://www.youtube.com/channel/UCvZHe-SP3xC7DdOk4Ri8QBw';

  beforeEach(async () => {
    await clearDB(db);
  });

  it('Thanks a url and count', async () => {
    await db.logThank(thxUrl, thxTitle);
    await db.logThank(thxUrl, thxTitle);

    expect(await db.getUrlThanksAmount(thxUrl)).toEqual(2);
  });

  it('Thanks a not canon url and count', async () => {
    await db.logThank(thxUrl, thxTitle);
    await db.logThank(thxUrlNotCanon, thxTitle);

    expect(await db.getUrlThanksAmount(thxUrlNotCanon)).toEqual(2);
  });

  it('Attaches a creator to a thank', async () => {
    await db.logThank(thxUrl, thxTitle);
    await db.connectThanksToCreator(thxUrlNotCanon, thxCreatorUrl);

    expect(
      (await db.db.thanks
        .where('url')
        .equals(thxUrl)
        .toArray())[0].creator
    ).toEqual(thxCreatorUrl);
  });

  it('Attaches creator to a thank with connectUrl', async () => {
    await db.logThank(thxUrl, thxTitle);
    await db.connectUrlToCreator(thxUrlNotCanon, thxCreatorUrl);

    expect(
      (await db.db.thanks
        .where('url')
        .equals(thxUrl)
        .toArray())[0].creator
    ).toEqual(thxCreatorUrl);
  });
  // TODO: another test for connectUrl
});
