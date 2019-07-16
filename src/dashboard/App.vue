<template lang="pug">
v-app
  t-header

  v-content
    t-notifications
    v-container(fluid)
      router-view

  t-footer
</template>
<script>
import Header from './components/Header.vue';
import Notifications from './components/Notifications.vue';
import Footer from './components/Footer.vue';

export default {
  components: {
    't-header': Header,
    't-notifications': Notifications,
    't-footer': Footer,
  },
};
</script>
