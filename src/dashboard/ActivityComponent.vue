<template lang="pug">
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
import { Database } from '../lib/db.js';
import _ from 'lodash';

const db = new Database();

export default {
  data: function() {
    return {
      unattributedActivities: [],
    };
  },
  props: {
    limit: { default: Infinity, type: Number },
  },
  computed: {
    orderedUnattributedActivities() {
      return _.take(
        _.orderBy(this.unattributedActivities, 'duration', 'desc'),
        this.limit
      );
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
