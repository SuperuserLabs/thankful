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
  const audibleTimers = {};
  const audibleTitles = {};

  async function receiveCreator(msg, sender, sendResponse) {
    console.log('receiveCreator: ' + JSON.stringify(msg));
    if (msg.type !== 'creatorFound') {
      return;
    }
    // FIXME: Doing a creator.save() overwrites a preexisting creator object
    await new Creator(msg.creator.url, msg.creator.name).save();
    let result = await db.connectActivityToCreator(
      msg.activity.url,
      msg.creator.url
    );
    if (result === 0) {
      console.log('Failed connecting activity to creator');
    } else {
      console.log('Successfully connected activity to creator');
    }
    await db.getActivity(msg.activity.url);
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
    browser.tabs
      .query({ active: false, audible: true })
      .then(tabs => {
        const currentUrls = tabs.map(tab => tab.url);
        const goneUrls = _.difference(Object.keys(audibleTimers), currentUrls);
        const stillUrls = _.intersection(
          Object.keys(audibleTimers),
          currentUrls
        );
        const newUrls = _.difference(currentUrls, Object.keys(audibleTimers));

        goneUrls.forEach(url => {
          const duration = audibleTimers[url]();
          const title = audibleTitles[url];
          delete audibleTimers[url];
          delete audibleTitles[url];
          db.logActivity(url, duration, { title: title });
        });
        stillUrls.forEach(url => {
          const duration = audibleTimers[url]();
          let title = _.find(tabs, tab => tab.url === url).title;
          audibleTitles[url] = title;
          db.logActivity(url, duration, { title: title });
        });
        newUrls.forEach(url => {
          audibleTimers[url] = valueConstantTicker();
          audibleTimers[url]();
          audibleTitles[url] = _.find(tabs, tab => tab.url === url).title;
        });
      })
      .catch(error => {
        console.log(`Stethoscope audible: ${error}`);
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

  browser.browserAction.onClicked.addListener(() => {
    let dashboard_url = browser.runtime.getURL('dashboard/index.html');
    browser.tabs.query({ currentWindow: true, url: dashboard_url }).then(e => {
      if (e.length < 1) {
        browser.tabs.create({
          url: dashboard_url,
        });
      } else {
        browser.tabs.update(e[0].id, { active: true });
      }
    });
  });

  browser.tabs.onUpdated.addListener(stethoscope);

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
