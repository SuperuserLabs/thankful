import Vue from 'vue';
import {
  Vuetify, // required
  VApp, // required
  VBtn,
} from 'vuetify';

import 'material-design-icons-iconfont/dist/material-design-icons.css';

Vue.use(Vuetify, {
  components: {
    VApp,
    VBtn,
  },
});

import App from './popup.vue';

import 'vuetify/dist/vuetify.min.css';

new Vue({
  el: '#popup',
  render: h => h(App),
});
