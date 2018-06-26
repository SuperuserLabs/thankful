<template lang="pug">
div.container
  div.row
    div.col-md-6
      div.row
        h3.col-md-9 Creators
        div.col-md-3
          b-button(v-if="editing < 0",variant="outline-secondary", size="sm", v-on:click="addCreator()")
            | Add creator 
            font-awesome-icon(icon="user-plus")
      div(v-if="creators.length === 0")
        | No creators to show
      creator-card(v-for="(creator, index) in creators.slice().reverse()",
                   v-bind:creator="creator",
                   v-bind:key="creator.url",
                   v-bind:editing="index === editing",
                   @allocatedFunds="creator.allocatedFunds = $event; creator.save();",
                   @address="creator.address = $event; creator.save();",
                   @save="Object.assign(creator, $event); creator.save(); editing = -1;"
                   )

      b-button(variant="success", size="lg", v-on:click="donateAll()")
        | Donate {{ totalAllocated }}$

      hr

      h3 Unattributed Activity
      b-card.p-2.bt-0(no-body)
        table.table.table-sm(style="overflow: hidden; table-layout: fixed")
          tr
            th(style="border-top: 0") Page
            th.text-right(style="width: 20%; border-top: 0") Duration
          tr(v-for="activity in orderedUnattributedActivities")
            td(style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;")
              a(:href="activity.url")
                | {{ activity.title || activity.url }}
            td.text-right
              | {{ Math.round(activity.duration) }}s
        b-button(variant="outline-secondary", size="sm", to="/activity")
          | Show all

    div.col-md-6
      h3 Empty section
      p How much to donate each month:
        // TODO: Form group
        b-input-group(append="$")
          b-form-input(v-model="monthlyDonation")

      p Nothing here, yet.
</template>

<script>
import browser from 'webextension-polyfill';
import CreatorCard from './CreatorCard.vue';
import Donate from '../lib/donate.js';
import { Database, Activity, Creator } from '../lib/db.js';
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
  },
  data: function() {
    return {
      creators: [],
      unattributedActivities: [],
      donate: new Donate(),
      monthlyDonation: 10,
      numUnorderedShow: 10,
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
  },
  methods: {
    donateAll() {
      let addressAmounts = getAddressAmountMapping(this.creators);
      console.log(addressAmounts);
      this.donate.donateAll(addressAmounts);
    },
    addCreator() {
      if (this.editing < 0) {
        this.creators.push(new Creator('', ''));
        this.editing = 0;
      }
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
        thankful_team_creator.paymentAddress =
          '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
        thankful_team_creator.info = 'Optionally donate to the Thankful team';
        creators.push(thankful_team_creator);

        this.creators = creators;
      });

      db.getActivities({ withCreators: false }).then(acts => {
        this.unattributedActivities = acts;
      });
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
