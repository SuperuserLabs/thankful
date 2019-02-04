<template lang="pug">
v-chip(outline, :color='netColor')
  div(v-if="netId === -1")
    b You are not connected to the Ethereum Network. Please install #[a(href='https://metamask.io/') MetaMask] to donate.
  div(v-else-if="!address")
    //| You are connected to the {{ netName }} but not logged in.
    b Please login to MetaMask
  div(v-else)
    b You are connected to the {{ netName }}
</template>
<script>
import { mapGetters, mapState } from 'vuex';
export default {
  data: () => ({}),
  methods: {},
  computed: {
    ...mapGetters('metamask', ['netColor', 'netName']),
    ...mapState('metamask', ['netId', 'address']),
  },
};
</script>
