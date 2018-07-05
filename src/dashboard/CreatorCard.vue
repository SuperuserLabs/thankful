<template lang="pug">
b-card(no-body)
  b-card-body.p-3
    div(v-if="!editing")
      a(target="_blank", :href="url")
        div
          h6
            font-awesome-icon(v-if='isOnDomain(url,"youtube.com")', :icon="['fab', 'youtube']", size="xs", color='red')
            font-awesome-icon(v-if='isOnDomain(url,"github.com")', :icon="['fab', 'github']", size="xs", color='black')
            |  {{ name }}&nbsp
            sup.text-secondary
              font-awesome-icon(icon="external-link-alt", size="xs")

      p(v-if="creator.info").text-small
        | {{ creator.info }}
      div.d-flex.justify-content-between
        div
          b-button(size="sm", :variant="'outline-secondary'", v-on:click="showDetails = !showDetails")
            | #[font-awesome-icon(icon="info-circle")] Details
        div
          b-button(v-on:click='$emit("edit")', variant='outline-secondary', size='sm').mr-1
            | #[font-awesome-icon(icon="edit")] Edit
          b-button(v-on:click='$emit("ignore")', variant='outline-secondary', size='sm')
            | #[font-awesome-icon(icon="eye-slash")] Ignore

      table.table.table-sm.table-hover.mt-3.mb-0(v-if="showDetails")
        tr
          th Page
          th Duration
        tr(v-if="activities.length == 0" colspan="0")
          td No activity found for creator
        tr(v-for="activity in activities")
          td
            a(:href='activity.url', target="blank")
              | {{ activity.title || activity.url }}
          td.text-right
            | {{ activity.duration | friendlyDuration }}
    div(v-else)
      b-form-input(v-if='errors.name', placeholder="Name", v-model='name').border.border-danger
      b-form-input(v-else, placeholder="Name", v-model='name')
      b-form-input(v-if='errors.url', placeholder="Homepage", v-model='url').border.border-danger
      b-form-input(v-else, placeholder="Homepage", v-model='url')
      b-input-group(prepend="ETH Address", size="sm")
        b-form-input(placeholder="Address", v-model='address')
      div.pt-3
        b-button(v-if='creator.edited', variant="danger", size="sm", v-on:click='$emit("remove")')
          | #[font-awesome-icon(icon="trash")] Delete
        b-button(variant="success", size="sm", v-on:click='save()').float-right.mr-2
          | #[font-awesome-icon(icon="save")] Save
        b-button(variant="danger", size="sm", v-on:click='cancel()').float-right.mr-2
          | #[font-awesome-icon(icon="ban")] Cancel
</template>

<script>
import { Database } from '../lib/db.js';
import _ from 'lodash';
import { isOnDomain } from '../lib/url.js';

// TODO: Move to appropriate location
let db = new Database();

export default {
  data() {
    return this.setDefaultData({
      showDetails: false,
      allocatedFunds: this.creator.allocatedFunds || 0,
      activities: [],
      errors: { url: false, name: false },
    });
  },
  props: {
    creator: Object,
    editing: Boolean,
  },
  watch: {
    showDetails(to) {
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
    isDomain(url, hostname) {
      let reg = RegExp(`^.*://(www\.)?${hostname}/?`);
      return reg.test(url);
    },
    isOnDomain: isOnDomain,
    setDefaultData(obj) {
      return Object.assign(obj, {
        address: this.creator.address || '',
        name: this.creator.name,
        url: this.creator.url,
      });
    },
    getActivities() {
      db.getCreatorActivity(this.creator.url).then(activities => {
        this.activities = _.orderBy(activities, 'duration', 'desc');
      });
    },
    save() {
      if (this.url && this.name) {
        if (!/^https?:\/\//i.test(this.url)) {
          this.url = 'http://' + this.url;
        }
        this.$emit('save', {
          name: this.name,
          url: this.url,
          address: this.address,
          edited: true,
        });
      } else {
        this.errors['url'] = this.url === '';
        this.errors['name'] = this.name === '';
      }
    },
    cancel() {
      this.setDefaultData(this);
      this.$emit('cancel');
    },
  },
};
</script>

<style>
a h6,
a h6:visited {
  color: #222 !important;
}
</style>
