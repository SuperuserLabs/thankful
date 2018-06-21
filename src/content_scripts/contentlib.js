import browser from 'webextension-polyfill';

async function queryElement(query, node) {
  let element = node.querySelector(query);
  if (element) {
    return element;
  } else {
    throw new Error(`No element found for query: ${query}`);
  }
}

function wait(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

export async function waitForElement(
  query,
  retryTime,
  retries = 5,
  node = document
) {
  let error;
  for (let i = 0; i < retries; i++) {
    try {
      return await queryElement(query, node);
    } catch (err) {
      error = err;
    }
    await wait(retryTime);
  }
  throw error;
}

/**
 * Add listener to recrawl page on important changes
 */
export function addPageChangeListener(listener) {
  browser.runtime.onMessage.addListener(message => {
    if (message.type === 'pageChange') {
      listener();
    }
  });
}

/**
 * Send message to background.js mapping url to creator
 */
export function sendCreator(url, creator) {
  browser.runtime.sendMessage({
    type: 'creatorFound',
    activity: {
      url: url,
    },
    creator: creator,
  });
}
