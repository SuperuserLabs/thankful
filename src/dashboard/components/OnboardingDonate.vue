<template lang="pug">
div
  span At the end of each month, the amount you set below will be distributed to creators you love.

  input(type="radio", id="one", value="One", v-model="picked")
  label(for="one") One
  input(type="radio", id="two", value="Two", v-model="picked")
  label(for="two") Two
  p Picked:
  | {{ picked }}

  v-layout(row)
    v-flex.px-4
      v-btn-toggle(v-model="donation_amount", style="width: 100%")
        v-btn(value="10", block) 10
    v-flex.px-4
      v-btn-toggle(v-model="donation_amount", style="width: 100%")
        v-btn(value="20", block) 20
    v-flex.px-4
      v-btn-toggle(v-model="donation_amount", style="width: 100%")
        v-btn(value="50", block) 50
</template>

<script>
export default {
  data: () => ({
    picked: 'One',
    donation_amount: 1,
  }),
};
</script>
