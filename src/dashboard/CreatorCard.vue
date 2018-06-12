<template lang="pug">
div.card
  b-button.card-body.text-left(v-on:click="showDetails = !showDetails")
    div(v-if="showDetails")
      h5.card-title.text-monospace [-] {{ name }}
      div.row(v-for="d in details")
        div.col-sm-10 {{ d[0] }}
        div.col-sm-2 {{ d[1].toFixed(2) }} s
    div(v-else)
      h5.card-title.text-monospace [+] {{ name }}

</template>

<script>
export default {
  data() {
    return {
      showDetails: false,
    };
  },
  props: {
    name: String,
    details: Array,
  },
};
</script>

<style>
</style>
