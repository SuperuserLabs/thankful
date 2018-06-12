<template lang="pug">
div
  h1 Thankful Dashboard

  b-alert(show) Default alert
  ul
    li(v-for="site in sites")
      | {{ site.url }} ({{ site.duration }} seconds)
</template>

<script>
module.exports = {
  data: function () {
    return {
      greeting: "Hello",
      sites: [
          {url: "yutube.com", duration: 100},
          {url: "github.com", duration: 100},
      ]
    }
  }
}
</script>

<style>
</style>
