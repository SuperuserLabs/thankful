'use strict';

import browser from 'webextension-polyfill';
import { valueConstantTicker } from '../lib/calltime.js';
import { Database, Activity, Creator } from '../lib/db.js';

const sinceLastCall = valueConstantTicker();

/**
 * Returns true if tab is audible or if user was active last 60 seconds.
 *
 * This is an asychronous function that returns a Promise.
 */
function isTabActive(tabInfo) {
  return new Promise((resolve, reject) => {
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

function heartbeat(tabInfo, db, oldUrl, oldTitle) {
  isTabActive(tabInfo)
    .then(active => {
      if (active) {
        if (oldUrl) {
          let url = tabInfo.url;
          let duration = sinceLastCall(oldUrl);

          db.logActivity(oldUrl, duration, { title: oldTitle });

          sinceLastCall(url);

          rescheduleAlarm();
        }
      } else {
        throw new Error('Not active, not logging');
      }
    })
    .catch(error => {
      console.log(error);
      sinceLastCall();
    });
}

function rescheduleAlarm() {
  // Cancels any preexisting heartbeat alarm and then schedules a new one.
  browser.alarms
    .clear('heartbeat')
    .then(() => browser.alarms.create('heartbeat', { periodInMinutes: 1 }));
}

function getCurrentTab() {
  // Note: an identical version exists in aw-watcher-web
  return browser.tabs
    .query({ active: true, currentWindow: true })
    .then(tabs => tabs[0]);
}

(function() {
  rescheduleAlarm();

  let oldUrl = null;
  let oldTitle = null;
  const db = new Database();
  let noContentScript = {};

  async function receiveCreator(msg, sender, sendResponse) {
    console.log('receiveCreator: ' + JSON.stringify(msg));
    if (msg.type !== 'creatorFound') {
      return;
    }
    // FIXME: Doing a creator.save() overwrites a preexisting creator object
    await new Creator(msg.creator.url, msg.creator.name).save();
    await db.connectActivityToCreator(msg.activity.url, msg.creator.url);
    console.log('Activity connected to creator');
  }

  function stethoscope() {
    getCurrentTab()
      .then(tabInfo => {
        heartbeat(tabInfo, db, oldUrl, oldTitle);
        oldUrl = tabInfo.url;
        oldTitle = tabInfo.title;
      })
      .catch(error => {
        console.log(`Stethoscope: ${error}`);
      });
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

  browser.tabs.onUpdated.addListener(sendPageChange);

  browser.runtime.onMessage.addListener(receiveCreator);

  browser.idle.onStateChanged.addListener(stethoscope);

  browser.tabs.onActivated.addListener(stethoscope);

  browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'heartbeat') {
      console.log('Heartbeat alarm triggered');
      stethoscope();
    }
  });
  stethoscope();
})();
