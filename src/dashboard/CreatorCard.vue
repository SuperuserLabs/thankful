<template lang="pug">
b-card(class="mb-2" no-body)
  b-card-body.p-3
    div(v-if="!editing")
      div.row
        div.col-md-9
          h4 {{ name }} 
            span
              font-awesome-icon(icon="pen", size="xs").text-muted
        div.col-md-3
          b-input-group(append="$", size="sm")
            b-form-input(v-model="allocatedFunds",
                         type="number", min=0, step=0.1)

      p(v-if="!creator.paymentAddress").text-small
        b-input-group(prepend="ETH Address", size="sm")
          b-form-input(v-model="address")

      p(v-if="creator.info").text-small {{ creator.info }}

      // TODO: Add icons to buttons (with FontAwesome)
      b-button.mr-2(variant="outline-success", size="sm", target="_blank", :href="url") Go to creator page
      b-button(size="sm", :variant="'outline-secondary'", v-on:click="showDetails = !showDetails")
        | #[span(v-if="!showDetails") Show] #[span(v-else) Hide] details 
        font-awesome-icon(icon="info-circle")

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
    div(v-else)
      b-form-input(placeholder="Name", v-model='name')
      b-form-input(placeholder="Homepage", v-model='url')
      b-input-group(prepend="ETH Address", size="sm", v-model='address')
        b-form-input(placeholder="Address")
      div.pt-3
        b-button(variant="outline-danger", size="sm")
          | Cancel 
          font-awesome-icon(icon="ban")
        b-button(variant="outline-success", size="sm", v-on:click='save()').float-right
          | Save 
          font-awesome-icon(icon="save")
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
      name: this.creator.name,
      url: this.creator.url,
      activities: [],
    };
  },
  props: {
    creator: Object,
    editing: Boolean,
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
      if (!this.editing) {
        this.$emit('address', to);
      }
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
    save() {
      this.$emit('save', {
        name: this.name,
        url: this.url,
        address: this.address,
      });
    },
  },
};
</script>

<style>
</style>
