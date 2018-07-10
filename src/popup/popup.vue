<template lang="pug">
v-app
  div(style="width: 300px; padding: 20px")
    div.text-xs-center
      h1.text-xs-center Thankful

      p.text-xs-center Thanks for trying Thankful!

      v-btn(color="success", v-on:click="thank()")
        | Thank this page 💛

      v-btn(color="info", v-on:click="openDashboard()")
        | Open dashboard
</template>


<script>
import browser from 'webextension-polyfill';
import { getCurrentTab } from '../lib/tabs.js';

export default {
  methods: {
    thank() {
      getCurrentTab()
        .then(tab => {
          return this.$db.logThank(tab.url, tab.title);
        })
        .catch(err => {
          throw "Couldn't log thanks: " + err;
        });
    },
    openDashboard() {
      let dashboard_url = browser.runtime.getURL('dashboard/index.html');
      browser.tabs
        .query({ currentWindow: true, url: dashboard_url })
        .then(e => {
          if (e.length < 1) {
            browser.tabs.create({
              url: dashboard_url,
            });
          } else {
            browser.tabs.update(e[0].id, { active: true });
          }
        });
    },
  },
};
</script>
