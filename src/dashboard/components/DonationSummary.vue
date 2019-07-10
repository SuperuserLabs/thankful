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
                @change="(x) => changeDonationAmount(props.item, x)",
                min="0",
                max="100",
                style="display: inline-block")
            v-flex
              v-edit-dialog.text-xs-right(large,
                            lazy,
                            @open="currentFundsValue = props.item.funds"
                            @save="props.item.funds = parseFloat(currentFundsValue)")
                div.text--secondary.subheading(style="display: inline-block")
                  span {{ props.item.funds | fixed(2) | prepend('$') }}
                div.mt-3.title(slot="input")
                  | Change donation
                v-text-field(slot="input",
                            type="number",
                            hint="Your monthly budget",
                            step="0.1",
                            min="0",
                            :rules="rules.fundsInput",
                            :value="props.item.funds",
                            prefix="$",
                            single-line,
                            autofocus)

  div.text-xs-center.pt-2.pb-3(v-if="checkout")
    v-btn(v-if="!buttonError", large, color='primary' @click="donateAll()")
      | Send your thanks! (${{ total.toFixed(2) }})
    v-btn(v-else disabled large outline color='primary')
      | {{ buttonError }}
</template>

<script>
import _ from 'lodash';
import { mapState, mapGetters } from 'vuex';

export default {
  props: ['distribution', 'checkout'],
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
    total() {
      return _.sumBy(this.distribution, 'funds');
    },
    buttonError() {
      let { netId, address } = this.$store.state.metamask;
      if (netId === -1) {
        return 'Please install MetaMask to be able to donate';
      }
      if (!address) {
        return 'Please log in to MetaMask to be able to donate';
      }
      return '';
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
    ...mapGetters({
      isAddress: 'metamask/isAddress',
      creators: 'db/creatorsWithShare',
    }),
  },
  methods: {
    changeDonationAmount(creator, new_value) {
      const dist =
        Object.keys(this.$store.state.metamask.distribution).length > 0
          ? this.$store.state.metamask.distribution
          : this.creators.reduce((obj, c) => {
              obj[c.id] = c.share;
              return obj;
            }, {});
      const redist_targets = _.omit(dist, [creator.id]);
      const unchanged_share_sum = _.sum(Object.values(redist_targets));
      const change = new_value / 100 - dist[creator.id];
      const new_dist = _.mapValues(redist_targets, share => {
        if (unchanged_share_sum > 10e-3) {
          return share - (share * change) / unchanged_share_sum;
        } // redistribute equally if all other sliders are set to ~0
        return (-1 * change) / Object.keys(redist_targets).length;
      });
      new_dist[creator.id] = new_value / 100;
      this.$store.commit('metamask/distribute', new_dist);
      this.distribute();
    },
    updateAddress(index, address) {
      this.$store.dispatch('db/doUpdateCreator', {
        index: index,
        updates: { address: address },
      });
    },
    distribute() {
      const store_dist = this.$store.state.metamask.distribution;
      this.distribution = this.creators.map(c => {
        return {
          ...c,
          funds: parseFloat(
            (
              (Object.keys(store_dist).length > 0
                ? store_dist[c.id]
                : c.share) * this.budget_per_month
            ).toFixed(2)
          ),
        };
      });
    },
    async updateLastDonationDate() {
      const lastDonation = this.$store.state.db.donations[0];
      this.lastDonationDate =
        lastDonation === undefined
          ? await getInstallDate()
          : new Date(lastDonation.date);
    },
  },
  async created() {
    await this.$store.dispatch('db/ensureDonations');
    await this.updateLastDonationDate();
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
