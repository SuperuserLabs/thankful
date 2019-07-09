<template lang="pug">
v-layout(v-if='loading', row, justify-center, align-center).pa-5
  v-progress-circular(indeterminate, :size='50')
v-data-table(v-else, :headers="headers", :items="items(unattributed)", :pagination.sync='pagination')
  template(slot='items', slot-scope='props')
    td(style="text-overflow:ellipsis; max-width: 0; overflow: hidden; white-space: nowrap;")
      a(:href="props.item.url", target="_blank")
        | {{ props.item.title || props.item.url }}
    td.text-right
      | {{ props.item.duration | friendlyDuration }}
    td.text-right
      | {{ props.item.thanks || '' }}
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data: () => ({
    headers: [
      { text: 'Page', value: 'title', width: '80%' },
      { text: 'Duration', value: 'duration', width: '20%' },
      { text: 'Thanks', value: 'thanks', width: '20%' },
    ],
    pagination: { sortBy: 'duration', descending: true, rowsPerPage: 10 },
    loading: true,
  }),
  computed: {
    ...mapGetters({
      items: 'db/activities',
    }),
  },
  props: {
    unattributed: { default: false, type: Boolean },
  },
  methods: {},
  created() {
    this.$store.dispatch('db/ensureActivities').then(() => {
      this.loading = false;
    });
  },
};
</script>
