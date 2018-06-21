import browser from 'webextension-polyfill';
import { Creator } from '../lib/db.js';
import {
  sendCreator,
  addPageChangeListener,
  waitForElement,
} from './contentlib.js';

// TODO: Should content_youtube.js be renamed to content_script.js and have checks for each site?

function crawlPage() {
  // Tries to extract channel URL from page, retries after 1 second if not successful.
  waitForElement('div#owner-container a', 1000)
    .then(channelLink => {
      let url = document.location.href;
      if (channelLink === undefined) {
        // TODO: Try again
        throw 'channelLink was undefined';
      }
      let c_url = channelLink.getAttribute('href');
      if (!c_url.includes('://')) {
        c_url = 'https://www.youtube.com' + c_url;
      }
      let c_name = channelLink.textContent;
      let creator = new Creator(c_url, c_name);
      console.log('Found creator: ' + JSON.stringify(creator));
      sendCreator(url, creator);
    })
    .catch(err => console.log(err));
}

(function() {
  console.log('crawlPage defined');

  crawlPage();

  addPageChangeListener(crawlPage);
})();
