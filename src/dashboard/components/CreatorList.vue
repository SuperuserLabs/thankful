<template lang="pug">
v-layout(v-if='loading', row, justify-center, align-center).pa-5
  v-progress-circular(indeterminate, :size='50')
v-data-table(v-else, :headers="headers", :items="creators", :pagination.sync='pagination')
  template(slot='items', slot-scope='props')
    td
      a(:href="props.item.url", target="_blank")
        | {{ props.item.name || props.item.url }}
    td(style="white-space: nowrap;")
      | {{ props.item.duration | friendlyDuration }}
    td
      | {{ props.item.thanksAmount || '' }}
    td.pr-0
      v-layout(row)
        v-flex
        v-flex(shrink, style="white-space: nowrap;")
          v-icon(v-show='props.item.priority == 2') star
          v-icon(v-show='props.item.priority == 1') heart

          v-tooltip(bottom)
            template(v-slot:activator="{ on }")
              v-btn(@click='' icon v-on="on")
                v-icon(color="#aaa") history
            span Show activity (not implemented)

          v-tooltip(bottom)
            template(v-slot:activator="{ on }")
              v-btn(@click='' icon v-on="on")
                v-icon(color="#aaa") edit
            span Edit (not implemented)

          v-tooltip(bottom)
            template(v-slot:activator="{ on }")
              v-btn(icon, @click='ignore(props.item)' v-on="on")
                v-icon(v-show='!props.item.ignore') visibility
                v-icon(v-show='props.item.ignore' color="#AAA") visibility_off
            span(v-show='!props.item.ignore') Ignore
            span(v-show='props.item.ignore') Un-ignore

          v-tooltip(bottom)
            template(v-slot:activator="{ on }")
              v-btn(@click='remove(props.item)' icon v-on="on")
                v-icon delete
            span Delete
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data: () => ({
    loading: true,
    headers: [
      { text: 'Creator', value: 'name', width: '60%' },
      { text: 'Duration', value: 'duration', width: '10%' },
      { text: 'Thanks', value: 'thanksAmount', width: '10%' },
      { text: '', value: 'actions', sortable: false },
    ],
    pagination: { sortBy: 'duration', descending: true, rowsPerPage: 10 },
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
  async created() {
    await this.$store.dispatch('db/ensureCreators');
    this.loading = false;
  },
};
</script>
