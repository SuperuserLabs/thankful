<template lang="pug">
v-chip(outlined, :color='netColor')
  div(v-if="netId === -1")
    b Not connected to Ethereum, please install #[a(href='#/onboarding/metamask') MetaMask]
  div(v-else-if="!address")
    b MetaMask is installed, #[a(href='#/onboarding/metamask') click here to set it up]
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
