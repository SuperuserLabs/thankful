<template lang="pug">
v-stepper(v-model="step", vertical)
  div.pa-3
    h1.pb-2 One last thing: Set up MetaMask
    div In order to be able to send your support through cryptocurrency, you need to have a MetaMask wallet and the MetaMask browser extension installed.

  v-stepper-step(step=1, :complete="completed_step > 1")
    | Install MetaMask
  v-stepper-content(step=1)
    b Get MetaMask for your browser at #[a(href='https://metamask.io/' target="_blank") metamask.io]

  v-stepper-step(step=2, :complete="completed_step > 2")
    | Log in to MetaMask
  v-stepper-content(step=2)
    b Now open MetaMask to log in to your account.
    v-alert.my-3.mx-4(:value="true" type="info" outline) Unfortunately, due to (temporary) #[a(href='https://github.com/MetaMask/metamask-extension/issues/5950') technical reasons], you also need to #[b turn off privacy mode] in MetaMask (#[a(href='https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8') details on privacy mode]). You can do this by:
      ol
        li Opening MetaMask
        li Clicking on your user icon in the top right
        li Clicking Settings
        li Clicking Security & Privacy
        li Toggling Privacy Mode


  v-stepper-step(step=3)
    | You're done!
  v-stepper-content(step=3)
    p Keep browsing the web like usual and we'll remind you to donate at the end of the month.
    v-btn(to="/", color="primary")
      | Go to dashboard
</template>

<style scoped>
/*
.step-done {
  opacity: 0.5;
  text-decoration: line-through;
}

.step-ahead {
  opacity: 0.3;
}
*/
</style>

<script>
import { mapGetters, mapState } from 'vuex';
export default {
  data: () => ({ manual_step: null }),
  methods: {},
  computed: {
    ...mapGetters('metamask', ['netColor', 'netName']),
    ...mapState('metamask', ['netId', 'address']),
    completed_step: function () {
      console.log(this.address);
      if (this.netId === -1) {
        return 1;
      } else if (this.address === null) {
        return 2;
      }
      return 3;
    },
    step: {
      get: function () {
        return this.manual_step | this.completed_step;
      },
      set: function (to) {
        console.log('Step:', to);
        console.log('Step:', this.completed_step);
        //this.manual_step = to;
      },
    },
  },
  watch: {
    address: function (to) {
      if (to !== null) {
        this.$store.commit('settings/updateSettings', {
          onboarding_done: true,
        });
      }
    },
  },
};
</script>
