import { Creator } from '../lib/models.js';
import {
  sendCreator,
  addPageChangeListener,
  waitForElements,
} from './contentlib.js';

// TODO: Should content_youtube.js be renamed to content_script.js and have checks for each site?

function crawlPage() {
  // Tries to extract channel URL from page, retries after 1 second if not successful.
  waitForElements(['meta[property=author]', 'link[rel=author]'], 1000)
    .then(meta => {
      let url = document.location.href;
      let [c_name, c_url] = meta;
      let creator = new Creator(c_url.href, c_name.content);
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
