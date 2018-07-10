<template lang="pug">
div(style="width: 300px; padding: 20px")
  h1 Thankful

  hr

  p Thanks for trying Thankful!

  hr

  v-btn(color="info", v-on:click="thank()")
    | Thank this page 💛

  hr

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
