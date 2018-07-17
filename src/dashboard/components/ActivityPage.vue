<template lang="pug">
v-container
    v-card
      v-toolbar(flat, color='white')
        v-toolbar-title.display-1 Logged activity
        v-spacer
        v-toolbar-items
          v-switch(label="Only show unattributed", v-model="unattributed")
      activity-component(:unattributed='unattributed', ref='activity')
</template>
<script>
import ActivityComponent from './ActivityComponent.vue';

export default {
  components: {
    'activity-component': ActivityComponent,
  },
  data: () => ({ unattributed: true }),
  watch: {},
};
</script>
