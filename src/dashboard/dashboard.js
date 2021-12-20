import { library } from '@fortawesome/fontawesome-svg-core';
import { faStar, faGlobe } from '@fortawesome/free-solid-svg-icons';
import {
  faYoutube,
  faGithub,
  faMedium,
  faFacebookF,
  faTwitter,
  faPatreon,
} from '@fortawesome/free-brands-svg-icons';
library.add(
  faStar,
  faGlobe,
  faYoutube,
  faGithub,
  faMedium,
  faFacebookF,
  faTwitter,
  faPatreon
);

import { formatSecs, formatSecsShort } from '../lib/time.js';
import 'typeface-roboto';
import '../stylus/main.styl';
import { messages } from '../resources';

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import 'material-design-icons-iconfont/dist/material-design-icons.css';

(async () => {
  const Vue = (await import(/* webpackPreload: true */ 'vue')).default;
  const Vuetify = (await import(/* webpackPreload: true */ 'vuetify')).default;
  const VueI18n = (await import(/* webpackPreload: true */ 'vue-i18n')).default;

  Vue.component('font-awesome-icon', FontAwesomeIcon);

  Vue.use(Vuetify, {
    theme: { primary: '#00695C' },
  });

  // Create VueI18n instance with options
  Vue.use(VueI18n);
  const i18n = new VueI18n({
    locale: 'en', // set locale
    messages, // set locale messages
  });

  const App = (await import('./App.vue')).default;
  const router = (await import('./route.js')).default;
  const store = (await import('./store')).default;

  Vue.filter('friendlyDuration', formatSecs);
  Vue.filter('friendlyShortDuration', formatSecsShort);
  Vue.filter('fixed', (v, precision) => parseFloat(v).toFixed(precision));
  Vue.filter('prepend', (v, text) => text + v);
  Vue.filter('append', (v, text) => v + text);
  Vue.filter('trim', (v, chars) => v.substr(0, chars || 5) + '...');

  Vue.prototype.$error = function (title) {
    return (message) => {
      console.error(`${title}: ${message}`);
      this.$store.commit('notifications/insert', {
        title,
        text: message,
        type: 'error',
      });
    };
  };

  new Vue({
    el: '#dashboard',
    store,
    router,
    i18n,
    render: (h) => h(App),
    created: function () {
      this.$store.dispatch('settings/loadSettings');
      this.$store.dispatch('metamask/initialize');
    },
  });
})();
