import browser from 'webextension-polyfill';
import { find, difference, intersection, each, unionBy, filter } from 'lodash';

import { dbListener } from './messaging.ts';
import { canonicalizeUrl } from '~/lib/url.ts';
import { valueConstantTicker } from '~/lib/calltime.ts';
import { getDatabase } from '~/lib/db.ts';
import { getCurrentTab } from '~/lib/tabs.js';
import { initReminders } from '~/lib/reminders.js';

// Returns true if tab is audible or if user was active last 60 seconds.
async function isTabActive(tabInfo): Promise<boolean> {
  return new Promise(resolve => {
    let detectionIntervalInSeconds = 60;
    if (tabInfo.audible) {
      resolve(true);
    } else {
      browser.idle
        .queryState(detectionIntervalInSeconds)
        .then(newState => resolve(newState == 'active'));
    }
  });
}

// Cancels any preexisting heartbeat alarm and then schedules a new one.
async function rescheduleAlarm() {
  browser.alarms
    .clear('heartbeat')
    .then(() => browser.alarms.create('heartbeat', { periodInMinutes: 1 }));
}

(function() {
  rescheduleAlarm();

  const db = getDatabase();
  let noContentScript = {};

  const pollTimer = valueConstantTicker(); // tracks time since last poll
  const tabTimers = {};
  const tabTitles = {};

  // TODO: Replace with dbListener stuff
  function receiveCreator(msg) {
    if (msg.type !== 'creatorFound') {
      return false;
    }
    return (async () => {
      console.log('receiveCreator: ' + JSON.stringify(msg));
      // FIXME: Doing a creator.save() overwrites a preexisting creator object
      await db.updateCreator(msg.creator.url, msg.creator.name);

      await db.connectUrlToCreator(
        canonicalizeUrl(msg.activity.url),
        msg.creator.url
      );
    })();
  }

  // TODO: Refactor out logging logic into seperate file
  async function stethoscope() {
    try {
      const currentTab = await getCurrentTab();
      const currentTabArray = (await isTabActive(currentTab))
        ? [currentTab]
        : [];
      const audibleTabs = await browser.tabs.query({ audible: true });
      const tabs = filter(
        unionBy(currentTabArray, audibleTabs, 'url'),
        tab => !tab.incognito
      );

      const timeSinceLastPoll = pollTimer();
      if (timeSinceLastPoll > 70) {
        // If significantly more than 60s, reset timers.
        // This is usually indicative of computer being suspended.
        // See: https://github.com/SuperuserLabs/thankful/issues/61
        console.log('suspend detected, resetting timers');
        each(tabTimers, tabTimer => tabTimer());
      }

      const currentUrls = tabs.map(tab => canonicalizeUrl(tab.url));
      const goneUrls = difference(Object.keys(tabTimers), currentUrls);
      const stillUrls = intersection(Object.keys(tabTimers), currentUrls);
      const newUrls = difference(currentUrls, Object.keys(tabTimers));

      goneUrls.forEach(url => {
        const duration = tabTimers[url]();
        const title = tabTitles[url];
        delete tabTimers[url];
        delete tabTitles[url];
        db.logActivity(url, duration, { title: title });
      });
      stillUrls.forEach(url => {
        const duration = tabTimers[url]();
        let title = find(tabs, tab => canonicalizeUrl(tab.url) === url).title;
        tabTitles[url] = title;
        db.logActivity(url, duration, { title: title });
      });
      newUrls.forEach(url => {
        tabTimers[url] = valueConstantTicker();
        tabTimers[url]();
        tabTitles[url] = find(
          tabs,
          tab => canonicalizeUrl(tab.url) === url
        ).title;
      });
      await rescheduleAlarm();
    } catch (error) {
      console.log(`Stethoscope error: ${error}`);
    }
  }

  async function sendPageChange(tabId, changeInfo, tab): Promise<any> {
    let r_specialPages = /(about|moz-extension):/;
    if (r_specialPages.test(tab.url)) {
      return;
    }
    try {
      await browser.tabs.sendMessage(tabId, {
        type: 'pageChange',
      });
      delete noContentScript[tabId];
    } catch (msg) {
      if (!(tabId in noContentScript)) {
        noContentScript[tabId] = true;
        console.log(
          `Error when sending message to content script (maybe not running on this url):
url: ${tab.url}
error: ${JSON.stringify(msg)}`
        );
      }
    }
  }

  // Register tab/idle listeners for logging
  // TODO: Clean these up
  browser.tabs.onUpdated.addListener(stethoscope);
  browser.tabs.onUpdated.addListener(sendPageChange);
  browser.tabs.onActivated.addListener(stethoscope);
  browser.idle.onStateChanged.addListener(stethoscope);
  browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'heartbeat') {
      stethoscope();
    }
  });

  // Register message listeners
  browser.runtime.onMessage.addListener(receiveCreator);
  browser.runtime.onMessage.addListener(dbListener);

  // Register on-install listeners
  browser.runtime.onInstalled.addListener(details => {
    if (details.reason == 'install') {
      browser.tabs.create({
        url: 'dashboard/index.html#/onboarding/welcome',
      });
    }
  });

  // Initialization
  initReminders(db);
  stethoscope();
  db.initThankfulTeamCreator();
})();
