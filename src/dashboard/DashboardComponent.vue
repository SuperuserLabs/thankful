<template lang="pug">
div.container
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

      b-button(variant="success", size="lg", v-on:click="donateAll()")
        | Donate {{ totalAllocated }}$

      hr

      h3 Unattributed Activity
      b-card.p-2.bt-0(no-body)
        activity-component(:limit="10")
        b-button(variant="outline-secondary", size="sm", to="/activity")
          | Show all

    div.col-md-6
      h3 Empty section
      p How much to donate each month:
        // TODO: Form group
        b-input-group(append="$")
          b-form-input(v-model="monthlyDonation")


      h3 Donation history
      div(v-if="donationList.length === 0")
        | No donations made so far
      b-card.p-2.bt-0(v-else no-body)
        table.table.table-sm(style="overflow: hidden; table-layout: fixed")
          tr
            th(style="width: 25%; border-top: 0") Date
            th(style="border-top: 0") Creator
            th.text-right(style="width: 20%; border-top: 0") Amount
          tr(v-for="donation in donationList")
            td(style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;")
              // TODO: Adjust this to also work on mainnet when we have a DEBUG variable
              a(:href="'https://ropsten.etherscan.io/tx/' + donation.transaction" target="_blank")
                | {{donation.date.toLocaleDateString()}}
            td(style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;")
              a(:href="donation.url" target="_blank")
                | {{donation.creator}}
            td.text-right
              | {{donation.usdAmount}} $
        b-button(variant="outline-secondary", size="sm", to="/activity")
          | {{"Don't Show all"}}
</template>

<script>
import browser from 'webextension-polyfill';
import CreatorCard from './CreatorCard.vue';
import ActivityComponent from './ActivityComponent.vue';
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
  },
  data: function() {
    return {
      creators: [],
      unattributedActivities: [],
      donate: new Donate(),
      monthlyDonation: 10,
      numUnorderedShow: 10,
      donationLog: [],
      editing: -1,
    };
  },
  computed: {
    totalAllocated() {
      let addressAmounts = getAddressAmountMapping(this.creators);
      return _.sum(_.values(addressAmounts));
    },
    orderedUnattributedActivities() {
      return _.take(
        _.orderBy(this.unattributedActivities, 'duration', 'desc'),
        this.numUnorderedShow
      );
    },
    donationList() {
      return this.donationLog;
    }
  },
  methods: {
    donateAll() {
      const donations = this.creators.filter(c => c.allocatedFunds > 0)
      this.donate.donateAll(donations, this.refresh)
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
      });

      db.getActivities({ withCreators: false }).then(acts => {
        this.unattributedActivities = acts;
      });

      db.getDonations().then(ds => {
        this.donationLog = ds;
      }).catch(console.error);
    },
  },
  created() {
    this.refresh();
  },
};
</script>

<style>
body {
  background-color: #eee;
}
#header {
  padding-bottom: 9px;
  margin: 40px 0 20px;
  border-bottom: 1px solid #eee;
}
.card-body {
  transition-duration: 0.4s;
}
</style>
