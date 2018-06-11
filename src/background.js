'use strict';

function heartbeat(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, tab => {
    console.log(tab.url);
  });
}

(function() {
  chrome.tabs.onActivated.addListener(activeInfo => {
    heartbeat(activeInfo);
  });
})();
