<template lang="pug">
v-layout(v-if='loading', row, justify-center, align-center).pa-5
  v-progress-circular(indeterminate, :size='50')
v-data-table(v-else, :headers="headers", :items="donations", :options.sync='options', hide-actions)
  template(slot='items', slot-scope='props')
    td
        | {{new Date(props.item.date).toLocaleDateString()}}
    td
      a(:href="props.item.creator.url" target="_blank")
        | {{props.item.creator.name}}
    td.text-xs-right
      a(:href="networks[props.item.net_id || 3].explorer_url + props.item.transaction" target="_blank")
        small(style="font-family: monospace; font-size: 65%")
          v-icon(small) link
          | &nbsp;{{props.item.transaction | trim(12)}}
    td.text-xs-right
      | ${{props.item.usdAmount | fixed(2)}}
</template>
<script>
import { mapState } from 'vuex';
import networks from '../../lib/networks.js';

export default {
  data: () => ({
    networks: networks,
    loading: true,
    headers: [
      { text: 'Date', value: 'date' },
      { text: 'Creator', value: 'creator.name' },
      { text: 'Transaction ID', value: 'transaction', align: 'right' },
      { text: 'Amount', value: 'usdAmount', align: 'right' },
    ],
    options: {
      sortBy: ['date'],
      sortDesc: [false],
      itemsPerPage: -1,
    },
  }),
  computed: {
    ...mapState('db', ['donations']),
  },
  props: {},
  methods: {},
  created() {
    this.$store.dispatch('db/ensureDonations').then(() => {
      this.loading = false;
    });
  },
};
</script>
