<template lang="pug">
v-data-table(:headers="headers", :items="items", :pagination.sync='pagination', hide-actions)
  template(slot='items', slot-scope='props')
    td(style="text-overflow:ellipsis; max-width: 0; overflow: hidden; white-space: nowrap;")
      a(:href="props.item.url", target="_blank")
        | {{ props.item.title || props.item.url }}
    td.text-right
      | {{ props.item.duration | friendlyDuration }}
</template>

<script>
import _ from 'lodash';

export default {
  data: () => ({
    activities: [],
    headers: [
      { text: 'Page', value: 'title', width: '80%' },
      { text: 'Duration', value: 'duration', width: '20%' },
    ],
    pagination: { sortBy: 'duration', descending: true, rowsPerPage: -1 },
  }),
  computed: {
    items() {
      if (this.unattributed) {
        return _.filter(this.activities, a => !a.creator);
      } else {
        return this.activities;
      }
    },
  },
  props: {
    unattributed: { default: false, type: Boolean },
  },
  methods: {
    refresh() {
      this.$db.getActivities().then(acts => {
        this.activities = acts;
      });
    },
  },
  created() {
    this.refresh();
  },
};
</script>
