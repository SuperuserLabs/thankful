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
    // TODO: Make this a checkbox and send it on donation instead
  div.text-xs-center.pb-3
    v-btn(large, outline, color='primary', v-on:click="sendAddressLess()")
      | Send address-less creator info
</template>

<script>
import _ from 'lodash';
import { mapGetters } from 'vuex';

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
    totalAmount: {
      get() {
        return this.$store.state.settings.totalAmount;
      },
      set(value) {
        this.$store.commit('settings/updateSettings', { totalAmount: value });
        console.log('saved settings');
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
      this.$store
        .dispatch('metamask/donateAll', this.distribution)
        .catch(e => this.$emit('error', e));
    },
    async sendAddressLess() {
      try {
        const server = 'http://localhost:5000';
        const res = await fetch(
          server +
            '/missing/?missing_info=' +
            JSON.stringify({ hello: 'world' }),
          { method: 'POST' }
        );
        if (res.status !== 200) {
          console.error(
            `Unexpected address-less creator response, status: ${
              res.status
            }, message: ${await res.text()}`
          );
        }
      } catch (err) {
        console.error('Failed to send address-less creators:' + err);
      }
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
