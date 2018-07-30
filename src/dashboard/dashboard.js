import { library } from '@fortawesome/fontawesome-svg-core';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faYoutube, faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
library.add(faStar, faYoutube, faGithub);

import { formatSecs, formatSecsShort } from '../lib/time.js';
import 'typeface-roboto';
import '../stylus/main.styl';

import 'material-design-icons-iconfont/dist/material-design-icons.css';

import _ from 'lodash';

(async () => {
  const Vue = (await import(/* webpackPreload: true */ 'vue')).default;
  const Vuetify = (await import(/* webpackPreload: true */ 'vuetify')).default;

  Vue.component('font-awesome-icon', FontAwesomeIcon);

  Vue.use(Vuetify, {
    theme: { primary: '#00695C' },
  });

  const router = (await import('./route.js')).default;
  const App = (await import('./components/App.vue')).default;
  const store = (await import('./store')).default;

  Vue.filter('friendlyDuration', formatSecs);
  Vue.filter('friendlyShortDuration', formatSecsShort);
  Vue.filter('fixed', (v, precision) => parseFloat(v).toFixed(precision));

  const messages = {
    tip: {
      ignore:
        "This creator won't receive donations and won't show up among your favorite creators",
    },
  };
  Vue.prototype.$t = path => _.get(messages, path);

  new Vue({
    el: '#dashboard',
    store,
    router,
    render: h => h(App),
    created() {
      this.$store.dispatch('settings/loadSettings');
      this.$store.dispatch('metamask/initialize');
    },
  });
})();
