<template lang="pug">
div
  p {{ greeting }} World!

  ul
    li(v-for="site in sites")
      | {{ site.url }} ({{ site.duration }} seconds)
</template>

<script>
import browser from 'webextension-polyfill'

module.exports = {
  data: function () {
    return {
      greeting: "Hello",
      sites: [
          {url: "youtube.com", duration: 100},
          {url: "github.com", duration: 100},
      ]
    }
  }
}
</script>

<style>
</style>
