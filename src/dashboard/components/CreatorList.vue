<template lang="pug">
v-layout(v-if='loading', row, justify-center, align-center).pa-5
  v-progress-circular(indeterminate, :size='50')
v-data-table(v-else, :headers="headers", :items="creators", :pagination.sync='pagination')
  template(slot='items', slot-scope='props')
    td
      a(:href="props.item.url", target="_blank")
        | {{ props.item.name || props.item.url }}
    td
      | {{ props.item.duration | friendlyDuration }}
    td
      v-btn(icon, @click='ignore(props.item)')
        v-icon(v-show='!props.item.ignore') visibility
        v-icon(v-show='props.item.ignore') visibility_off
    td
      v-icon(v-show='props.item.priority == 2') star
      v-icon(v-show='props.item.priority == 1') heart
    td
      v-btn(color='warning', @click='remove(props.item)') Delete
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data: () => ({
    loading: true,
    headers: [
      { text: 'Creator', value: 'name', width: '500px' },
      { text: 'Duration', value: 'duration' },
      { text: 'Ignored', value: 'ignore', width: '50px' },
      { text: 'Favorite', value: 'priority', width: '50px' },
      { text: 'Remove', value: 'name', sortable: false, width: '200px' },
    ],
    pagination: { sortBy: 'duration', descending: true, rowsPerPage: -1 },
  }),
  props: {
    limit: { default: Infinity, type: Number },
    unattributed: { default: false, type: Boolean },
  },
  computed: {
    ...mapGetters('db', ['creators']),
  },
  methods: {
    ignore(creator) {
      this.$store.dispatch('db/doUpdateCreator', {
        index: creator.index,
        updates: { ignore: !creator.ignore },
      });
    },
    remove(creator) {
      this.$store.dispatch('db/removeCreator', {
        index: creator.index,
      });
    },
  },
  created() {
    this.$store.dispatch('db/ensureCreators').then(() => {
      this.loading = false;
    });
  },
};
</script>
