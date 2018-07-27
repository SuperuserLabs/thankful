import {
  Vuetify, // required
  VApp, // required
  VBtn,
  VIcon,
} from 'vuetify';

(async () => {
  const Vue = (await import('vue')).default;
  const App = (await import('./popup.vue')).default;

  Vue.use(Vuetify, {
    components: {
      VApp,
      VBtn,
      VIcon,
    },
  });

  new Vue({
    el: '#popup',
    render: h => h(App),
  });
})();
