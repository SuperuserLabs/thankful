<template lang="pug">
div.container
  h3 Donation history
  b-card.p-2.bt-0(no-body)
    donation-history-component
</template>
<script>
import DonationHistoryComponent from './DonationHistoryComponent.vue';

export default {
  components: {
    'donation-history-component': DonationHistoryComponent,
  },
  data: () => ({}),
};
</script>
<style src="./dashboard.css">
</style>
