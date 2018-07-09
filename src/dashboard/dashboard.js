import Vue from 'vue';
import Vuetify from 'vuetify';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faYoutube, faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
library.add(faYoutube, faGithub);

import { formatSecs } from '../lib/time.js';
import Donate from '../lib/donate.js';
import { Database } from '../lib/db.js';

import 'material-design-icons-iconfont/dist/material-design-icons.css';

Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.use(Vuetify, {
  theme: {},
});

import 'vuetify/dist/vuetify.min.css';

import router from './route.js';

import App from './App.vue';

Vue.prototype.$donate = new Donate();
Vue.prototype.$db = new Database();
Vue.filter('friendlyDuration', formatSecs);

new Vue({
  el: '#dashboard',
  router: router,
  render: h => h(App),
});
