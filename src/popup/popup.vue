<template lang="pug">
v-app
  div(style="width: 300px; padding: 20px")
    div.text-xs-center
      h1.text-xs-center Thankful

      p.text-xs-center Thanks for trying Thankful!

      v-btn(color="success", v-on:click="thank()", :loading='loading')
        | Thank this page
        v-icon.pl-1(color="yellow") favorite

      p.text-xs-center
        | Thanks for this page: {{ this.thanksAmount }}
      
      p.text-xs-center.pb-0(v-if="this.shouldDonate")
        | Now is a good time to donate, click below to get started. 👇

      v-btn(color="info", @click="openDashboard()")
        | Open dashboard
</template>

<script>
import { getCurrentTab, openDashboardTab } from '../lib/tabs.js';
import { isTimeToDonate } from '../lib/reminders.js';

let db;

export default {
  data: function() {
    return {
      thanksAmount: 0,
      shouldDonate: false,
      loading: true,
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
      isTimeToDonate(db)
        .then(shouldDonate => {
          this.shouldDonate = shouldDonate;
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
        this.loading = false;
        this.refresh();
      });
  },
};
</script>
