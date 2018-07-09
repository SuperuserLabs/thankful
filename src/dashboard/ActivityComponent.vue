<template lang="pug">
div
  v-card
    v-data-table(:headers="headers", :items="activities", :pagination.sync='pagination', hide-actions)
      template(slot='items', slot-scope='props')
        td
          a(:href="props.item.url")
            | {{ props.item.title || props.item.url }}
        td.text-right
          | {{ props.item.duration | friendlyDuration }}
  div.text-xs-center.pt-2
    v-btn(v-if="to", variant="outline-secondary", size="sm", :to="to")
      | Show all
</template>

<script>
import { formatSecs } from '../lib/time.js';
import _ from 'lodash';

export default {
  data: () => ({
    activities: [],
    headers: [
      { text: 'Page', value: 'title' },
      { text: 'Duration', value: 'duration' },
    ],
    pagination: { sortBy: 'duration', descending: true, rowsPerPage: 10 },
  }),
  props: {
    limit: { default: Infinity, type: Number },
    unattributed: { default: false, type: Boolean },
    to: { default: null, type: String },
  },
  computed: {},
  methods: {
    refresh() {
      if (this.unattributed) {
        this.$db.getActivities({ withCreators: false }).then(acts => {
          this.activities = acts;
        });
      } else {
        this.$db.getActivities().then(acts => {
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
