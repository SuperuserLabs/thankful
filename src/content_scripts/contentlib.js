import browser from 'webextension-polyfill';

export function waitForElement(elementId, retryTime) {
  return new Promise((resolve, reject) => {
    let element = document.getElementById(elementId);
    if (element) {
      // Worked on first try
      return resolve(element);
    } else {
      // Retry
      let timerId = window.setInterval(() => {
        element = document.getElementById(elementId);
        if (element) {
          clearInterval(timerId);
          return resolve(element);
        }
      }, retryTime);
    }
  });
}

/**
 * Add listener to recrawl page on important changes
 */
export function addPageChangeListener(listener) {
  browser.tabs.onUpdated.addListener(listener);
}

/**
 * Send message to background.js mapping url to creator
 */
export function sendCreator(url, creator) {
  browser.runtime.sendMessage({
    type: 'creatorFound',
    activity: {
      url: url,
    },
    creator: creator,
  });
}
