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

  function receiveCreator(message, sender, sendResponse) {
    console.log(message);
    url = message.url;
    c_url = message.creator.url;
    c_name = message.creator.id;
    new Creator(c_url, c_name).save().then(key => {
      db.connectActivityToCreator(url, c_url);
    });
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
