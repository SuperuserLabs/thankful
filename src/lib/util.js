/*eslint no-undef: 0*/

let browser;
try {
  if (chrome) {
    browser = require('webextension-polyfill');
  }
} catch (e) {
  if (e.name !== 'ReferenceError') {
    throw e;
  }
}

export function isNode() {
  // TODO: Test in browser
  return typeof process !== 'undefined';
}

export function isWebExtension() {
  // TODO: Test in Chrome, Firefox, and in-page
  return (
    true == (window && window.chrome && browser.runtime && browser.runtime.id)
  );
}
