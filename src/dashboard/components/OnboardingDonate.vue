<template lang="pug">
div
  p At the end of each month, the amount you set below will be distributed to creators you love.

  v-layout(row)
    v-flex(shrink)
      span Select one of the following:

    v-flex.px-3(shrink, v-for="(amount, index) in [10, 20, 50]", :key="index")
      v-btn-toggle(v-model="budget", style="width: 4em")
        v-btn(:value="amount", block, large, color="primary") ${{amount}}
  span Or enter a custom amount:
  v-text-field(v-model="budget", type=number, color=primary, style="width: 8em", prepend-icon="attach_money")

</template>

<script>
export default {
  computed: {
    budget: {
      get() {
        return this.$store.state.settings.budget_per_month;
      },
      set(value) {
        this.$store.commit('settings/updateSettings', {
          budget_per_month: value,
        });
      },
    },
  },
};
</script>
