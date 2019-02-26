<template lang="pug">
div.container
  v-toolbar(flat, color='white')
    v-toolbar-title Donation history
  v-card.p-2.bt-0(no-body)
    donation-history
</template>
<script>
import DonationHistory from './DonationHistory.vue';

export default {
  components: {
    'donation-history': DonationHistory,
  },
  data: () => ({}),
};
</script>
