import browser from 'webextension-polyfill';

function queryElement(query, node) {
  let element = node.querySelector(query);
  if (element) {
    return element;
  } else {
    throw new Error(`No element found for query: ${query}`);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForElement(
  query,
  retryTime,
  retries = 5,
  node = document
) {
  return (await waitForElements([query], retryTime, retries, node))[0];
}

export async function waitForElements(
  queries,
  retryTime,
  retries = 5,
  node = document
) {
  let error;
  for (let i = 0; i < retries; i++) {
    try {
      return queries.map((query) => queryElement(query, node));
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
  browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'pageChange') {
      listener();
    }
  });
}

/**
 * Send message to background.js mapping url to creator
 */
export function sendCreator(url, creatorUrl, creatorName) {
  return browser.runtime.sendMessage({
    type: 'creatorFound',
    activity: {
      url: url,
    },
    creator: { url: creatorUrl, name: creatorName },
  });
}
