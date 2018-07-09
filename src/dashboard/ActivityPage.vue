<template lang="pug">
div.container
  h3 Unattributed Activity
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
