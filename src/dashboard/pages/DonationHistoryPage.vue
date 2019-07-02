<template lang="pug">
div.container
  v-card
    v-toolbar(flat, color='white')
      v-toolbar-title Donation history
    donation-history
</template>
<script>
import DonationHistory from '../components/DonationHistory.vue';

export default {
  components: {
    'donation-history': DonationHistory,
  },
  data: () => ({}),
};
</script>
