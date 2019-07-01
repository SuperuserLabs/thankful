<template lang="pug">
div.pt-2
  v-card
    v-card-title.display-1
      | Donation summary
    v-data-table(:headers="headers", :items="distribution", :pagination.sync='pagination', hide-actions)
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

  v-card.my-3
    v-card-title.display-1.pb-0
      | Missing addresses
    v-card-text
      | To donate, you have to manually fill in the creator addresses. (We're working on making this easier, sorry for the inconvenience)
      br
      | The below are links to known addresses, and a form to submit missing addresses. In the future, a database with known addresses will be loaded automatically.

    v-card-actions.justify-end
      v-btn(outline, target="_blank", href="https://docs.google.com/spreadsheets/d/1-eQaGFvbwCnxY9UCgjYtXRweCT7yu92UC2sqK1UEBWc/edit?usp=sharing")
        | List of addresses
      v-btn(outline, color="blue", target="_blank", href="https://docs.google.com/forms/d/e/1FAIpQLSc0E_Ea6KAa_UELMexYYyJh4E6A0XJCrHGsRRlWDleafNvByA/viewform")
        | Submit new addresses

  div.text-xs-center.pt-2.pb-3
    router-link(to="/checkout")
      v-btn(v-if="!buttonError", large, outline, color='primary')
        | Send your thanks! (${{ total.toFixed(2) }})
      v-btn(v-else, disabled, large, outline, color='primary', v-on:click="donateAll()")
        | {{ buttonError }}
</template>

<script>
import _ from 'lodash';
import moment from 'moment';
import { mapGetters } from 'vuex';
import { getInstallDate } from '../../lib/util.ts';

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
          v => !v || this.isAddress(v) || 'Not a valid ETH address',
        ],
      },
      lastDonationDate: new Date(),
    };
  },
  computed: {
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
    totalAmount() {
      return this.$store.state.settings.totalAmount;
    },
    timeSinceLastDonation() {
      const last_donation = this.lastDonationDate;
      console.log('lastduna', last_donation);
      return moment().diff(last_donation) / 1000;
    },
    monthlyAmount() {
      const one_month = 60 * 60 * 24 * 30; // 30 days in seconds
      return (
        0.1 *
        Math.floor(
          (10 * (this.totalAmount * this.time_since_donation)) / one_month
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
          funds: parseFloat((c.share * this.totalAmount).toFixed(2)),
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
