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
      console.log(`result does not have timespent`);
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
        console.log(`result does not have ${name}`);
        result[name] = {};
      }

      let prevDuration = result[name][url] || 0;
      result[name][url] = prevDuration + duration;
      console.log(
        `name: ${name}
        prevDuration: ${prevDuration}
        url: ${url}
        result[name][url]: ${result[name][url]}`
      );
      return result;
    })
    .then(setTimeSpent);
}

function addTime(contentInfo, url, duration) {
  if (contentInfo.hasOwnProperty(url)) {
    console.log(`creator url: ${contentInfo[url]}, duration: ${duration}`);
    addTimeToCreator(contentInfo[url], url, duration);
  } else {
    addTimeToCreator(url, url, duration);
  }
}

function heartbeat(tabInfo, contentInfo, oldUrl) {
  isTabActive(tabInfo)
    .then(active => {
      if (active) {
        let url = tabInfo.url;
        let duration = sinceLastCall(oldUrl);

        console.log(contentInfo);
        console.log(`Duration: ${duration}, URL: ${oldUrl}`);
        addTime(contentInfo, oldUrl, duration);

        sinceLastCall(url);

        rescheduleAlarm();
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

function remapCreator(url, creator) {
  getTimeSpent()
    .then(result => {
      if (!result.hasOwnProperty(creator)) {
        console.log(`result does not have ${creator}`);
        result[creator] = {};
      }
      let prevDuration = result[creator][url] || 0;
      result[creator][url] = prevDuration + result[url][url];
      return result;
    })
    .then(setTimeSpent);
}

(function() {
  rescheduleAlarm();

  let contentInfo = {};
  let oldUrl = null;

  function setContentInfo(message, sender, sendResponse) {
    console.log(message);
    contentInfo[message.url] = message.creator;
    remapCreator(message.url, message.creator);
  }

  function stethoscope() {
    getCurrentTab()
      .then(tabInfo => {
        heartbeat(tabInfo, contentInfo, oldUrl);
        oldUrl = tabInfo.url;
      })
      .catch(error => {
        console.log(`Stethoscope: ${error}`);
      });
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
  stethoscope();
})();
