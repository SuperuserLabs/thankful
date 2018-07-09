<template lang="pug">
div.pt-2
  v-card
    v-toolbar(flat, color='white')
      v-toolbar-title Donation Summary
      v-spacer
      v-flex(xs2, md1)
        v-text-field(v-model="totAmount", type='number', append-icon='attach_money', single-line, hide-details)
      v-btn(color="primary", flat, @click="distribute(totAmount)")
        | Distribute
    v-data-table(:headers="headers", :items="distribution", :pagination.sync='pagination', hide-actions)
      template(slot='items', slot-scope='props')
        td 
          a(target="_blank", :href="props.item.url") {{ props.item.name }}
        td {{ props.item.address }}
        td {{ props.item.funds }}
  div.text-xs-center.pt-2.pb-3
    v-btn(color='primary', v-on:click="donateAll()")
      | Send your thanks! ({{ total.toFixed(2) }}$)
  hr
</template>

<script>
import _ from 'lodash';
import browser from 'webextension-polyfill';

function getAddressAmountMapping(creators) {
  return _.fromPairs(
    _.map(creators, k => {
      return [k.address, Number(k.allocatedFunds)];
    }).filter(d => {
      return _.every(d);
    })
  );
}

export default {
  data: function() {
    return {
      editMode: false,
      distribution: [],
      totAmount: 10,
      headers: [
        { text: 'Creator', value: 'name' },
        { text: 'Address', value: 'address' },
        { text: 'Amount', value: 'funds' },
      ],
      pagination: { sortBy: 'funds', descending: true, rowsPerPage: -1 },
    };
  },
  props: {
    creators: Array,
    donate: Object,
  },
  computed: {
    total() {
      return _.sumBy(this.distribution, 'funds');
    },
    totalAllocated() {
      let addressAmounts = getAddressAmountMapping(this.donations);
      return _.sum(_.values(addressAmounts));
    },
  },
  methods: {
    distribute() {
      let settings = { totalAmount: this.totAmount };
      browser.storage.local
        .set({ settings })
        .then(() => console.log('saved settings'));

      let scoring = c => Math.sqrt(c.duration);
      let totScore = _.sum(this.creators.map(scoring));
      let factor = 1 - _.sum(this.creators.map(c => c.share));

      this.distribution = this.creators.map(c => {
        let funds;
        if (c.share > 0) {
          funds = c.share * this.totAmount;
        } else {
          funds = this.totAmount * (scoring(c) / totScore) * factor;
        }
        return {
          name: c.name,
          duration: c.duration,
          url: c.url,
          address: c.address,
          funds: parseFloat(funds.toFixed(2)),
        };
      });
    },
    donateAll() {
      this.donate
        .donateAll(this.donations, this.refresh)
        .catch(e => this.$emit('error', e));
    },
  },
  created() {
    // set totAmount to value saved in localstorage
    browser.storage.local
      .get('settings')
      .then(settings => (this.totAmount = settings.settings.totalAmount));
  },
  watch: {
    creators() {
      this.distribute();
    },
  },
};
</script>

<style>
</style>
