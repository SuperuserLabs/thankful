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
        td
          v-edit-dialog.text-xs-right(large,
                        lazy,
                        @open="currentFundsValue = props.item.funds"
                        @save="props.item.funds = parseFloat(currentFundsValue)")
            div
              v-slider(color="green", :value="80 * props.item.funds / highestAmount", readonly, :label="props.item.funds | fixed(2) | prepend('$')", inverse-label)
              //| ${{ props.item.funds | fixed(2) }}
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

  div.text-xs-center.pt-2.pb-3(v-if="checkout")
    v-btn(v-if="!buttonError", large, color='primary' @click="donateAll()")
      | Send your thanks! (${{ total.toFixed(2) }})
    v-btn(v-else disabled large outline color='primary')
      | {{ buttonError }}
</template>

<script>
import _ from 'lodash';
import moment from 'moment';
import { mapState, mapGetters } from 'vuex';
import { getInstallDate } from '../../lib/util.ts';

export default {
  props: ['checkout'],
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
          v => !v || this.isAddress(v) || 'Not a valid ETH address',
        ],
      },
      lastDonationDate: new Date(),
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
    timeSinceLastDonation() {
      const last = this.lastDonationDate;
      const time_since = moment().diff(last) / 1000;
      console.log('last donation was', last, ', ', time_since, 'seconds ago');
      return time_since;
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
    updateAddress(index, address) {
      this.$store.dispatch('db/doUpdateCreator', {
        index: index,
        updates: { address: address },
      });
    },
    donateAll() {
      this.$store.dispatch('metamask/donateAll', this.distribution).catch(e => {
        console.error('donateAll (in vue) error:', e);
        // We're currently not catching the emitting anywhere so we
        // console.error for now
        this.$emit('error', e);
      });
    },
    distribute() {
      this.distribution = this.creators.map(c => {
        return {
          ...c,
          funds: parseFloat((c.share * this.budget_per_month).toFixed(2)),
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
