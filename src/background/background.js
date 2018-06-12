'use strict';

import browser from 'webextension-polyfill';
import { valueConstantTicker } from '../lib/calltime.js';

let sinceLastCall = valueConstantTicker();

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

function getTimeSpent() {
  // Get time spent on all tabs
  return browser.storage.local.get(['timespent']).then(result => {
    if (!result.hasOwnProperty('timespent')) {
      return {};
    }
    return result.timespent;
  });
}

function setTimeSpent(value) {
  browser.storage.local.set({ timespent: value });
}

function addTimeToCreator(name, url, duration) {
  // Update time spent on tab
  getTimeSpent()
    .then(result => {
      if (!result.hasOwnProperty(name)) {
        result[name] = {};
      }

      let prevDuration = result[name][url] || 0;
      result[name][url] = prevDuration + duration;
      console.log(result);
      return result;
    })
    .then(setTimeSpent);
}

function heartbeat(tabInfo, contentInfo) {
  isTabActive(tabInfo).then(active => {
    if (active) {
      // TODO: When active before and now, add unaccounted time for last page before adding time for current page
      let url = tabInfo.url;
      let duration = sinceLastCall(url);

      if (contentInfo.url === url) {
        addTimeToCreator(contentInfo.creator, url, duration);
      } else {
        addTimeToCreator(url, url, duration);
      }
      rescheduleAlarm();
    } else {
      console.log('Not active, not logging');
    }
  });
  sinceLastCall();
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

function remapCreator(url, creator) {
  getTimeSpent()
    .then(result => {
      if (!result.hasOwnProperty(creator)) {
        result[creator] = {};
      }
      let prevDuration = result[creator][url] || 0;
      result[creator][url] = prevDuration + result[url][url];
      delete result[url];
      return result;
    })
    .then(setTimeSpent);
}

(function() {
  rescheduleAlarm();

  let contentInfo = {
    url: null,
    creator: null,
  };

  function setContentInfo(message, sender, sendResponse) {
    contentInfo = message;
    remapCreator(message.url, message.creator);
  }

  function stethoscope() {
    getCurrentTab().then(tabInfo => heartbeat(tabInfo, contentInfo));
  }

  browser.runtime.onMessage.addListener(setContentInfo);

  browser.idle.onStateChanged.addListener(stethoscope);

  browser.tabs.onActivated.addListener(stethoscope);

  browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'heartbeat') {
      console.log('Heartbeat alarm triggered');
      stethoscope();
    }
  });
})();
