import Dexie from 'dexie';
import _ from 'lodash';
import BigNumber from 'bignumber.js';

/*
 * Illegal invocation: https://github.com/axemclion/IndexedDBShim/issues/318
import setGlobalVars from 'indexeddbshim';
setGlobalVars();
*/

Dexie.dependencies.indexedDB = require('fake-indexeddb');
Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

import { Database } from './db.js';

async function clearDB(db) {
  await db.db.creators.clear();
  await db.db.activities.clear();
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

  it('get activity filtered by (un)known creators', async () => {
    const c_url = 'https://creatorurl.com';
    await db.logActivity(url, 13.37);

    await db.updateCreator(c_url, 'dummy');
    let id = (await db.getCreator(c_url)).id;

    await db.connectActivityToCreator(url, id);
    await db.logActivity(url + 'qwe', 13.37);
    await db.logActivity(url + 'asd', 13.37);

    let acts_all = await db.getActivities({});
    expect(acts_all).toHaveLength(3);

    let acts_with_creators = await db.getActivities({ withCreators: true });
    _.forEach(acts_with_creators, a => {
      expect(a.creator_id).not.toEqual(undefined);
    });
    expect(acts_with_creators).toHaveLength(1);

    let acts_without_creators = await db.getActivities({ withCreators: false });
    _.forEach(acts_without_creators, a => {
      expect(a.creator_id).toEqual(undefined);
    });
    expect(acts_without_creators).toHaveLength(2);
  });

  it('Attaches creator to an activity with connectUrl', async () => {
    const c_url = 'https://creatorurl.com';
    await db.logActivity(url, 12.5);

    await db.updateCreator(c_url, 'dummy');
    let creatorId = (await db.getCreator(c_url)).id;

    await db.connectUrlToCreator(url, c_url);

    expect(
      (await db.db.activities
        .where('url')
        .equals(url)
        .toArray())[0].creator_id
    ).toEqual(creatorId);
  });
});

describe('Creator', () => {
  const db = new Database();
  const c_name = 'Bethesda Softworks';
  const c_url = 'https://www.youtube.com/channel/UCvZHe-SP3xC7DdOk4Ri8QBw';
  const a_url = 'https://www.youtube.com/watch?v=OkFdqqyI8y4';

  beforeEach(async () => {
    await clearDB(db);
  });

  it('get all creators', async () => {
    await db.updateCreator(c_url, c_name);
    await db.updateCreator('testurl', 'testname');

    let creators = await db.getCreators();
    expect(creators).toHaveLength(2);
  });

  it('correctly adds creator', async () => {
    await db.updateCreator(c_url, c_name);

    let creator = await db.getCreator(c_url);
    expect(creator.url[0]).toBe(c_url);
    expect(creator.name).toBe(c_name);
  });

  it('add creator and connect activity to creator', async () => {
    await db.updateCreator(c_url, c_name);

    // Test fetching creator by url
    let creator = await db.getCreator(c_url);
    expect(creator.url[0]).toBe(c_url);
    expect(creator.name).toBe(c_name);

    await db.logActivity(a_url, 10);
    let activity = await db.getActivity(a_url);
    expect(activity.url).toBe(a_url);
    await db.connectActivityToCreator(activity.url, creator.id);

    let creatorActivity = await db.getCreatorActivity(creator.id);
    expect(creatorActivity).toHaveLength(1);
    expect(creatorActivity[0].duration).toBeCloseTo(10);
  });

  it('gets duration of all activity by creator', async () => {
    await db.updateCreator(c_url, c_name);

    let creatorKey = (await db.getCreator(c_url)).id;
    let duration = 10;
    db.logActivity(a_url, duration, { creator_id: creatorKey });

    let result = await db.getCreators({ withDurations: true });
    expect(result[0].duration).toBeCloseTo(duration);
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
    let creator = await db.getCreator(c_url);
    expect(activity.creator_id).toEqual(creator.id);
    expect(creator.url[0]).toEqual(c_url);
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
  const thxCreatorName = 'John Doe';

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

  it('Thanks a not canon url, attaches to a creator, and counts creator thanks', async () => {
    await db.logThank(thxUrl, thxTitle);
    await db.logThank(thxUrlNotCanon, thxTitle);

    await db.updateCreator(thxCreatorUrl, thxCreatorName);
    let creator = await db.getCreator(thxCreatorUrl);

    await db.connectUrlToCreator(thxUrlNotCanon, thxCreatorUrl);

    expect(await db.getCreatorThanksAmount(creator.id)).toEqual(2);
  });

  it('Attaches a creator to a thank', async () => {
    await db.logThank(thxUrl, thxTitle);

    await db.updateCreator(thxCreatorUrl, thxCreatorName);
    let id = (await db.getCreator(thxCreatorUrl)).id;

    await db.connectThanksToCreator(thxUrlNotCanon, id);

    expect(
      (await db.db.thanks
        .where('url')
        .equals(thxUrl)
        .toArray())[0].creator_id
    ).toEqual(id);
  });

  it('Attaches creator to a thank with connectUrl', async () => {
    await db.logThank(thxUrl, thxTitle);

    await db.updateCreator(thxCreatorUrl, thxCreatorName);
    let id = (await db.getCreator(thxCreatorUrl)).id;

    await db.connectUrlToCreator(thxUrlNotCanon, thxCreatorUrl);

    expect(
      (await db.db.thanks
        .where('url')
        .equals(thxUrl)
        .toArray())[0].creator_id
    ).toEqual(id);
  });
});

describe('DonationHistory', () => {
  const db = new Database();

  // The wei/usd ratio is approximately correct here
  const weiAmount = new BigNumber('100000000000000000');
  const usdAmount = new BigNumber('10');
  const txHash =
    '0xe67578571c996711147b9d728b1507976d19a30c271b08bdc3c490f645d155e1';

  const c_name = 'Bethesda Softworks';
  const c_url = 'https://www.youtube.com/channel/UCvZHe-SP3xC7DdOk4Ri8QBw';

  beforeEach(async () => {
    await clearDB(db);
  });

  it('Logs one donation and reads it', async () => {
    await db.updateCreator(c_url, c_name);
    const creatorId = (await db.getCreator(c_url)).id;

    const donationId = await db.logDonation(
      creatorId,
      weiAmount.toString(),
      usdAmount.toString(),
      txHash
    );

    const donation = await db.getDonation(donationId);

    expect(donation.weiAmount).toEqual(weiAmount.toString());
  });
});
