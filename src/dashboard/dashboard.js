import Vue from 'vue';
import Vuetify from 'vuetify';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faUserPlus,
  faSave,
  faBan,
  faInfoCircle,
  faEdit,
  faPen,
  faTrash,
  faEyeSlash,
  faExclamationTriangle,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube, faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { formatSecs } from '../lib/time.js';
import colors from 'vuetify/es5/util/colors';

library.add(
  faUserPlus,
  faSave,
  faBan,
  faEdit,
  faInfoCircle,
  faPen,
  faTrash,
  faEyeSlash,
  faYoutube,
  faGithub,
  faExclamationTriangle,
  faExternalLinkAlt
);

import Donate from '../lib/donate.js';
import { Database } from '../lib/db.js';

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
