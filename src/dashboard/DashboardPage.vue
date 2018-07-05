<template lang="pug">
div.container
  a(v-on:click='toTop()', v-if='dismissedErrors < errors.length', style='position:fixed;bottom:20px;right:100px;z-index:100')
    font-awesome-icon(icon="exclamation-triangle", size='3x', style='cursor:pointer').text-warning
  div.row
    div.col-md-6
      div
        b-alert(show)
          div(v-if='netId === -1')
            | You are not connected to an Ethereum Network. Please install this extension: #[a(href='https://metamask.io/') https://metamask.io/].
          div(v-else)
            | You are connected to the {{ netName }}
        b-alert(v-for="error in errors", show, dismissible, variant='warning', @dismissed='dismissedErrors++')
          | {{ error }}
    b-row(align-h='end').col-md-6.p-0
      b-form(inline)
        b-input-group(append="$").mb-2.mr-sm-2.mb-sm-0
          b-form-input(v-model="monthlyDonation")
        b-button(variant="success", @click="distribute")
          | Distribute
  div
    div.d-flex.flex-row.justify-content-between
      h3 Creators
      div
        b-button(v-if="editing < 0",variant="success", size="sm", v-on:click="addCreator()")
          | #[font-awesome-icon(icon="user-plus")] Add creator
    div(v-if="creators.length === 0")
      | No creators to show

    div.card-columns
      creator-card(v-for="(creator, index) in creators",
                   v-bind:creator="creator",
                   v-bind:key="creator.url",
                   v-bind:editing="index === editing",
                   @address="creator.address = $event; creator.save();",
                   @save="save(creator, $event)"
                   @cancel="cancel(creator)"
                   @edit="editing = index"
                   @remove="remove(creator, index)"
                   @ignore="ignore(creator, index)"
                   )

    donation-summary-component(:donations="donations")

    b-button(variant="success", size="lg", v-on:click="donateAll()")
      | Donate {{ totalAllocated }}$
    hr

  div.row
    div.col-6
      h3 Unattributed Activity
      b-card.p-2.bt-0(no-body)
        activity-component(:limit="10", :unattributed="true", to="/activity")
    div.col-6
      h3 Donation history
      b-card.p-2.bt-0(no-body)
        donation-history-component(:limit="10", ref="donationHistory", to="/donations")
</template>

<script>
import browser from 'webextension-polyfill';
import CreatorCard from './CreatorCard.vue';
import ActivityComponent from './ActivityComponent.vue';
import DonationHistoryComponent from './DonationHistoryComponent.vue';
import DonationSummaryComponent from './DonationSummaryComponent.vue';
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
  creator.priority = 1;
  return creator.save();
}

export default {
  components: {
    'creator-card': CreatorCard,
    'activity-component': ActivityComponent,
    'donation-history-component': DonationHistoryComponent,
    'donation-summary-component': DonationSummaryComponent,
  },
  data: function() {
    return {
      creatorList: [],
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
    donations() {
      return _.orderBy(
        this.creators,
        c => parseFloat(c.allocatedFunds),
        'desc'
      );
    },
    creators() {
      return _.take(this.creatorList, 12);
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
    distribute() {
      let scoring = c => Math.sqrt(c.duration);
      let totScore = _.sum(this.creators.map(scoring));
      _.each(this.creators, c => {
        c.allocatedFunds = (this.monthlyDonation * scoring(c)) / totScore;
      });
    },
    donateAll() {
      const donations = this.donations;
      this.donate
        .donateAll(donations, this.refresh)
        .catch(this.errfun('Donating failed'));
    },
    addCreator() {
      if (this.editing < 0) {
        let c = new Creator('', '');
        c.priority = 2;
        this.creatorList.unshift(c);
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
      this.creatorList.splice(index, 1);
      this.editing = -1;
    },
    ignore(creator, index) {
      creator.ignore = true;
      creator.save();
      this.creatorList.splice(index, 1);
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
        // Find accumulated duration for creators
        let creatorsWithDuration = Promise.all(
          creators.filter(c => c.ignore !== true).map(c =>
            db.getCreatorActivity(c.url).then(acts =>
              Object.assign({ __proto__: c.__proto__ }, c, {
                duration: _.sum(acts.map(act => act.duration)),
                allocatedFunds: 0,
              })
            )
          )
        );

        // Sort creators by duration
        creatorsWithDuration.then(x => {
          this.creatorList = _.orderBy(
            x,
            ['priority', 'duration'],
            ['asc', 'desc']
          );
        });

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
  beforeCreate() {
    // These below are async, might not have run in time
    initThankfulTeamCreator();
    db.attributeGithubActivity();
  },
};
</script>

<style src="./dashboard.css">
</style>
