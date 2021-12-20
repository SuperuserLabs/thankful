import {
  Vuetify, // required
} from 'vuetify/lib';

import {
  VApp, // required
  VBtn,
  VIcon,
} from 'vuetify';

(async () => {
  const Vue = (await import('vue')).default;
  const App = (await import('./popup.vue')).default;
  const store = (await import('../dashboard/store')).default;

  Vue.use(Vuetify, {
    components: {
      VApp,
      VBtn,
      VIcon,
    },
  });

  new Vue({
    el: '#popup',
    store,
    render: (h) => h(App),
    created: function () {
      this.$store.dispatch('settings/loadSettings');
    },
  });
})();
