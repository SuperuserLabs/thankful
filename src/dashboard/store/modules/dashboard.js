import _ from 'lodash';
import { Database } from '../../../lib/db.js';

let db = new Database();

export default {
  namespaced: true,

  state: {
    creators: [],
  },

  getters: {
    creatorsNotIgnored(state) {
      let creators = _.filter(state.creators, c => c.ignore !== true);
      creators = _.orderBy(creators, ['priority', 'duration'], ['asc', 'desc']);
      return creators;
    },
  },

  actions: {
    async loadCreators({ commit }) {
      let creators = await db.getCreators({ withDurations: true });
      commit('setCreators', creators);
    },
  },

  mutations: {
    setCreators(state, creators) {
      state.creators = creators;
    },
  },
};
