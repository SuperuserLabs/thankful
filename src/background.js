'use strict';

import { sinceLastCall } from './calltime.js';

function isTabActive(tabInfo) {
  return new Promise((resolve, reject) => {
    let detectionIntervalInSeconds = 60;
    if (tabInfo.audible) {
      resolve(true);
    } else {
      chrome.idle.queryState(detectionIntervalInSeconds, newState => {
        resolve(newState == 'active');
      });
    }
  });
}

function heartbeat(tabInfo) {
  isTabActive(tabInfo).then(active => {
    if (active) {
      // TODO: When the URL is not the same as the last URL duration should be zero.
      let duration = sinceLastCall();

      // Get time spent on all tabs
      chrome.storage.local.get(['timespent'], result => {
        let url = tabInfo.url;

        // Update time spent on tab
        result.timespent[url] = (result.timespent[url] || 0) + duration;
        console.log(result.timespent);

        // Store time spent on tab
        chrome.storage.local.set({ timespent: result.timespent });

        rescheduleAlarm();
      });
    } else {
      console.log('Not active, not logging');
      sinceLastCall();
    }
  });
}

function rescheduleAlarm() {
  // Cancels any preexisting heartbeat alarm and then schedules a new one.
  chrome.alarms.clear('heartbeat', () => {
    chrome.alarms.create('heartbeat', { periodInMinutes: 0.1 });
  });
}

function getCurrentTabs(callback) {
  // Note: an identical version exists in aw-watcher-web
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    callback(tabs);
  });
}

(function() {
  rescheduleAlarm();

  chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, tabInfo => {
      getCurrentTabs(function(tabs) {
        if (tabs.length >= 1) {
          heartbeat(tabs[0]);
        }
      });
    });
  });

  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'heartbeat') {
      console.log('Heartbeat alarm triggered');
      getCurrentTabs(function(tabs) {
        if (tabs.length >= 1) {
          heartbeat(tabs[0]);
        }
      });
    }
  });
})();
