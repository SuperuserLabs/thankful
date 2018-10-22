import {
  sendCreator,
  addPageChangeListener,
  waitForElement,
} from './contentlib.js';

function crawlPage() {
  // Tries to extract channel URL from page, retries after 1 second if not successful.
  return waitForElement('div#owner-container a', 1000).then(channelLink => {
    let url = document.location.href;
    let creatorUrl = channelLink.getAttribute('href');
    if (!creatorUrl.includes('://')) {
      creatorUrl = 'https://www.youtube.com' + creatorUrl;
    }
    let creatorName = channelLink.textContent;
    sendCreator(url, creatorUrl, creatorName);
  });
}

(function() {
  crawlPage();

  addPageChangeListener(crawlPage);
})();
