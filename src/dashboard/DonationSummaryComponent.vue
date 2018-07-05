<template lang="pug">
div
  h3 Donation Summary
  table.table.table-sm(style="overflow: hidden; table-layout: fixed")
    tr
      th Creator
      th Adress
      th.text-right(style="width: 20%") Amount $
    tr(v-for="d in donations")
      td 
        a(target="_blank", :href="d.url") {{ d.name }}&nbsp
          sup.text-secondary
            font-awesome-icon(icon="external-link-alt", size="xs")
      td(v-if="d.address") {{ d.address }}
      td(v-else)
        input(type="text", style="width: 100%")
      td.text-right {{ parseFloat(d.allocatedFunds).toFixed(1) }}
</template>

<script>
export default {
  data: function() {
    return {};
  },
  props: {
    donations: Array,
  },
  computed: {},
  methods: {},
  created() {},
};
</script>

<style>
</style>
