<template lang="pug">
div.container
  a(v-on:click='toTop()', v-if='dismissedErrors < errors.length', style='position:fixed;bottom:20px;right:100px;z-index:100')
    font-awesome-icon(icon="exclamation-triangle", size='3x', style='cursor:pointer').text-warning
  div
    b-alert(show)
      div(v-if='netId === -1')
        | You are not connected to an Ethereum Network. Please install this extension: #[a(href='https://metamask.io/') https://metamask.io/].
      div(v-else)
        | You are connected to the 
        span {{ netName }}
    b-alert(v-for="error in errors", show, dismissible, variant='warning', @dismissed='dismissedErrors++')
      | {{ error }}
  div.row
    div.col-md-6
      div.d-flex.flex-row.justify-content-between
        h3 Creators
        div
          b-button(v-if="editing < 0",variant="outline-secondary", size="sm", v-on:click="addCreator()")
            | Add creator 
            font-awesome-icon(icon="user-plus")
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

      div.d-flex.flex-row
        div
          b-button(variant="success", size="lg", v-on:click="donateAll()")
            | Donate {{ totalAllocated }}$
      hr

      h3 Unattributed Activity
      b-card.p-2.bt-0(no-body)
        activity-component(:limit="10", :unattributed="true", to="/activity")

    div.col-md-6
      h3 Monthly donation:
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
      errors: [],
      dismissedErrors: 0,
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
    toTop() {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    },
    errfun(title, sink = this.errors) {
      return message => {
        sink.push(`${title}: ${message}`);
      };
    },
    donateAll() {
      const donations = this.creators.filter(c => c.allocatedFunds > 0);
      this.donate
        .donateAll(donations, this.refresh)
        .catch(this.errfun('Donating failed'));
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
        // Testing
        if (creators.length === 0) {
          creators = [
            new Creator(
              'https://example.com/test',
              'No data found, all data is testing data'
            ),
            new Creator('https://youtube.com/channel/lol', 'sadmemeboi'),
            new Creator('https://youtube.com/channel/pewdiepie', 'pewdiepie'),
          ];
        }

        const thankful_team_creator = new Creator(
          'https://getthankful.io',
          'Thankful Team'
        );
        // Eriks address
        thankful_team_creator.address =
          '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
        thankful_team_creator.info = 'Optionally donate to the Thankful team';
        thankful_team_creator.predefined = true;
        creators.push(thankful_team_creator);

        this.creators = creators;
        this.$refs.donationHistory.refresh();

        this.donate.getId().then(id => {
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
