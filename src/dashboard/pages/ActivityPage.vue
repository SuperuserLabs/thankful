<template lang="pug">
v-container
    v-card.mb-4
      v-toolbar(flat, color='white')
        v-toolbar-title Activity
        v-spacer
        v-toolbar-items
          v-switch.my-3(label="Only show unattributed", v-model="unattributed")
      activity-component(:unattributed='unattributed', ref='activity')

    v-card
      v-card-text
        h2.heading-2 Want better time tracking?
        | Would you like to better understand how you spend your time? Try the open source time tracker #[a(href="https://activitywatch.net/" target="_blank") ActivityWatch]!
</template>
<script>
import ActivityComponent from '../components/ActivityComponent.vue';

export default {
  components: {
    'activity-component': ActivityComponent,
  },
  data: () => ({ unattributed: false }),
  watch: {},
};
</script>
