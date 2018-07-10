<template lang="pug">
div
  v-data-table(:headers="headers", :items="donations", :pagination.sync='pagination', hide-actions)
    template(slot='items', slot-scope='props')
      td
        a(:href="'https://ropsten.etherscan.io/tx/' + props.item.transaction" target="_blank")
            | {{props.item.date.toLocaleDateString()}}
      td
        a(:href="props.item.url" target="_blank")
          | {{props.item.creator}}
      td.text-xs-right
        | {{props.item.usdAmount}} $
  div.text-xs-center.pt-2
    v-btn(v-if="toAll", size="sm", :to="toAll")
      | Show all
</template>
<script>
export default {
  data: () => ({
    donations: [],
    headers: [
      { text: 'Date', value: 'date' },
      { text: 'Creator', value: 'creator' },
      { text: 'Amount', value: 'usdAmount' },
    ],
    pagination: { sortBy: 'date', descending: 'false', rowsPerPage: 5 },
  }),
  props: {
    toAll: { default: null, type: String },
  },
  methods: {
    refresh() {
      this.$db
        .getDonations()
        .then(ds => {
          this.donations = ds;
        })
        .catch(console.error);
    },
  },
  created() {
    this.refresh();
  },
};
</script>
