'use strict';

import browser from 'webextension-polyfill';
import {
  sendCreator,
  addPageChangeListener,
  waitForElement,
} from './contentlib.js';

function crawlPage() {
  // Tries to extract channel URL from page, retries after 1 second if not successful.
  waitForElement('#owner-container', 1000).then(ownerContainer => {
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
