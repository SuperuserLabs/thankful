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
  return (
    true == (window && window.chrome && browser.runtime && browser.runtime.id)
  );
}
