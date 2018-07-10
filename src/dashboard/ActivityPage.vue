<template lang="pug">
div.container
  v-toolbar(flat, color='white')
    v-toolbar-title Unattributed activity
  v-card
    activity-component(:unattributed="true")
</template>
<script>
import ActivityComponent from './ActivityComponent.vue';

export default {
  components: {
    'activity-component': ActivityComponent,
  },
  data: () => ({}),
};
</script>
<style src="./dashboard.css">
</style>
