/*eslint no-undef: 0*/

let browser;
if (typeof chrome !== 'undefined') {
  browser = require('webextension-polyfill');
}

export function isNode() {
  // TODO: Test in browser
  return typeof process !== 'undefined';
}

export function isWebExtension() {
  // TODO: Test in Chrome, Firefox, and in-page
  return !!(window && window.chrome && browser.runtime && browser.runtime.id);
}

export async function getInstallDate() {
  const installDate = (await browser.storage.local.get('installDate'))
    .installDate;

  if (installDate === undefined) {
    const now = new Date();
    browser.storage.local.set({ installDate: now });
    return now;
  } else {
    return installDate;
  }
}
