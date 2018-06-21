<template lang="pug">
div.container
  div.row
    div.col.mt-4
      h1 Thankful
      hr

  div.row
    div(v-if="creators.length === 0")
      | No creators to show
    div.col-md-6
      h3 Creators
      creator-card(v-for="creator in creators",
                   v-bind:creator="creator",
                   v-bind:key="creator.url",
                   @allocatedFunds="creator.allocatedFunds = $event"
                   @address="creator.address = $event"
                   )

      b-button(variant="success", size="lg", v-on:click="donateAll()")
        | Donate {{ totalAllocated }}$

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
      donate: new Donate(),
      monthlyDonation: 10,
      totalAllocated: 0,
    };
  },
  methods: {
    donateAll() {
      let addressAmounts = getAddressAmountMapping(this.creators);
      this.totalAllocated = _.sum(_.values(addressAmounts));
      this.donate.donateAll(addressAmounts);
    },
    refresh() {
      db.getCreators().then(creators => {
        console.log(creators);

        // Testing
        if (creators.length === 0) {
          creators = [
            {
              url: 'https://youtube.com/channel/lol',
              name: 'sadmemeboi',
            },
            {
              url: 'https://youtube.com/channel/pewdiepie',
              name: 'pewdiepie',
            },
          ];
        }

        const thankful_team_creator = new Creator("https://getthankful.io", "Thankful Team")
        // Eriks address
        thankful_team_creator.paymentAddress = '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
        thankful_team_creator.info = "Optionally donate to the Thankful team";
        creators.push(thankful_team_creator);

        this.creators = creators;
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
