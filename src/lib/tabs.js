import browser from 'webextension-polyfill';

export function getCurrentTab() {
  // Note: an identical version exists in aw-watcher-web
  return browser.tabs
    .query({ active: true, currentWindow: true })
    .then(tabs => tabs[0]);
}

export function openDashboardTab() {
  let dashboard_url = browser.runtime.getURL('dashboard/index.html');
  browser.tabs.query({ currentWindow: true, url: dashboard_url }).then(e => {
    if (e.length < 1) {
      browser.tabs.create({
        url: dashboard_url,
      });
    } else {
      browser.tabs.update(e[0].id, { active: true });
    }
  });
}
