<template lang="pug">
v-app
  v-toolbar(app light :tabs="$vuetify.breakpoint.mdAndDown" color="white" extension-height="48px")
    v-toolbar-side-icon(v-if="$vuetify.breakpoint.mdAndDown")
      v-btn(icon @click="drawer = !drawer")
        v-icon menu
    v-toolbar-title
      h1 #[router-link(to="/" style="text-decoration: none; color: inherit") Thankful]
    v-toolbar-items
      div(style="display: flex; align-items: center;")
        div.pl-4
          h3 We're in alpha
          div
            | We're still figuring things out.
            | Please report any issues #[a(href='https://github.com/SuperuserLabs/thankful/issues' style="color: #fff; text-decoration: underline") here].
    v-spacer
    v-toolbar-items
      div.pt-2
        net-info

    template(v-slot:extension v-if="$vuetify.breakpoint.lgAndUp")
      v-tabs(centered light flat color="white")
        v-tab(v-for="(msg, index) in menuItems" :key="msg.text", :to="msg.link")
          v-icon.mr-2(style="color: inherit") {{ msg.icon }}
          | {{ msg.text }}

  v-navigation-drawer(app v-model="drawer" v-if="$vuetify.breakpoint.mdAndDown")
    v-list.pa-1
      v-list-tile(avatar tag="div" v-for="(msg, index) in menuItems" :key="msg.text" :to="msg.link")
        v-list-tile-avatar
          v-icon {{ msg.icon }}
        v-list-tile-content
          | {{ msg.text }}

  v-content
    t-notifications
    v-container(fluid)
      router-view
</template>
<script>
import NetInfo from './components/NetInfo.vue';
import Notifications from './components/Notifications.vue';

export default {
  components: {
    'net-info': NetInfo,
    't-notifications': Notifications,
  },
  data: function() {
    return {
      drawer: false,
      menuItems: [
        {
          text: 'Dashboard',
          icon: 'home',
          link: '/',
        },
        {
          text: 'Creators',
          icon: 'person',
          link: '/creators',
        },
        {
          text: 'Activity',
          icon: 'history',
          link: '/activity',
        },
        {
          text: 'Donations',
          icon: 'favorite',
          link: '/donations',
        },
      ],
    };
  },
};
</script>
