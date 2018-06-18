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
                   v-bind:key="creator.url")
    div.col-md-6
      h3 Empty section
      p Nothing here, yet.
</template>

<script>
import browser from 'webextension-polyfill';
import CreatorCard from './CreatorCard.vue';
import { Database, Activity, Creator } from '../lib/db.js';

// TODO: Move to appropriate location
const db = new Database();

export default {
  components: {
    'creator-card': CreatorCard,
  },
  data: function() {
    return {
      creators: []
    };
  },
  methods: {
    refresh() {
      db.getCreators().then((creators) => {
        console.log(creators);

        // Testing
        if(creators.length === 0) {
          creators = [
            {
              "url": "https://youtube.com/channel/lol",
              "name": "sadmemeboi",
            },
            {
              "url": "https://youtube.com/channel/pewdiepie",
              "name": "pewdiepie",
            },
          ];
        }
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
