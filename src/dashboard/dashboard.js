import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';

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

Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.use(BootstrapVue);

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import router from './route.js';

import App from './App.vue';

Vue.filter('friendlyDuration', formatSecs);

new Vue({
  el: '#dashboard',
  router: router,
  render: h => h(App),
});
