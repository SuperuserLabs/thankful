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
  ).then(([meta, link]) => {
    let creatorUrl = link.href;
    let creatorName = meta.content;
    let url = document.location.href;
    sendCreator(url, creatorUrl, creatorName);
  });
}

(function () {
  crawlPage();

  addPageChangeListener(crawlPage);
})();
