<template lang="pug">
div.row
  div.col
    h3 Donation Summary
  div.col(style="text-align: right")
    b-button(v-if="editMode", v-on:click='editMode = false', variant='outline-secondary', size='sm').mr-1
      | #[font-awesome-icon(icon="save")] Save
    b-button(v-else, v-on:click='editMode = true', variant='outline-secondary', size='sm').mr-1
      | #[font-awesome-icon(icon="edit")] Edit
  table.table.table-sm(style="overflow: hidden; table-layout: fixed")
    tr
      th Creator
      th Adress
      th.text-right(style="width: 20%") Amount $
    tr(v-for="d in donations", style="height: 40px")
      td 
        a(target="_blank", :href="d.url") {{ d.name }}&nbsp
          sup.text-secondary
            font-awesome-icon(icon="external-link-alt", size="xs")
      td
        input(v-if='editMode', type="text", style="width: 100%", v-model="d.address", @input='$emit("address", [d, $event])')
        input(v-else, disabled, type="text", style="width: 100%; ", v-model="d.address")
      td
        input(v-if="editMode", type="number", v-model="d.funds", style="text-align: right; width: 100%")
        input(v-else, disabled, type="text", style="text-align: right; width: 100%", v-model="d.funds")

  b-button(variant="success", size="lg", v-on:click="donateAll()")
    | Donate {{ total.toFixed(2) }}$
  hr

</template>

<script>
import _ from 'lodash';

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
    };
  },
  props: {
    creators: Array,
    totAmount: Number,
    donate: Object,
  },
  computed: {
    total() {
      return _.sumBy(this.donations, 'funds');
    },
    totalAllocated() {
      let addressAmounts = getAddressAmountMapping(this.donations);
      return _.sum(_.values(addressAmounts));
    },
    donations() {
      return _.orderBy(this.distribution, 'funds', 'desc');
    },
  },
  methods: {
    distribute() {
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
      const donations = this.donations;
      this.donate
        .donateAll(donations, this.refresh)
        .catch(e => this.$emit('error', e));
    },
  },
  created() {},
  watch: {
    creators() {
      this.distribute();
    },
  },
};
</script>

<style>
</style>
