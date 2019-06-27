<template lang="pug">
div
  h1 One last thing
  p In order to be able to send your support through cryptocurrency, you need to have a MetaMask wallet and the MetaMask browser extension installed.
  div(v-if="netId === -1")
    b #[a(href='https://metamask.io/') Click here to install MetaMask]
  div(v-else-if="!address")
    //| You are connected to the {{ netName }} but not logged in.
    p Looks like you already have the extension. Open the MetaMask extension to login to your account and you're all set!
  div(v-else)
    p Looks like you're all set! Keep doing what you were doing and we'll remind you to donate at the end of the month.
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
  mounted: function() {
    this.$store.commit('settings/updateSettings', { onboarding_done: true });
  },
};
</script>
