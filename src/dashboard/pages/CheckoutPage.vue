<template lang="pug">
v-container
  donation-summary(ref='donationSummary', @error="errfun('Donating failed')($event)" checkout="true")
</template>

<script>
import DonationSummary from '../components/DonationSummary.vue';

export default {
  components: {
    'donation-summary': DonationSummary,
  },
  data: () => ({}),
  computed: {},
  methods: {
    errfun(title) {
      return message => {
        console.error(`${title}: ${message}`);
        this.$store.commit('notifications/insert', {
          title,
          text: message,
          type: 'error',
        });
      };
    },
  },
};
</script>