<template lang="pug">
div
  p At the end of each month, the amount you set below will be distributed to creators you love.

  v-layout(row)
    v-flex(shrink)
      span Select one of the following:
    v-flex.px-3(shrink)
      v-btn-toggle(v-model="budget", style="width: 4em")
        v-btn(value="10", block, large, color="primary") $10
    v-flex.px-3(shrink)
      v-btn-toggle(v-model="budget", style="width: 4em")
        v-btn(value="20", block, large, color="primary") $20
    v-flex.px-3(shrink)
      v-btn-toggle(v-model="budget", style="width: 4em")
        v-btn(value="50", block, large, color="primary") $50
  span Or enter a custom amount:
  v-text-field(v-model="budget", type=number, color=primary, style="width: 8em", prepend-icon="attach_money")

</template>

<script>
export default {
  computed: {
    budget: {
      get() {
        console.log(this.$store.state.settings.totalAmount);
        return this.$store.state.settings.totalAmount;
      },
      set(value) {
        this.$store.commit('settings/updateSettings', { totalAmount: value });
      },
    },
  },
};
</script>
