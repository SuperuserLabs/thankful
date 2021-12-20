<template lang="pug">
div
  // For testing notifications:
  //v-btn(@click="errfun('Name')('Some message...')")

  a(v-on:click='toTop()', v-if='notifications.length > 0', style='position:fixed;bottom:20px;right:100px;z-index:100')
    v-icon(color='warning', x-large) warning

  v-container.mb-0(v-show="notifications.length > 0")
    v-alert(v-for="(msg, index) in notifications", :key='msg.id', :type='msg.type', value="msg.active", dismissible, @input='hideNotification(msg.id)')
      b(v-if="msg.title")
        | {{ msg.title }}:&nbsp;
      | {{ msg.text }}
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters({
      notifications: 'notifications/active',
    }),
  },
  methods: {
    toTop() {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    },
    hideNotification(index) {
      this.$store.commit('notifications/hide', index);
    },
    errfun(title) {
      return (message) => {
        console.error(`${title}: ${message}`);
        this.$store.commit('notifications/insert', {
          title,
          text: message,
          type: 'error',
        });
      };
    },
  },
};
</script>
