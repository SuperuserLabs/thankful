import Vue from 'vue';
import Vuex from 'vuex';

import dashboard from './modules/dashboard';
import settings from './modules/settings';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    dashboard,
    settings,
  },
  state: {},
  mutations: {},
  actions: {},
});
