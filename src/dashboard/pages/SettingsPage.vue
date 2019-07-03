<template lang="pug">
v-container
  h1.display-0 Settings
  t-budget-card
</template>

<script>
import BudgetCard from '../components/BudgetCard.vue';

export default {
  components: {
    't-budget-card': BudgetCard,
  },
  data: function() {
    return {};
  },
};
</script>
