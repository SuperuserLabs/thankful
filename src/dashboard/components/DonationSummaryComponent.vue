<template lang="pug">
div.pt-2
  v-card
    v-toolbar(flat, color='white')
      v-toolbar-title.display-1 Donation summary
      v-spacer
      v-flex(xs2, md1)
        v-text-field(v-model="totalAmount", type='number', prefix="$", step=1, min=0, single-line, hide-details)
      v-btn(large, outline, color="primary", @click="distribute(totalAmount)")
        | Distribute
    v-data-table(:headers="headers", :items="distribution", :pagination.sync='pagination', hide-actions)
      template(slot='items', slot-scope='props')
        td
          a(target="_blank", :href="props.item.url") {{ props.item.name }}
        td
          v-edit-dialog(large,
                        lazy,
                        @open="currentAddressValue = props.item.address",
                        @save="props.item.address = currentAddressValue ; updateAddress(props.item)")
            div {{ props.item.address }}
            div.mt-3.title(slot="input")
              | Change address
            v-text-field(slot="input",
                        :rules="rules.addressInput",
                        v-model="currentAddressValue",
                        single-line,
                        autofocus)
        td.text-xs-right
          v-edit-dialog(large,
                        lazy,
                        @open="currentFundsValue = props.item.funds"
                        @save="props.item.funds = parseFloat(currentFundsValue)")
            div {{ props.item.funds | fixed(2) }}
            div.mt-3.title(slot="input")
              | Change donation
            v-text-field(slot="input",
                        type="number",
                        step="0.1",
                        min="0",
                        :rules="rules.fundsInput",
                        v-model="currentFundsValue",
                        prefix="$",
                        single-line,
                        autofocus)

  div.text-xs-center.pt-2.pb-3
    v-btn(large, outline, color='primary', v-on:click="donateAll()")
      | Send your thanks! (${{ total.toFixed(2) }})
</template>

<script>
import _ from 'lodash';

export default {
  data: function() {
    return {
      editMode: false,
      distribution: [],
      headers: [
        { text: 'Creator', value: 'name' },
        { text: 'Address', value: 'address' },
        { text: 'Amount', value: 'funds', align: 'right' },
      ],
      pagination: { sortBy: 'funds', descending: true, rowsPerPage: -1 },
      currentFundsValue: 0,
      currentAddressValue: '',
      rules: {
        // TODO: Don't allow saving invalid inputs
        fundsInput: [v => parseFloat(v) >= 0 || 'Invalid donation!'],
        addressInput: [
          v => !v || this.$donate.isAddress(v) || 'Not a valid ETH address',
        ],
      },
    };
  },
  props: {
    creators: Array,
  },
  computed: {
    total() {
      return _.sumBy(this.distribution, 'funds');
    },
    totalAmount: {
      get() {
        return this.$store.state.settings.totalAmount;
      },
      set(value) {
        this.$store.commit('settings/updateSettings', { totalAmount: value });
        console.log('saved settings');
      },
    },
  },
  methods: {
    updateAddress(x) {
      this.$emit('addressUpdate', x);
    },
    distribute() {
      let scoring = c => Math.sqrt(c.duration);
      let totScore = _.sum(this.creators.map(scoring));
      let factor = 1 - _.sum(this.creators.map(c => c.share));

      this.distribution = this.creators.map(c => {
        let funds;
        if (c.share > 0) {
          funds = c.share * this.totalAmount;
        } else {
          funds = this.totalAmount * (scoring(c) / totScore) * factor;
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
      this.$donate
        .donateAll(this.distribution, () =>
          console.log('Please f5 to see new donation history.')
        )
        .catch(e => this.$emit('error', e));
    },
  },
  created() {
    this.distribute();
  },
  watch: {
    creators() {
      this.distribute();
    },
  },
};
</script>
