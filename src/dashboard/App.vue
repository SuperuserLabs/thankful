<template lang="pug">
v-app
  t-header

  v-content
    t-notifications
    v-container(fluid)
      router-view
</template>
<script>
import Header from './components/Header.vue';
import Notifications from './components/Notifications.vue';

export default {
  components: {
    't-header': Header,
    't-notifications': Notifications,
  },
};
</script>
