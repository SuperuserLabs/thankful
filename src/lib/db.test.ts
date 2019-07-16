import Dexie from 'dexie';
import { forEach } from 'lodash';
import BigNumber from 'bignumber.js';

/*
 * Illegal invocation: https://github.com/axemclion/IndexedDBShim/issues/318
import setGlobalVars from 'indexeddbshim';
setGlobalVars();
*/

Dexie.dependencies.indexedDB = require('fake-indexeddb');
Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

import { Database } from './db.ts';

async function clearDB(db) {
  await db.creators.clear();
  await db.activities.clear();
  await db.donations.clear();
  await db.thanks.clear();
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

    await db.updateCreator(c_url, { name: 'dummy' });
    let id = (await db.getCreator(c_url)).id;

    await db.connectActivityToCreator(url, id);
    await db.logActivity(url + 'qwe', 13.37);
    await db.logActivity(url + 'asd', 13.37);

    let acts_all = await db.getActivities({});
    expect(acts_all).toHaveLength(3);

    let acts_with_creators = await db.getActivities({ withCreators: true });
    forEach(acts_with_creators, a => {
      expect(a.creator_id).not.toEqual(undefined);
    });
    expect(acts_with_creators).toHaveLength(1);

    let acts_without_creators = await db.getActivities({ withCreators: false });
    forEach(acts_without_creators, a => {
      expect(a.creator_id).toEqual(undefined);
    });
    expect(acts_without_creators).toHaveLength(2);
  });

  it('Attaches creator to an activity with connectUrl', async () => {
    const c_url = 'https://creatorurl.com';
    await db.logActivity(url, 12.5);

    await db.updateCreator(c_url, { name: 'dummy' });
    let creatorId = (await db.getCreator(c_url)).id;

    await db.connectUrlToCreator(url, c_url);

    expect(
      (await db.activities
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
    await db.updateCreator(c_url, { name: c_name });
    await db.updateCreator('testurl', { name: 'testname' });

    let creators = await db.getCreators();
    expect(creators).toHaveLength(2);
  });

  it("get creator that doesn't exist", async () => {
    let creator = await db.getCreator('https://notarealcreator.com');
    expect(creator).toBeNull();

    creator = await db.getCreatorWithId(666666);
    expect(creator).toBeNull();
  });

  it('correctly adds creator', async () => {
    await db.updateCreator(c_url, { name: c_name });

    let creator = await db.getCreator(c_url);
    expect(creator.url[0]).toBe(c_url);
    expect(creator.name).toBe(c_name);
  });

  it('get creator with multiple urls', async () => {
    let c_url2 = 'https://test.com';
    await db.updateCreator(c_url, { name: c_name, url: [c_url, c_url2] });

    let creator1 = await db.getCreator(c_url);
    expect(creator1).not.toBeNull();
    expect(creator1.url).toHaveLength(2);

    let creator2 = await db.getCreator(c_url2);
    expect(creator1).not.toBeNull();
    expect(creator2.url[0]).toBe(c_url);
    expect(creator2.url[1]).toBe(c_url2);
    expect(creator2.name).toBe(c_name);
  });

  it('correctly updates creator', async () => {
    await db.updateCreator(c_url, { name: c_name });

    let creator = await db.getCreator(c_url);
    expect(creator.url[0]).toBe(c_url);
    expect(creator.name).toBe(c_name);
    expect(creator.ignore).toBe(false);

    await db.updateCreator(c_url, { ignore: true });
    let updatedCreator = await db.getCreator(c_url);
    expect(updatedCreator.url[0]).toBe(c_url);
    expect(updatedCreator.name).toBe(c_name);
    expect(updatedCreator.ignore).toBe(true);
  });

  it('add creator and connect activity to creator', async () => {
    await db.updateCreator(c_url, { name: c_name });

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
    await db.updateCreator(c_url, { name: c_name });

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
    await db.attributeActivity();
    let activity = await db.getActivity(url);
    let creator = await db.getCreator(c_url);
    expect(activity.creator_id).toEqual(creator.id);
    expect(creator.url[0]).toEqual(c_url);
  });

  it('should not attribute non-user pages', async () => {
    let url = 'https://github.com/orgs/SuperuserLabs';
    await db.logActivity(url, 10);
    await db.attributeActivity();
    let activity = await db.getActivity(url);
    expect(activity.creator).toBeUndefined();
  });
});

