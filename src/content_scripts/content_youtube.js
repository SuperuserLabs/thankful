'use strict';

import browser from 'webextension-polyfill';
import {
  sendCreator,
  addPageChangeListener,
  waitForElement,
} from './contentlib.js';

// TODO: Should content_youtube.js be renamed to content_script.js and have checks for each site?

function crawlPage() {
  // Tries to extract channel URL from page, retries after 1 second if not successful.
  waitForElement('owner-container', 1000).then(ownerContainer => {
    let url = document.location.href;
    let channelLink = ownerContainer.getElementsByTagName('a')[0];
    let creator = {
      id: channelLink.getAttribute('href'),
      name: channelLink.textContent,
    };
    console.log(creator);
    sendCreator(url, creator);
  });
}

crawlPage();

addPageChangeListener(crawlPage);
// FROM: https://stackoverflow.com/a/19758800/965332
// Something like this needed to report the (content_url -> creator_url) mapping back to the background process.
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  // If the received message has the expected format...
  if (msg.text === 'report_back') {
    // Call the specified callback, passing
    // the web-page's DOM content as argument
    sendResponse(document.all[0].outerHTML);
  }
});
