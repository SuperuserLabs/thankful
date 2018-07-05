<template lang="pug">
div.row
  div.col
    h3 Donation Summary
  div.col(style="text-align: right")
    b-button(v-if="editMode", v-on:click='editMode = false', variant='outline-secondary', size='sm').mr-1
      | #[font-awesome-icon(icon="save")] Save
    b-button(v-else, v-on:click='editMode = true', variant='outline-secondary', size='sm').mr-1
      | #[font-awesome-icon(icon="edit")] Edit
  table.table.table-sm(style="overflow: hidden; table-layout: fixed")
    tr
      th Creator
      th Adress
      th.text-right(style="width: 20%") Amount $
    tr(v-for="d in donations", style="height: 40px")
      td 
        a(target="_blank", :href="d.url") {{ d.name }}&nbsp
          sup.text-secondary
            font-awesome-icon(icon="external-link-alt", size="xs")
      td(v-if="editMode")
        input(type="text", style="width: 100%", :value="d.address")
      td(v-else)
        input(disabled, type="text", style="width: 100%; ", :value="d.address")

      td(v-if="editMode")
        input(type="number", :value="parseFloat(d.allocatedFunds).toFixed(1)", style="text-align: right; width: 100%")
      td(v-else).text-right
        input(disabled, type="text", style="text-align: right; width: 100%", :value="parseFloat(d.allocatedFunds).toFixed(1)")
</template>

<script>
export default {
  data: function() {
    return {
      editMode: false,
    };
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
