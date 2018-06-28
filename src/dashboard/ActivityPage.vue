<template lang="pug">
div.container
  h3 Unattributed Activity
  b-card.p-2.bt-0(no-body)
    activity-component
</template>
<script>
import ActivityComponent from './ActivityComponent.vue';

export default {
  components: {
    'activity-component': ActivityComponent,
  },
  data: () => {},
};
</script>
<style>
body {
  background-color: #eee;
}
#header {
  padding-bottom: 9px;
  margin: 40px 0 20px;
  border-bottom: 1px solid #eee;
}
.card-body {
  transition-duration: 0.4s;
}
</style>
