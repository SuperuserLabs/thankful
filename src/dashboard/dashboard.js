import { library } from '@fortawesome/fontawesome-svg-core';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import {
  faYoutube,
  faGithub,
  faMedium,
} from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
library.add(faStar, faYoutube, faGithub, faMedium);

import { formatSecs, formatSecsShort } from '../lib/time.js';
import 'typeface-roboto';
import '../stylus/main.styl';
import { messages } from '../resources';

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

  const router = (await import('./route.js')).default;
  const App = (await import('./components/App.vue')).default;
  const store = (await import('./store')).default;

  Vue.filter('friendlyDuration', formatSecs);
  Vue.filter('friendlyShortDuration', formatSecsShort);
  Vue.filter('fixed', (v, precision) => parseFloat(v).toFixed(precision));
  Vue.filter('prepend', (v, text) => text + v);
  Vue.filter('append', (v, text) => v + text);
  Vue.filter('trim', (v, chars) => v.substr(0, chars || 5) + '...');

  new Vue({
    el: '#dashboard',
    store,
    router,
    i18n,
    render: h => h(App),
    created: function() {
      this.$store.dispatch('settings/loadSettings');
      this.$store.dispatch('metamask/initialize');
    },
    mounted: function() {
      console.log(this.$store.state.settings.onboarding_done);
      if (this.$store.state.settings.onboarding_done) {
        console.log('mounted');
        let routeData = this.$router.resolve({
          name: '/onboarding/welcome',
          query: {},
        });
        window.open(routeData.href, '_blank');
      }
    },
  });
})();
