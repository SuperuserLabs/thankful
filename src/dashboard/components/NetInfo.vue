<template lang="pug">
v-chip(outline, :color='netColor')
  div(v-if="netId === -1")
    b Not connected to Ethereum, please install #[a(href='https://metamask.io/') MetaMask]
  div(v-else-if="!address")
    //| You are connected to the {{ netName }} but not logged in.
    b Please login to MetaMask
  div(v-else)
    b Connected to: {{ netName }}
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
