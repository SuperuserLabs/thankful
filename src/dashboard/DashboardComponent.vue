<template lang="pug">
div.container
  div#header
    h1 Thankful Dashboard
  creator-card(v-for="c in creators", v-bind:name="getCreatorName(c)", v-bind:details="c.consumed_content")
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
      creatorData: new Map(),
    };
  },
  methods: {
    refresh() {
      browser.storage.local.get('timespent').then(result => {
        let timekv = result.timespent;
        this.creators = timekv.map(kv => ({
          id: kv[0],
          consumed_content: Object.entries(kv[1]),
        }));
      });
      browser.storage.local.get('creators').then(result => {
        this.creatorData = new Map(result.creators);
      });
    },
    getCreatorName(c) {
      console.log(this.creatorData.has(c.id));
      if (this.creatorData && this.creatorData.has(c.id)) {
        return this.creatorData.get(c.id).name;
      }
      return c.id;
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
