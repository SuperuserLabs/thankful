<template lang="pug">
div.container
  div.mb-2
    b-alert(show).mt-2.mb-0.p-2
      div(v-if="netId === -1")
        | You are not connected to an Ethereum Network. Please install this extension: #[a(href='https://metamask.io/') https://metamask.io/].
      div(v-else)
        | You are connected to the {{ netName }}
  div.row
    div.col-md-6
      div.d-flex.flex-row.justify-content-between
        h3 Creators
        div
          b-button(v-if="editing < 0",variant="success", size="sm", v-on:click="addCreator()")
            | #[font-awesome-icon(icon="user-plus")] Add creator
      div(v-if="creators.length === 0")
        | No creators to show
      creator-card(v-for="(creator, index) in creators",
                   v-bind:creator="creator",
                   v-bind:key="creator.url",
                   v-bind:editing="index === editing",
                   @allocatedFunds="creator.allocatedFunds = $event; creator.save();",
                   @address="creator.address = $event; creator.save();",
                   @save="save(creator, $event)"
                   @cancel="cancel(creator)"
                   @edit="editing = index"
                   @remove="remove(creator, index)"
                   )

      b-button(variant="success", size="lg", v-on:click="donateAll()")
        | Donate {{ totalAllocated }}$
      hr

      h3 Unattributed Activity
      b-card.p-2.bt-0(no-body)
        activity-component(:limit="10", :unattributed="true", to="/activity")

    div.col-md-6
      h3 Monthly donation
        // TODO: Form group
        b-input-group(append="$").mt-2
          b-form-input(v-model="monthlyDonation")


      h3 Donation history
      b-card.p-2.bt-0(no-body)
        donation-history-component(:limit="10", ref="donationHistory", to="/donations")
</template>

<script>
import browser from 'webextension-polyfill';
import CreatorCard from './CreatorCard.vue';
import ActivityComponent from './ActivityComponent.vue';
import DonationHistoryComponent from './DonationHistoryComponent.vue';
import Donate from '../lib/donate.js';
import { Database, Activity, Creator, Donation } from '../lib/db.js';
import BigNumber from 'bignumber.js';
import _ from 'lodash';

// TODO: Move to appropriate location
const db = new Database();

function getAddressAmountMapping(creators) {
  return _.fromPairs(
    _.map(creators, k => {
      return [k.address, Number(k.allocatedFunds)];
    }).filter(d => {
      return _.every(d);
    })
  );
}

function initThankfulTeamCreator() {
  const creator = new Creator('https://getthankful.io', 'Thankful Team');
  // Erik's address
  // TODO: Change to a multisig wallet
  creator.address = '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
  creator.info = 'Be thankful for Thankful and donate to the Thankful team!';
  return creator.save();
}

// TODO: Move to better place
initThankfulTeamCreator();

export default {
  components: {
    'creator-card': CreatorCard,
    'activity-component': ActivityComponent,
    'donation-history-component': DonationHistoryComponent,
  },
  data: function() {
    return {
      creators: [],
      donate: new Donate(),
      monthlyDonation: 10,
      editing: -1,
      netId: -1,
    };
  },
  computed: {
    totalAllocated() {
      let addressAmounts = getAddressAmountMapping(this.creators);
      return _.sum(_.values(addressAmounts));
    },
    netName() {
      let names = {
        1: 'Main Ethereum Network',
        3: 'Ropsten Test Network',
        4: 'Rinkeby Test Network',
        42: 'Kovan Test Network',
      };
      return names[this.netId];
    },
  },
  methods: {
    donateAll() {
      const donations = this.creators.filter(c => c.allocatedFunds > 0);
      this.donate
        .donateAll(donations, this.refresh)
        .catch(err => console.error('Donating failed:', err));
    },
    addCreator() {
      if (this.editing < 0) {
        this.creators.unshift(new Creator('', ''));
        this.editing = 0;
      }
    },
    cancel(creator) {
      if (creator.url === '') {
        this.creators.shift();
      }
      this.editing = -1;
    },
    remove(creator, index) {
      creator.delete();
      this.creators.splice(index, 1);
      this.editing = -1;
    },
    save(creator, edited) {
      creator.delete().then(() => {
        Object.assign(creator, edited);
        creator.save();
        this.editing = -1;
      });
    },
    refresh() {
      db.getCreators().then(creators => {
        console.log(creators);

        this.creators = creators;
        this.$refs.donationHistory.refresh();

        this.donate.getId().then(id => {
          console.log(id);
          this.netId = id;
        });
      });
    },
  },
  created() {
    this.refresh();
  },
};
</script>

<style src="./dashboard.css">
</style>
