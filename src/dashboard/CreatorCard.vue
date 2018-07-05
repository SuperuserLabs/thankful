<template lang="pug">
b-card(class="mb-2" no-body)
  b-card-body.p-3
    div(v-if="!editing")
      div.row
        a(target="_blank", :href="url").col-md-9
          div
            h4
              font-awesome-icon(v-if='isOnDomain(url,"youtube.com")', :icon="['fab', 'youtube']", size="xs", color='red')
              font-awesome-icon(v-if='isOnDomain(url,"github.com")', :icon="['fab', 'github']", size="xs", color='black')
              |  {{ name }}&nbsp
              sup.text-secondary
                font-awesome-icon(icon="external-link-alt", size="xs")
        div.col-md-3
          b-input-group(append="$", size="sm")
            b-form-input(v-model="allocatedFunds",
                         type="number", min=0, step=0.1)

      p(v-if="!creator.predefined").text-small
        b-input-group(prepend="ETH Address", size="sm")
          b-form-input(v-model="address")

      p(v-if="creator.info").text-small
        | {{ creator.info }}

      b-button(size="sm", :variant="'outline-secondary'", v-on:click="showDetails = !showDetails")
        | #[font-awesome-icon(icon="info-circle")] #[span(v-if="!showDetails") Show] #[span(v-else) Hide] details
      b-button(v-if="creator.edited", v-on:click='$emit("edit")', variant='outline-secondary', size='sm').float-right
        | #[font-awesome-icon(icon="edit")] Edit

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
            | {{ activity.duration.toFixed(0) }}s
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
        this.activities = activities;
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
a h4,
a h4:visited {
  color: #222 !important;
}
</style>
