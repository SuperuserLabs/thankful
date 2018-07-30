import { Creator } from '../lib/models.js';
import {
  sendCreator,
  addPageChangeListener,
  waitForElements,
} from './contentlib.js';

// TODO: Should content_youtube.js be renamed to content_script.js and have checks for each site?

function crawlPage() {
  // Tries to extract channel URL from page, retries after 1 second if not successful.
  return waitForElements(
    ['meta[property=author]', 'link[rel=author]'],
    1000
  ).then(([c_name, c_url]) => {
    let url = document.location.href;
    let creator = new Creator(c_url.href, c_name.content);
    sendCreator(url, creator);
  });
}

(function() {
  crawlPage();

  addPageChangeListener(crawlPage);
})();
