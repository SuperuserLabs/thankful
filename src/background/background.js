'use strict';

import browser from 'webextension-polyfill';
import { canonicalizeUrl } from '../lib/url.js';
import { valueConstantTicker } from '../lib/calltime.js';
import { Database, Creator } from '../lib/db.js';
import { getCurrentTab, openDashboardTab } from '../lib/tabs.js';
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

  // These variables are in milliseconds
  const donationInterval = 1000 * 60 * 60 * 24 * 7; // One week
  const toastInterval = 1000 * 60 * 60 * 24; // 24 hours
  // Could use browser.runtime.connect for faster updates and less frequent
  // polling but that feels like unnecessary complexity
  // Don't use browser.storage.onChanged.addListener, it spams events for
  // no reason
  // Could also observe the db but there doesn't seem to be a light way to do
  // that
  // This variable is in minutes
  const reminderCheckInterval = 5 / 60; // 5 seconds

  // We'll toast when the browser starts
  let lastToast = new Date(0);

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
    } else if (alarm.name === 'reminderCheck') {
      reminderCheck();
    }
  });

  // This is outside vuex because we use it in background.js
  async function isTimeToDonate() {
    return db.getDonations(1).then(([lastDonation]) => {
      // When the user hasn't donated yet, we won't know when to remind them
      // to "donate again". But that might be nice, not telling them to
      // donate until we know that they *can* donate.
      const lastTime =
        lastDonation === undefined ? new Date(0) : new Date(lastDonation.date);
      return new Date() - lastTime > donationInterval;
    });
  }

  function reminderCheck() {
    isTimeToDonate()
      .then(shouldDonate => {
        if (shouldDonate) {
          browser.browserAction.setBadgeBackgroundColor({
            color: 'ForestGreen',
          });
          browser.browserAction.setBadgeText({ text: '🔔' });
          browser.browserAction.setTitle({
            title: 'Thankful: Reminder to donate',
          });

          if (new Date() - lastToast > toastInterval) {
            // TODO: Add the logo to the notification
            browser.notifications.create({
              type: 'basic',
              title: 'Thankful: Reminder to donate 🔔',
              message:
                "You haven't donated in a while, click here to go to the donation dashboard",
            });
            lastToast = new Date();
          }
        } else {
          browser.browserAction.setBadgeText({ text: '' });
          browser.browserAction.setTitle({ title: 'Thankful' });
        }
      })
      .catch(err => {
        console.error('Could not get reminderTimes:', err);
      });
  }

  browser.notifications.onClicked.addListener(openDashboardTab);

  reminderCheck();
  browser.alarms.create('reminderCheck', {
    periodInMinutes: reminderCheckInterval,
  });

  stethoscope();
})();
