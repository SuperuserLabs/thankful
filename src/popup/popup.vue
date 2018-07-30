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

      v-btn(color="info", v-on:click="openDashboard()")
        | Open dashboard
</template>


<script>
import { getCurrentTab, openDashboardTab } from '../lib/tabs.js';

let db;

export default {
  data: function() {
    return {
      thanksAmount: 0,
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
    openDashboard() {
      openDashboardTab();
    },
    refresh() {
      this.refreshThanksCount();
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
