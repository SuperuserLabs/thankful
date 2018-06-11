'use strict';

import { sinceLastCall } from './calltime.js';

function heartbeat(activeInfo) {
  let duration = sinceLastCall();

  // Get tab info
  chrome.tabs.get(activeInfo.tabId, tab => {
    // Get time spent on all tabs
    chrome.storage.local.get(['timespent'], result => {
      let tabUrl = tab.url;
      // Update time spent on tab
      result.timespent[tabUrl] = (result.timespent[tabUrl] || 0) + duration;
      console.log(result.timespent);
      // Store time spent on tab
      chrome.storage.local.set({ timespent: result.timespent });
    });
  });
}

(function() {
  chrome.tabs.onActivated.addListener(activeInfo => {
    heartbeat(activeInfo);
  });
})();
