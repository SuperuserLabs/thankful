<template lang="pug">
v-layout(v-if='loading', row, justify-center, align-center).pa-5
  v-progress-circular(indeterminate, :size='50')
v-data-table(v-else, :headers="headers", :items="donations", :pagination.sync='pagination', hide-actions)
  template(slot='items', slot-scope='props')
    td
        | {{new Date(props.item.date).toLocaleDateString()}}
    td
      a(:href="props.item.creator.url" target="_blank")
        | {{props.item.creator.name}}
    td.text-xs-right
      // TODO: Don't hardcore the ropsten etherscan URL, detect which network Metamask is using
      a(:href="'https://ropsten.etherscan.io/tx/' + props.item.transaction" target="_blank")
        small(style="font-family: monospace; font-size: 65%")
          v-icon(small) link
          | &nbsp;{{props.item.transaction | trim(12)}}
    td.text-xs-right
      | ${{props.item.usdAmount | fixed(2)}}
</template>
<script>
import { mapState } from 'vuex';
export default {
  data: () => ({
    loading: true,
    headers: [
      { text: 'Date', value: 'date' },
      { text: 'Creator', value: 'creator.name' },
      { text: 'Transaction ID', value: 'transaction', align: 'right' },
      { text: 'Amount', value: 'usdAmount', align: 'right' },
    ],
    pagination: {
      sortBy: 'date',
      descending: 'false',
      rowsPerPage: -1,
    },
  }),
  computed: {
    ...mapState('db', ['donations']),
  },
  props: {},
  methods: {},
  created() {
    console.log('loading dons');
    this.$store.dispatch('db/ensureDonations').then(() => {
      console.log('loaded dons');
      this.loading = false;
    });
  },
};
</script>
