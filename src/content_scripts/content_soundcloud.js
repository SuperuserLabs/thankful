import browser from 'webextension-polyfill';
import {
  sendCreator,
  addPageChangeListener,
  waitForElement,
} from './contentlib.js';

function crawlPage() {
  // Tries to extract channel URL from page, retries after 1 second if not successful.
  waitForElement('.playbackSoundBadge__titleContextContainer', 1000).then(
    soundbadge => {
      let url = document.location.href;
      let links = soundbadge.getElementsByTagName('a'); // Song is at index 0, artist at index 1
      let creator = {
        id: links[1].getAttribute('href'),
        name: links[1].innerText,
      };
      console.log(creator);
      sendCreator(url, creator);
    }
  );
}

crawlPage();
addPageChangeListener(crawlPage);
