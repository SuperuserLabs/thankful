import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';

Vue.use(BootstrapVue);

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import router from './route.js';

import App from './App.vue';
new Vue({
  el: '#dashboard',
  router: router,
  render: h => h(App),
});
