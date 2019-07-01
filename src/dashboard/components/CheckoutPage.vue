<template lang="pug">
  div
    donation-summary(ref='donationSummary', @error="errfun('Donating failed')($event)")
</template>

<script>
import DonationSummary from './DonationSummary.vue';

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
