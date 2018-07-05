<template lang="pug">
div(v-if="activities.length === 0")
  | No activity logged
div(v-else).d-flex.flex-column
  table.table.table-sm(style="overflow: hidden; table-layout: fixed")
    tr
      th(style="border-top: 0") Page
      th.text-right(style="width: 25%; border-top: 0") Duration
    tr(v-for="activity in orderedActivities")
      td(style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;")
        a(:href="activity.url")
          | {{ activity.title || activity.url }}
      td.text-right
        | {{ formatSecs(activity.duration) }}
  b-button(v-if="to && activities.length > limit", variant="outline-secondary", size="sm", :to="to")
    | Show all
</template>

<script>
import { Database } from '../lib/db.js';
import { formatSecs } from '../lib/time.js';
import _ from 'lodash';

const db = new Database();

export default {
  data: function() {
    return {
      activities: [],
    };
  },
  props: {
    limit: { default: Infinity, type: Number },
    unattributed: { default: false, type: Boolean },
    to: { default: null, type: String },
  },
  computed: {
    orderedActivities() {
      return _.take(_.orderBy(this.activities, 'duration', 'desc'), this.limit);
    },
  },
  methods: {
    formatSecs: formatSecs,
    refresh() {
      if (this.unattributed) {
        db.getActivities({ withCreators: false }).then(acts => {
          this.activities = acts;
        });
      } else {
        db.getActivities().then(acts => {
          this.activities = acts;
        });
      }
    },
  },
  created() {
    this.refresh();
  },
};
</script>
