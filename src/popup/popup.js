import Vuetify, { VApp, VBtn, VIcon } from 'vuetify/lib';

(async () => {
  const Vue = (await import('vue')).default;
  const App = (await import('./popup.vue')).default;
  const store = (await import('../dashboard/store')).default;

  const vuetifyOptions = {};
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
    vuetify: new Vuetify(vuetifyOptions),
    render: (h) => h(App),
    created: function () {
      this.$store.dispatch('settings/loadSettings');
    },
  });
})();
