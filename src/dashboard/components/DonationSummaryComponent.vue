<template lang="pug">
div.pt-2
  v-card
    v-toolbar(flat, color='white')
      v-toolbar-title.display-1 Donation summary
      v-btn.ml-4(small, flat, target="_blank", href="https://docs.google.com/spreadsheets/d/1-eQaGFvbwCnxY9UCgjYtXRweCT7yu92UC2sqK1UEBWc/edit?usp=sharing")
        | List of addresses
      v-btn(small, flat, target="_blank", href="https://docs.google.com/forms/d/e/1FAIpQLSc0E_Ea6KAa_UELMexYYyJh4E6A0XJCrHGsRRlWDleafNvByA/viewform")
        | Submit new addresses

      v-spacer

      div
        | Budget:
      v-flex(xs2, md1)
        v-text-field(v-model="budget", type='number', prefix="$", suffix="/month", step=1, min=0, single-line, hide-details).pt-0
      v-btn(large, outline, color="primary", @click="distribute(totalAmount)")
        | Distribute ${{ totalAmount }}
    v-data-table(:headers="headers", :items="distribution", :pagination.sync='pagination', hide-actions)
      template(slot='items', slot-scope='props')
        td
          a(target="_blank", :href="props.item.url") {{ props.item.name }}
        td
          v-edit-dialog(large,
                        lazy,
                        @open="currentAddressValue = props.item.address",
                        @save="updateAddress(props.item.index, currentAddressValue )")
            div(style="font-family: monospace").text--secondary.subheading {{ props.item.address }}
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
    v-btn(v-if="!buttonError", large, outline, color='primary', v-on:click="donateAll()")
      | Send your thanks! (${{ total.toFixed(2) }})
    v-btn(v-else, disabled, large, outline, color='primary', v-on:click="donateAll()")
      | {{ buttonError }}
</template>

<script>
import _ from 'lodash';
import moment from 'moment';
import { mapGetters } from 'vuex';
import { getInstallDate } from '../../lib/util.js';

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
      const last_donation = this.lastDonationDate;
      console.log('lastduna', last_donation);
      const time_since_donation = moment().diff(last_donation) / 1000;
      const one_month = 60 * 60 * 24 * 30; // 30 days in seconds
      return (
        0.1 *
        Math.floor(
          (10 *
            (this.$store.state.settings.totalAmount * time_since_donation)) /
            one_month
        )
      );
    },
    budget: {
      get() {
        return this.$store.state.settings.totalAmount;
      },
      set(value) {
        this.$store.commit('settings/updateSettings', { totalAmount: value });
      },
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
    distribute() {
      this.distribution = this.creators.map(c => {
        return {
          ...c,
          funds: parseFloat((c.share * this.totalAmount).toFixed(2)),
        };
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
