<template lang="pug">
v-app
  v-navigation-drawer(app v-model="drawer" :mini-variant="mini")
    v-list.pa-1
      // TODO: Fill this list with reasonable stuff
      v-list-tile(v-if="mini" @click.stop="mini = !mini")
        v-list-tile-action
          v-icon chevron_right

      v-list-tile(avatar tag="div" v-for="i in [1,2,3,4,5,6,7,8,9,10]")
        v-list-tile-avatar
          img(:src="'https://randomuser.me/api/portraits/women/' + Math.round(Math.random() * 100) + '.jpg'")

        v-list-tile-content
          v-list-tile-title John Leider

        v-list-tile-action
          v-btn(icon @click.stop="mini = !mini")
            v-icon chevron_left

  v-toolbar(app dark color="primary")
    v-btn(icon @click="drawer = !drawer")
      v-icon menu
    v-toolbar-title
      h1 #[router-link(to="/" style="color: #FFF; text-decoration: none") Thankful dashboard]
    v-toolbar-items
      div.pl-3.pt-3
        h3 We're in alpha
        div
          | We're still figuring things out.
          | Please report any issues #[a(href='https://github.com/SuperuserLabs/thankful/issues' style="color: #fff") here].
    v-spacer
    v-toolbar-items

      div.pt-2
        net-info
  v-content
    v-container(fluid)
      router-view
</template>
<script>
import NetInfo from './NetInfo.vue';

export default {
  components: {
    'net-info': NetInfo,
  },
  data: function() {
    return {
      drawer: false,
      mini: false,
    };
  },
};
</script>
