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

function getStoredDict(key) {
  return browser.storage.local.get(key).then(result => {
    if (!result.hasOwnProperty(key)) {
      return new Map();
    }
    let serialized = result[key];
    return new Map(serialized);
  });
}

function addCreator(creator) {
  getStoredDict('creators')
    .then(creators => {
      creators.set(creator.id, creator);
      return creators;
    })
    .then(result => setStoredDict('creators', result));
}

function setStoredDict(key, value) {
  let obj = {};
  obj[key] = Array.from(value);
  browser.storage.local.set(obj);
}

function getTimeSpent() {
  // Get time spent on all tabs
  return getStoredDict('timespent');
}

function setTimeSpent(value) {
  setStoredDict('timespent', value);
}

function addTimeToCreator(name, url, duration) {
  // Update time spent on tab
  if (name) {
    getTimeSpent()
      .then(result => {
        let creator = {};
        if (result.has(name)) {
          creator = result.get(name);
        }

        let prevDuration = creator[url] || 0;
        creator[url] = prevDuration + duration;
        result.set(name, creator);
        return result;
      })
      .then(setTimeSpent);
  }
}

function addTime(contentInfo, url, duration) {
  if (contentInfo.has(url)) {
    console.log(`creator url: ${contentInfo.get(url)}, duration: ${duration}`);
    addTimeToCreator(contentInfo.get(url), url, duration);
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

function remapCreator(url, creatorId) {
  getTimeSpent()
    .then(result => {
      if (result.has(url)) {
        let urlEntry = result.get(url);
        let creatorEntry = {};
        if (result.has(creatorId)) {
          creatorEntry = result.get(creatorId);
        }
        let urlDuration = creatorEntry[url] || 0;
        creatorEntry[url] = urlDuration + urlEntry[url];
        result.delete(url);
      }
      return result;
    })
    .then(setTimeSpent);
}

(function() {
  rescheduleAlarm();

  let contentInfo = new Map();
  let oldUrl = null;

  function setContentInfo(message, sender, sendResponse) {
    console.log(message);
    contentInfo.set(message.url, message.creator.id);
    addCreator(message.creator);
    remapCreator(message.url, message.creator.id);
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
