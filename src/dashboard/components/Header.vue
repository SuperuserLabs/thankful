<template lang="pug">
div
  v-app-bar(app light :tabs="$vuetify.breakpoint.mdAndDown" color="white" extension-height="48px")
    v-app-bar-nav-icon(v-if="$vuetify.breakpoint.mdAndDown")
      v-btn(icon @click="drawer = !drawer")
        v-icon menu
    v-app-bar-title
      router-link(to="/" style="text-decoration: none; color: inherit")
          img.mr-3(src="/media/icon-256.png", style="width: 1.8em; display: inline-block; vertical-align: middle")
          h1(style="display: inline-block; vertical-align: middle")  Thankful
    v-toolbar-items
      div(style="display: flex; align-items: center;")
        div.pl-4
          h3 We're in beta!
          div
            | Send us #[a(href="https://forms.gle/rQvBgEWwL7T4SZ9b9") feedback] and report any #[a(href='https://github.com/SuperuserLabs/thankful/issues') issues].
    v-spacer
    v-toolbar-items
      div.pt-2
        net-info

    template(v-slot:extension v-if="$vuetify.breakpoint.lgAndUp")
      v-tabs(light flat color="white")
        v-tab(v-for="(msg, index) in menuItems" :key="msg.text", :to="msg.link")
          v-icon.mr-2(style="color: inherit") {{ msg.icon }}
          | {{ msg.text }}
        if mode === "development"
          v-tab(to="/dev", style="color: #AAA")
            v-icon.mr-2(style="color: inherit") settings
            | Dev

  v-navigation-drawer(app v-model="drawer" v-if="$vuetify.breakpoint.mdAndDown")
    v-list.pa-1
      v-list-tile(avatar tag="div" v-for="(msg, index) in menuItems" :key="msg.text" :to="msg.link")
        v-list-tile-avatar
          v-icon {{ msg.icon }}
        v-list-tile-content
          | {{ msg.text }}
</template>

<script>
import NetInfo from './NetInfo.vue';

export default {
  components: {
    'net-info': NetInfo,
  },
  data: function () {
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
        {
          text: 'Settings',
          icon: 'settings',
          link: '/settings',
        },
      ],
    };
  },
};
</script>
