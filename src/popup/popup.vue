<template lang="pug">
v-app
  div(style="width: 300px; padding: 20px")
    div.text-xs-center
      h1.text-xs-center Thankful

      p.text-xs-center Thanks for trying Thankful!

      v-btn(color="success", v-on:click="thank()")
        | Thank this page
        v-icon.pl-1(color="yellow") favorite

      p.text-xs-center
        | Thanks for this page: {{ this.thanksAmount }}
      
      p.text-xs-center.pb-0(v-if="this.shouldDonate")
        | Now is a good time to donate, click below to get started. 👇

      v-btn(color="info", v-on:click="openDashboard()")
        | Open dashboard
</template>


<script>
import browser from 'webextension-polyfill';
import { getCurrentTab, openDashboardTab } from '../lib/tabs.js';

let db;

export default {
  data: function() {
    return {
      thanksAmount: 0,
      shouldDonate: false,
    };
  },
  methods: {
    thank() {
      getCurrentTab()
        .then(tab => {
          return db.logThank(tab.url, tab.title);
        })
        .then(() => {
          this.refresh();
        })
        .catch(err => {
          throw "Couldn't log thanks: " + err;
        });
    },
    refreshThanksCount() {
      getCurrentTab()
        .then(tab => {
          return db.getUrlThanksAmount(tab.url);
        })
        .then(amount => {
          this.thanksAmount = amount;
        })
        .catch(err => {
          throw "Couldn't get thanks count for page: " + err;
        });
    },
    getShouldDonate() {
      browser.storage.local
        .get(['shouldDonate'])
        .then(o => {
          this.shouldDonate = o.shouldDonate;
        })
        .catch(err => console.error('Could not get shouldDonate:', err));
    },
    openDashboard() {
      openDashboardTab();
    },
    refresh() {
      this.refreshThanksCount();
      this.getShouldDonate();
    },
  },
  created() {
    import(/* webpackChunkName: "db" */ '../lib/db')
      .then(module => (db = new module.Database()))
      .then(() => {
        this.refresh();
      });
  },
};
</script>
