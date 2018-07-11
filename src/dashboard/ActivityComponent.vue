<template lang="pug">
div(v-if="activities.length === 0")
  | No activity logged
div(v-else)
  v-data-table(:headers="headers", :items="orderedActivities", style="width:100%", hide-actions="showAll")
    template(slot='items', slot-scope='props', style="width:100%")
      td(style="text-overflow: ellipsis;")
        a(:href="props.item.url", target="_blank")
          | {{ props.item.title || props.item.url }}
      td.text-right
        | {{ props.item.duration | friendlyDuration }}
  div.text-xs-center.pt-2
    v-btn(v-if="!showAll", size="sm", :to="toAll")
      | Show all
</template>

<script>
import { Database } from '../lib/db.js';
import _ from 'lodash';

const db = new Database();

export default {
  data: function() {
    return {
      activities: [],
      headers: [
        { text: 'Page', align: 'left' },
        { text: 'Duration', align: 'left' },
      ],
    };
  },
  props: {
    limit: { default: Infinity, type: Number },
    unattributed: { default: false, type: Boolean },
    to: { default: null, type: String },
    showAll: { default: false, type: Boolean },
  },
  computed: {
    orderedActivities() {
      return _.take(_.orderBy(this.activities, 'duration', 'desc'), this.limit);
    },
  },
  methods: {
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
