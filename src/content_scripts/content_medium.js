import { Creator } from '../lib/models.js';
import {
  sendCreator,
  addPageChangeListener,
  waitForElements,
} from './contentlib.js';

function crawlPage() {
  // Tries to extract channel URL from page, retries after 1 second if not successful.
  return waitForElements(
    ['meta[property=author]', 'link[rel=author]'],
    1000
  ).then(([c_name, c_url]) => {
    let url = document.location.href;
    let creator = new Creator(c_url.href, c_name.content);
    console.info('Found creator: ' + JSON.stringify(creator));
    sendCreator(url, creator);
  });
}

(function() {
  crawlPage();

  addPageChangeListener(crawlPage);
})();
