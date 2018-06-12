<template lang="pug">
div.card
  div.card-body
    h5.card-title(v-on:click="name = 'lol'") {{ name }}
    b-button(v-on:click="showDetails = !showDetails") Details
    div(v-if="showDetails")
      p(v-for="d in details") {{ d.name }}

</template>

<script>
module.exports = {
  data: function () {
    return {
      showDetails: false
    }
  },
  props: {
    name: String,
    details: Array
  }
}
</script>

<style>
</style>
