<template lang="pug">
v-chip(color='green', text-color='white')
  div(v-if='netId === -1')
    | You are not connected to an Ethereum Network. Please install this extension: #[a(href='https://metamask.io/') https://metamask.io/].
  div(v-else)
    | You are connected to the {{ netName }}
</template>
<script>
export default {
  data: () => ({ netId: -1 }),
  computed: {
    netName() {
      let names = {
        1: 'Main Ethereum Network',
        3: 'Ropsten Test Network',
        4: 'Rinkeby Test Network',
        42: 'Kovan Test Network',
      };
      return names[this.netId];
    },
  },
  created() {
    setInterval(
      () =>
        this.$donate.getId().then(id => {
          this.netId = id;
        }),
      5000
    );
  },
};
</script>
