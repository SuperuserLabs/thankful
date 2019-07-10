<template lang="pug">
v-layout(v-if='loading', row, justify-center, align-center).pa-5
  v-progress-circular(indeterminate, :size='50')
v-data-table(v-else, :headers="headers", :items="activitiesWithCreator", :pagination.sync='pagination')
  template(slot='items', slot-scope='props')
    td(style="text-overflow:ellipsis; max-width: 0; overflow: hidden; white-space: nowrap;")
      a(:href="props.item.url", target="_blank")
        | {{ props.item.title || props.item.url }}
    td
      a(v-if="props.item.creator", :href="props.item.creator.url", target="_blank")
        | {{ props.item.creator.name }}
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
      { text: 'Page', value: 'title', width: '60%' },
      { text: 'Creator', value: 'creator.name', width: '20%' },
      { text: 'Duration', value: 'duration', width: '20%' },
      { text: 'Thanks', value: 'thanks', width: '20%' },
    ],
    pagination: { sortBy: 'duration', descending: true, rowsPerPage: 10 },
    loading: true,
  }),
  computed: {
    ...mapGetters('db', ['activities', 'creators']),
    activitiesWithCreator() {
      return this.activities({
        withCreator: true,
        onlyUnattributed: this.unattributed,
      });
    },
  },
  props: {
    unattributed: { default: false, type: Boolean },
  },
  methods: {},
  async created() {
    await Promise.all([
      this.$store.dispatch('db/ensureActivities'),
      this.$store.dispatch('db/ensureCreators'),
    ]);
    this.loading = false;
  },
};
</script>
