import browser from 'webextension-polyfill';
import { canonicalizeUrl } from '../lib/url.ts';
import { valueConstantTicker } from '../lib/calltime.ts';
import { Database } from '../lib/db.ts';
import { getCurrentTab } from '../lib/tabs.js';
import { initReminders } from '../lib/reminders.js';
import { find, difference, intersection, each, unionBy, filter } from 'lodash';

/**
 * Returns true if tab is audible or if user was active last 60 seconds.
 */
async function isTabActive(tabInfo): Promise<boolean> {
  return new Promise(resolve => {
    let detectionIntervalInSeconds = 60;
    if (tabInfo.audible) {
      resolve(true);
    } else {
      browser.idle
        .queryState(detectionIntervalInSeconds)
        .then(newState => resolve(newState == 'active'));
    }
  });
}

async function rescheduleAlarm() {
  // Cancels any preexisting heartbeat alarm and then schedules a new one.
  browser.alarms
    .clear('heartbeat')
    .then(() => browser.alarms.create('heartbeat', { periodInMinutes: 1 }));
}

(function() {
  rescheduleAlarm();

  const db = new Database();
  let noContentScript = {};

  const pollTimer = valueConstantTicker(); // tracks time since last poll
  const tabTimers = {};
  const tabTitles = {};

  function receiveCreator(msg) {
    if (msg.type !== 'creatorFound') {
      return false;
    }
    return (async () => {
      console.log('receiveCreator: ' + JSON.stringify(msg));
      // FIXME: Doing a creator.save() overwrites a preexisting creator object
      await db.updateCreator(msg.creator.url, msg.creator.name);

      await db.connectUrlToCreator(
        canonicalizeUrl(msg.activity.url),
        msg.creator.url
      );
    })();
  }

  async function dbListener({
    type,
    data,
  }: {
    type: string;
    data: any;
  }): Promise<any> {
    switch (type) {
      case 'getDonation':
        return (<any>db.getDonation)(...data);
      case 'getDonations':
        return (<any>db.getDonations)(...data);
      case 'getCreators':
        return db
          .attributeGithubActivity()
          .then(() => (<any>db.getCreators)(...data));
      case 'getActivities':
        return (<any>db.getActivities)(...data);
      case 'logDonation':
        return (<any>db.logDonation)(...data);
      case 'updateCreator':
        return (<any>db.updateCreator)(...data);
      default:
        console.error('Unhandled message type: ', type);
        return;
    }
  }

  async function stethoscope() {
    try {
      const currentTab = await getCurrentTab();
      const currentTabArray = (await isTabActive(currentTab))
        ? [currentTab]
        : [];
      const audibleTabs = await browser.tabs.query({ audible: true });
      const tabs = filter(
        unionBy(currentTabArray, audibleTabs, 'url'),
        tab => !tab.incognito
      );

      const timeSinceLastPoll = pollTimer();
      if (timeSinceLastPoll > 70) {
        // If significantly more than 60s, reset timers.
        // This is usually indicative of computer being suspended.
        // See: https://github.com/SuperuserLabs/thankful/issues/61
        console.log('suspend detected, resetting timers');
        each(tabTimers, tabTimer => tabTimer());
      }

      const currentUrls = tabs.map(tab => canonicalizeUrl(tab.url));
      const goneUrls = difference(Object.keys(tabTimers), currentUrls);
      const stillUrls = intersection(Object.keys(tabTimers), currentUrls);
      const newUrls = difference(currentUrls, Object.keys(tabTimers));

      goneUrls.forEach(url => {
        const duration = tabTimers[url]();
        const title = tabTitles[url];
        delete tabTimers[url];
        delete tabTitles[url];
        db.logActivity(url, duration, { title: title });
      });
      stillUrls.forEach(url => {
        const duration = tabTimers[url]();
        let title = find(tabs, tab => canonicalizeUrl(tab.url) === url).title;
        tabTitles[url] = title;
        db.logActivity(url, duration, { title: title });
      });
      newUrls.forEach(url => {
        tabTimers[url] = valueConstantTicker();
        tabTimers[url]();
        tabTitles[url] = find(
          tabs,
          tab => canonicalizeUrl(tab.url) === url
        ).title;
      });
      await rescheduleAlarm();
    } catch (error) {
      console.log(`Stethoscope error: ${error}`);
    }
  }

  async function sendPageChange(tabId, changeInfo, tab): Promise<any> {
    return browser.tabs
      .sendMessage(tabId, {
        type: 'pageChange',
      })
      .then(() => {
        delete noContentScript[tabId];
      })
      .catch(message => {
        if (!(tabId in noContentScript)) {
          noContentScript[tabId] = true;
          console.log(
            `Error when sending message to content script (maybe not running on this url):
url: ${tab.url}
error: ${JSON.stringify(message)}`
          );
        }
      });
  }

  browser.tabs.onUpdated.addListener(stethoscope);
  browser.tabs.onUpdated.addListener(sendPageChange);

  //let messageHandlers = [receiveCreator, dbListener];

  browser.runtime.onMessage.addListener(receiveCreator);
  browser.runtime.onMessage.addListener(dbListener);
  //browser.runtime.onMessage.addListener(async msg => {
  //for (let i in messageHandlers) {
  //let result = await messageHandlers[i](msg);
  //if (result) return result;
  //}
  //});

  browser.idle.onStateChanged.addListener(stethoscope);

  browser.tabs.onActivated.addListener(stethoscope);

  browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'heartbeat') {
      stethoscope();
    }
  });

  initReminders(db);
  stethoscope();

  db.initThankfulTeamCreator();
})();
