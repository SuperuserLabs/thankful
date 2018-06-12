<template lang="pug">
div.container
  div#header
    h1 Thankful Dashboard
  b-card-group.mb-3(deck)
    creator-card(v-for="c in creators", v-bind:name="c.name", v-bind:details="c.consumed_content")
</template>

<script>
import CreatorCard from './CreatorCard.vue'

module.exports = {
  components: {
    'creator-card': CreatorCard
  },
  data: function () {
    return {
      sites: [
          {url: "youtube.com", duration: 100, include: true},
          {url: "github.com", duration: 100, include: true},
      ],
      creators: [
        {
          name: "Kalle",
          consumed_content: [
            {name: "Blog", duration: 10},
            {name: "Video", duration: 27}
          ]
        },
        {
          name: "Pelle",
          consumed_content: [
            {name: "Music", duration: 27}
          ]
        },
        {
          name: "Olle",
          consumed_content: [
            {name: "Spotify", duration: 17}
          ]
        }
      ]
    }
  }
}
</script>

<style>
body {
  background-color: #eee
}
#header {
  padding-bottom: 9px;
  margin: 40px 0 20px;
  border-bottom: 1px solid #eee;
}
</style>
