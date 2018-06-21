<template lang="pug">
b-card(class="mb-2" no-body)
  b-card-body.p-3
    div.row
      div.col-md-9
        h4 {{ creator.name }}
      div.col-md-3
        b-input-group(append="$", size="sm")
          b-form-input(v-model="allocatedFunds",
                       type="number", min=0, step=0.1)

    p(v-if="!creator.paymentAddress").text-small
      b-input-group(prepend="ETH Address", size="sm")
        b-form-input(v-model="address")

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
      address: this.creator.address || '',
      allocatedFunds: this.creator.allocatedFunds || 0,
      activities: [],
    };
  },
  props: {
    creator: Object,
  },
  watch: {
    showDetails(to, from) {
      if (to === true && this.activities.length === 0) {
        this.getActivities();
      }
    },
    allocatedFunds(to) {
      this.$emit('allocatedFunds', to);
    },
    address(to) {
      this.$emit('address', to);
    },
  },
  methods: {
    getActivities() {
      db.getCreatorActivity(this.creator.url).then(activities => {
        // Testing
        if (activities.length === 0) {
          activities = [
            {
              url: 'https://youtube.com/watch?v=asd',
              title: 'asd',
              duration: 100,
            },
            {
              url: 'https://youtube.com/watch?v=qwe',
              title: 'qwe',
              duration: 10,
            },
          ];
        }

        this.activities = activities;
      });
    },
  },
};
</script>

<style>
</style>
