<template lang="pug">
div.container
  h3 Unattributed Activity
  b-card.p-2.bt-0(no-body)
    table.table.table-sm(style="overflow: hidden; table-layout: fixed")
      tr
        th(style="border-top: 0") Page
        th.text-right(style="width: 20%; border-top: 0") Duration
      tr(v-for="activity in orderedUnattributedActivities")
        td(style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;")
          a(:href="activity.url")
            | {{ activity.title || activity.url }}
        td.text-right
          | {{ Math.round(activity.duration) }}s
</template>

<script>
import browser from 'webextension-polyfill';
import { Database } from '../lib/db.js';
import _ from 'lodash';

const db = new Database();

export default {
  data: function() {
    return {
      unattributedActivities: [],
    };
  },
  computed: {
    orderedUnattributedActivities() {
      return _.orderBy(this.unattributedActivities, 'duration', 'desc');
    },
  },
  methods: {
    refresh() {
      db.getActivities({ withCreators: false }).then(acts => {
        this.unattributedActivities = acts;
      });
    },
  },
  created() {
    this.refresh();
  },
};
</script>

<style>
body {
  background-color: #eee;
}
#header {
  padding-bottom: 9px;
  margin: 40px 0 20px;
  border-bottom: 1px solid #eee;
}
.card-body {
  transition-duration: 0.4s;
}
</style>
