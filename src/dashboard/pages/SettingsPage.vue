<template lang="pug">
v-container
  t-budget-card

  t-database-cleaning
</template>

<script>
import BudgetCard from '../components/BudgetCard.vue';
import DatabaseCleaning from '../components/DatabaseCleaning.vue';

export default {
  components: {
    't-budget-card': BudgetCard,
    't-database-cleaning': DatabaseCleaning,
  },
  data: function() {
    return {};
  },
};
</script>
