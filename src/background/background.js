'use strict';

import browser from 'webextension-polyfill';
import { canonicalizeUrl } from '../lib/url.js';
import { valueConstantTicker } from '../lib/calltime.js';
import { Database, Creator } from '../lib/db.js';
import { getCurrentTab } from '../lib/tabs.js';
import { initReminders } from '../lib/reminders.js';
import _ from 'lodash';

/**
 * Returns true if tab is audible or if user was active last 60 seconds.
 */
async function isTabActive(tabInfo) {
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

async function rescheduleAlarm() {
  // Cancels any preexisting heartbeat alarm and then schedules a new one.
  browser.alarms
    .clear('heartbeat')
    .then(() => browser.alarms.create('heartbeat', { periodInMinutes: 1 }));
}

(function() {
  rescheduleAlarm();

  const db = new Database();
  let noContentScript = {};

  const pollTimer = valueConstantTicker(); // tracks time since last poll
  const tabTimers = {};
  const tabTitles = {};

  async function receiveCreator(msg) {
    console.log('receiveCreator: ' + JSON.stringify(msg));
    if (msg.type !== 'creatorFound') {
      return;
    }
    // FIXME: Doing a creator.save() overwrites a preexisting creator object
    await new Creator(msg.creator.url, msg.creator.name).save();
    await db.connectUrlToCreator(
      canonicalizeUrl(msg.activity.url),
      msg.creator.url
    );
  }

  async function stethoscope() {
    try {
      const currentTab = await getCurrentTab();
      const currentTabArray = (await isTabActive(currentTab))
        ? [currentTab]
        : [];
      const audibleTabs = await browser.tabs.query({ audible: true });
      const tabs = _.filter(
        _.unionBy(currentTabArray, audibleTabs, 'url'),
        tab => !tab.incognito
      );

      const timeSinceLastPoll = pollTimer();
      if (timeSinceLastPoll > 70) {
        // If significantly more than 60s, reset timers.
        // This is usually indicative of computer being suspended.
        // See: https://github.com/SuperuserLabs/thankful/issues/61
        console.log('suspend detected, resetting timers');
        _.each(tabTimers, tabTimer => tabTimer());
      }

      const currentUrls = tabs.map(tab => canonicalizeUrl(tab.url));
      const goneUrls = _.difference(Object.keys(tabTimers), currentUrls);
      const stillUrls = _.intersection(Object.keys(tabTimers), currentUrls);
      const newUrls = _.difference(currentUrls, Object.keys(tabTimers));

      goneUrls.forEach(url => {
        const duration = tabTimers[url]();
        const title = tabTitles[url];
        delete tabTimers[url];
        delete tabTitles[url];
        db.logActivity(url, duration, { title: title });
      });
      stillUrls.forEach(url => {
        const duration = tabTimers[url]();
        let title = _.find(tabs, tab => canonicalizeUrl(tab.url) === url).title;
        tabTitles[url] = title;
        db.logActivity(url, duration, { title: title });
      });
      newUrls.forEach(url => {
        tabTimers[url] = valueConstantTicker();
        tabTimers[url]();
        tabTitles[url] = _.find(
          tabs,
          tab => canonicalizeUrl(tab.url) === url
        ).title;
      });
      await rescheduleAlarm();
    } catch (error) {
      console.log(`Stethoscope error: ${error}`);
    }
  }

  function sendPageChange(tabId, changeInfo, tab) {
    browser.tabs
      .sendMessage(tabId, {
        type: 'pageChange',
      })
      .then(() => {
        delete noContentScript[tabId];
      })
      .catch(message => {
        if (!(tabId in noContentScript)) {
          noContentScript[tabId] = true;
          console.log(
            `Error when sending message to content script (maybe not running on this url):
url: ${tab.url}
error: ${JSON.stringify(message)}`
          );
        }
      });
  }

  browser.tabs.onUpdated.addListener(stethoscope);

  browser.tabs.onUpdated.addListener(sendPageChange);

  browser.runtime.onMessage.addListener(receiveCreator);

  browser.idle.onStateChanged.addListener(stethoscope);

  browser.tabs.onActivated.addListener(stethoscope);

  browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'heartbeat') {
      stethoscope();
    }
  });

  initReminders();

  stethoscope();
})();
