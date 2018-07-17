<template lang="pug">
div.container
  v-toolbar(flat, color='white')
    v-toolbar-title Donation history
  v-card.p-2.bt-0(no-body)
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
