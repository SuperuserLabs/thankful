<template lang="pug">
v-chip(:color='netColor', text-color='white')
  div(v-if="netId === -1")
    | You are not connected to an Ethereum Network. Please install this extension: #[a(href='https://metamask.io/') https://metamask.io/].
  div(v-else-if="!address")
    | You are connected to the {{ netName }} but not logged in. Please open
    | MetaMask and log in.
  div(v-else)
    | You are connected to the {{ netName }}
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