describe('Attribute addresses from registry', () => {
  const db = new Database();

  beforeEach(async () => {
    await clearDB(db);
  });

  it('attributes activity for domain', async () => {
    let c_url = 'https://archive.org/';
    let a_url = 'https://archive.org/';
    let expected_address = '0xFA8E3920daF271daB92Be9B87d9998DDd94FEF08';

    await db.logActivity(a_url, 10);
    await db.attributeActivity();
    await db._attributeActivityToCreatorFromRegistry();

    let activity = await db.getActivity(a_url);
    let creator = await db.getCreator(c_url);

    // Test that activity has been attributed
    expect(activity.creator_id).toEqual(creator.id);

    // Test that creator was successfully imported
    expect(creator).not.toEqual(null);
    expect(creator.name).toEqual('Internet Archive');
    // TODO: Test that all urls for the creator are included
    expect(creator.url[0]).toEqual(c_url);
    expect(creator.address).toEqual(expected_address);
  });

  it('attributes address to YouTube channel', async () => {
    let c_url = 'https://www.youtube.com/channel/UCNOfzGXD_C9YMYmnefmPH0g';
    await db.updateCreator(c_url, { name: 'Ethereum Foundation' });
    await db._attributeAddressToCreatorFromRegistry();

    // Just a mock entry that won't match anything in the registry
    await db.updateCreator('https://test.com/asdasdad', { name: 'test' });

    let creator = await db.getCreator(c_url);
    expect(creator.name).toBe('Ethereum Foundation');
    expect(creator.address).toBe('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');
  });

  it('attributes address to GitHub user', async () => {
    let c_url = 'https://github.com/ethereum';
    await db.updateCreator(c_url, { name: 'Ethereum Foundation' });
    await db._attributeAddressToCreatorFromRegistry();

    let creator = await db.getCreator(c_url);
    expect(creator.name).toBe('Ethereum Foundation');
    expect(creator.address).toBe('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');
    // TODO
  });

  it("doesn't duplicate creators when updating existing creator with new URL", async () => {
    let a_url = 'https://github.com/SuperuserLabs/thankful';
    let c_urls = [
      'https://superuserlabs.github.io',
      'https://github.com/SuperuserLabs',
    ];
    await db.updateCreator(c_urls[1], { name: 'SuperuserLabs' });
    await db.updateCreator(c_urls[0], { name: 'SuperuserLabs', url: c_urls });

    let creator1 = await db.getCreator(c_urls[0]);
    let creator2 = await db.getCreator(c_urls[1]);
    expect(creator1).toEqual(creator2);
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

    await db.updateCreator(thxCreatorUrl, { name: thxCreatorName });
    let creator = await db.getCreator(thxCreatorUrl);

    await db.connectUrlToCreator(thxUrlNotCanon, thxCreatorUrl);

    expect(await db.getCreatorThanksAmount(creator.id)).toEqual(2);
  });

  it('Attaches a creator to a thank', async () => {
    await db.logThank(thxUrl, thxTitle);

    await db.updateCreator(thxCreatorUrl, { name: thxCreatorName });
    let id = (await db.getCreator(thxCreatorUrl)).id;

    await db.connectThanksToCreator(thxUrlNotCanon, id);

    expect(
      (await db.thanks
        .where('url')
        .equals(thxUrl)
        .toArray())[0].creator_id
    ).toEqual(id);
  });

  it('Attaches creator to a thank with connectUrl', async () => {
    await db.logThank(thxUrl, thxTitle);

    await db.updateCreator(thxCreatorUrl, { name: thxCreatorName });
    let id = (await db.getCreator(thxCreatorUrl)).id;

    await db.connectUrlToCreator(thxUrlNotCanon, thxCreatorUrl);

    expect(
      (await db.thanks
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

  const net_id = 1;

  beforeEach(async () => {
    await clearDB(db);
  });

  it('Logs one donation and reads it', async () => {
    await db.updateCreator(c_url, { name: c_name });
    const creatorId = (await db.getCreator(c_url)).id;

    const donationId = await db.logDonation(
      creatorId,
      weiAmount.toString(),
      usdAmount.toString(),
      txHash,
      net_id
    );

    const donation = await db.getDonation(donationId);

    expect(donation.weiAmount).toEqual(weiAmount.toString());
    expect(donation.creator_id).not.toBeNull();
  });

  it('Logs a few donations and reads them', async () => {
    await db.updateCreator(c_url, { name: c_name });
    const creatorId = (await db.getCreator(c_url)).id;

    await db.logDonation(
      creatorId,
      weiAmount.toString(),
      usdAmount.toString(),
      txHash,
      net_id
    );
    await db.logDonation(
      creatorId,
      weiAmount.mul('2').toString(),
      usdAmount.mul('2').toString(),
      '0xe46e63549fc0453da0afa8ac79a87b4baae9a70759a82bee19abd81665b0463b',
      net_id
    );
    await db.logDonation(
      creatorId,
      weiAmount.mul('3').toString(),
      usdAmount.mul('3').toString(),
      '0x42bd00f4701b7d24dc3e3acd0ee7c7333e57c2b77532f012994bbcefca7cc726',
      net_id
    );

    const donations = await db.getDonations();

    expect(donations[1].usdAmount.toString()).toEqual(
      usdAmount.mul('2').toString()
    );
  });
});
