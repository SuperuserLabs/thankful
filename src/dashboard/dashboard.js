import Vue from 'vue';
import Vuetify from 'vuetify';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faYoutube, faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
library.add(faStar, faYoutube, faGithub);

import { formatSecs } from '../lib/time.js';
import Donate from '../lib/donate.js';
import { Database } from '../lib/db.js';
import 'typeface-roboto';
import '../stylus/main.styl';

import 'material-design-icons-iconfont/dist/material-design-icons.css';

Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.use(Vuetify, {
  theme: { primary: '#00695C' },
});

import router from './route.js';

import App from './App.vue';

Vue.prototype.$donate = new Donate();
Vue.prototype.$db = new Database();
Vue.filter('friendlyDuration', formatSecs);
Vue.filter('fixed', (v, precision) => parseFloat(v).toFixed(precision));

new Vue({
  el: '#dashboard',
  router: router,
  render: h => h(App),
});
