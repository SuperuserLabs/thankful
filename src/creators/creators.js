(async () => {
  const Vue = (await import('vue')).default;
  const Vuetify = (await import(/* webpackPreload: true */ 'vuetify')).default;
  const App = (await import('./creators.vue')).default;

  Vue.use(Vuetify, {
    theme: { primary: '#00695C' },
  });

  new Vue({
    el: '#creators',
    render: h => h(App),
    created: function() {},
  });
})();
