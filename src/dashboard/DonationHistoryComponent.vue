<template lang="pug">
div(v-if="donationList.length === 0")
  | No donations made so far
div(v-else).d-flex.flex-column
  table.table.table-sm(style="overflow: hidden; table-layout: fixed").mb-0
    tr
      th(style="width: 25%; border-top: 0") Date
      th(style="border-top: 0") Creator
      th.text-right(style="width: 20%; border-top: 0") Amount
    tr(v-for="donation in donationList")
      td(style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;")
        // TODO: Adjust this to also work on mainnet when we have a DEBUG variable
        a(:href="'https://ropsten.etherscan.io/tx/' + donation.transaction" target="_blank")
          | {{donation.date.toLocaleDateString()}}
      td(style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;")
        a(:href="donation.url" target="_blank")
          | {{donation.creator}}
      td.text-right
        | {{donation.usdAmount}} $
  b-button(v-if="to && donationList.length > limit", variant="outline-secondary", size="sm", :to="to")
    | {{"Show all"}}
</template>
<script>
import { Database } from '../lib/db.js';
import _ from 'lodash';

const db = new Database();

export default {
  data: () => ({ donations: [] }),
  props: {
    limit: { default: Infinity, type: Number },
    to: { default: null, type: String },
  },
  computed: {
    donationList() {
      return _.take(this.donations, this.limit);
    },
  },
  methods: {
    refresh() {
      db.getDonations()
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
