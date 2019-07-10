import browser from 'webextension-polyfill';
import { openDashboardTab } from './tabs.js';
import { secondsSinceDonation } from './util.ts';

// These variables are in milliseconds
const donationInterval = 1000 * 60 * 60 * 24 * 30; // One month
const toastInterval = 1000 * 60 * 60 * 24; // 24 hours
// Could use browser.runtime.connect for faster updates and less frequent
// polling but that feels like unnecessary complexity
// Don't use browser.storage.onChanged.addListener, it spams events for
// no reason
// Could also observe the db but there doesn't seem to be a light way to do
// that
// This variable is in minutes
const reminderCheckInterval = 5 / 60; // 5 seconds

// We'll toast when the browser starts
let lastToast = new Date(0);

export function initReminders(db) {
  browser.notifications.onClicked.addListener(openDashboardTab);

  browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'reminderCheck') {
      reminderCheck(db);
    }
  });

  reminderCheck(db);
  browser.alarms.create('reminderCheck', {
    periodInMinutes: reminderCheckInterval,
  });
}

// This is outside vuex because we use it in background.js
export async function isTimeToDonate(db) {
  return 1000 * (await secondsSinceDonation(db)) > donationInterval;
}

function reminderCheck(db) {
  isTimeToDonate(db)
    .then(shouldDonate => {
      if (shouldDonate) {
        browser.browserAction.setBadgeBackgroundColor({
          color: 'ForestGreen',
        });
        browser.browserAction.setBadgeText({ text: '🔔' });
        browser.browserAction.setTitle({
          title: 'Thankful: Reminder to donate',
        });

        if (new Date() - lastToast > toastInterval) {
          // TODO: Add the logo to the notification
          browser.notifications.create({
            type: 'basic',
            title: 'Thankful: Reminder to donate 🔔',
            message:
              "You haven't donated in a while, click here to go to the donation dashboard",
          });

          lastToast = new Date();
        }
      } else {
        browser.browserAction.setBadgeText({ text: '' });
        browser.browserAction.setTitle({ title: 'Thankful' });
      }
    })
    .catch(err => {
      console.error('Could not get reminderTimes:', err);
    });
}
