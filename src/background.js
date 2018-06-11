'use strict';

let lastPage = null;

function _getTimeSinceLastCall() {
  // Returns the time in seconds since last time the function was called.
  let now = new Date();
  lastPage = lastPage || now;

  let duration = (now - lastPage) / 1000;
  lastPage = now;
  return duration;
}

function heartbeat(activeInfo) {
  let duration = _getTimeSinceLastCall();

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
