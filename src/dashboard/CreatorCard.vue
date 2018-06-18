<template lang="pug">
b-card(:title="creator.name", class="mb-2")
  // TODO: Add icons to buttons (with FontAwesome)
  b-button.mr-2(variant="outline-success", size="sm", :href="creator.url") Go to creator page
  b-button(size="sm", :variant="'outline-secondary'", v-on:click="showDetails = !showDetails")
    | #[span(v-if="!showDetails") Show] #[span(v-else) Hide] details
  table.table.table-sm.table-hover.mt-3.mb-0(v-if="showDetails")
    tr
      th Page
      th Duration
    tr(v-for="activity in activities")
      td
        a(:href='activity.url', target="blank")
          | {{ activity.title || activity.url }}
      td.text-right
        | {{ activity.duration.toFixed(0) }}s
</template>

<script>
import { Database } from '../lib/db.js';

// TODO: Move to appropriate location
let db = new Database();

export default {
  data() {
    return {
      showDetails: false,
      activities: [],
    };
  },
  props: {
    creator: Object,
  },
  watch: {
    showDetails(to, from) {
      if(to === true && this.activities.length === 0) {
        this.getActivities();
      }
    }
  },
  methods: {
    getActivities() {
      db.getCreatorActivity(this.creator.url).then(activities => {
        // Testing
        if(activities.length === 0) {
          activities = [
            {"url": "youtube.com/watch?v=asd", "title": "asd", "duration": 100},
            {"url": "youtube.com/watch?v=qwe", "title": "qwe", "duration": 10}
          ];
        }

        this.activities = activities;
      });
    }
  }
};
</script>

<style>
</style>
