<template lang="pug">
div.container
  div#header
    h1 Thankful Dashboard
  creator-card(v-for="c in creators", v-bind:name="c.name", v-bind:details="c.consumed_content")
</template>

<script>
import browser from 'webextension-polyfill';
import CreatorCard from './CreatorCard.vue';

export default {
  components: {
    'creator-card': CreatorCard,
  },
  data: function() {
    return {
      creators: [],
    };
  },
  methods: {
    refresh() {
      browser.storage.local.get(['timespent']).then(result => {
        let timedict = result.timespent;
        console.log(timedict);
        this.creators = Object.keys(timedict).map(key => ({
          name: key,
          consumed_content: [[key, timedict[key]]],
        }));
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
