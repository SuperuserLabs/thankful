import Vue from 'vue';
import Vuex from 'vuex';

import db from './modules/db';
import settings from './modules/settings';
import notifications from './modules/notifications';
import metamask from './modules/metamask';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    db,
    settings,
    notifications,
    metamask,
  },
  state: {},
  mutations: {},
  actions: {},
});
