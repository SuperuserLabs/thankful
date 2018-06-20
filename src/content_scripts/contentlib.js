'use strict';

import browser from 'webextension-polyfill';

export function waitForElement(selector, retryTime) {
  return new Promise((resolve, reject) => {
    let element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    } else {
      window.setTimeout(crawlPage, retryTime);
    }
  });
}

/**
 * Add listener to recrawl page on important changes
 */
export function addPageChangeListener(crawlPage) {
  browser.tabs.onUpdated.addListener(crawlPage);
}

/**
 * Send message to background.js mapping url to creator
 */
export function sendCreator(url, creator) {
  browser.runtime.sendMessage({ url: url, creator: creator });
}
