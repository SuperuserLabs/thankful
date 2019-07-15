<template lang="pug">
div.pt-2
  v-card
    v-card-title.display-1
      | Donation summary
    v-data-table(:headers="headers", :items="distribution", :pagination.sync='pagination')
      template(slot='items', slot-scope='props')
        td
          a(target="_blank", :href="props.item.url") {{ props.item.name }}
        td
          v-edit-dialog(large,
                        lazy,
                        @open="currentAddressValue = props.item.address",
                        @save="updateAddress(props.item.index, currentAddressValue )")
            div.text--secondary.subheading
              span(v-if="props.item.address" style="font-family: monospace").body-1 {{ props.item.address | trim(24) }}
              span(v-else, style="color: #CCC !important") Missing address, click to edit

            div.mt-3.title(slot="input")
              | Change address
            v-text-field(slot="input",
                        :rules="rules.addressInput",
                        v-model="currentAddressValue",
                        single-line,
                        autofocus)
        // fix this ugly mess
        td
          v-layout(row, wrap)
            v-flex
              v-slider(
                color="green",
                :value="100 * props.item.funds / total",
                @change="(x) => changeDonationAmount(creators, props.item, x)",
                min="0",
                max="100",)
            v-flex
              v-edit-dialog.text-xs-right(large,
                            lazy,
                            @open="currentFundsValue = props.item.funds"
                            @save="changeDonationAmount(creators, props.item, 100 * currentFundsValue / total)")
                div.text--secondary.subheading
                  | {{ props.item.funds | fixed(2) | prepend('$') }}
                div.mt-3.title(slot="input")
                  | Change donation
                v-text-field(slot="input",
                            type="number",
                            hint="Your monthly budget",
                            step="0.1",
                            min="0",
                            :rules="rules.fundsInput",
                            v-model="currentFundsValue",
                            prefix="$",
                            single-line,
                            autofocus)

</template>

<script>
import _ from 'lodash';
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  props: ['checkout'],
  data: function() {
    return {
      editMode: false,
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
          v => !v || this.isAddress(v) || 'Not a valid ETH address',
        ],
      },
    };
  },
  computed: {
    ...mapState('settings', ['budget_per_month']),
    ...mapState('metamask', ['distribution']),
    ...mapGetters({
      isAddress: 'metamask/isAddress',
      creators: 'db/creatorsWithShare',
    }),
    total() {
      return _.sumBy(this.distribution, 'funds');
    },
    monthlyAmount() {
      const one_month = 60 * 60 * 24 * 30; // 30 days in seconds
      return (
        0.1 *
        Math.floor(
          (10 * (this.budget_per_month * this.timeSinceLastDonation)) /
            one_month
        )
      );
    },
    highestAmount() {
      return _.max(_.map(this.distribution, c => c.funds));
    },
  },
  methods: {
    ...mapActions('metamask', ['changeDonationAmount']),
    updateAddress(index, address) {
      this.$store.dispatch('db/doUpdateCreator', {
        index: index,
        updates: { address: address },
      });
    },
    distribute() {
      let new_dist = this.creators.map(c => {
        return {
          ...c,
          funds: parseFloat(c.share * this.budget_per_month).toFixed(2),
        };
      });
      console.log(new_dist);
      this.$store.commit('metamask/distribute', new_dist);
    },
  },
  async mounted() {
    await this.$store.dispatch('db/ensureDonations');
    await this.$store.dispatch('db/ensureCreators');
    this.distribute();
  },
  watch: {
    creators() {
      this.distribute();
    },
  },
};
</script>

<style>
/* TODO: Use SCSS (needs Webpack loader)
   Fix as described here: https://github.com/vuetifyjs/vuetify/issues/4450#issuecomment-425608189
  */
.text-xs-right .v-menu__activator {
  display: block;
  justify-content: right;
}

.text-xs-right .v-menu__activator a {
  width: 100%;
}
</style>
