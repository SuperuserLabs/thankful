import _ from 'lodash';
import { Database } from '../../../lib/db.js';

let db = new Database();

export default {
  namespaced: true,

  state: {
    creators: [],
    lastEdit: {},
    metamaskStatusError: 'Please install MetaMask to be able to donate',
  },

  getters: {
    creatorsNotIgnored(state, getters) {
      let creators = _.filter(getters.creators, c => c.ignore !== true);
      creators = _.orderBy(creators, ['priority', 'duration'], ['asc', 'desc']);
      return creators;
    },
    creators(state) {
      return _.map(state.creators, (e, i) => ({ ...e, index: i }));
    },
  },

  actions: {
    async loadCreators({ commit }) {
      let creators = await db.getCreators({
        withDurations: true,
        withThanksAmount: true,
      });
      commit('setCreators', creators);
    },
    doUpdateCreator({ commit, dispatch }, { index, updates }) {
      commit('updateCreator', { index, updates });
      return dispatch('save', { index: index });
    },
    undo({ commit, dispatch, state }) {
      const { index } = state.lastEdit;
      commit('undoCreatorUpdate');
      return dispatch('save', { index: index });
    },
    save({ state }, { index }) {
      return state.creators[index].save();
    },
  },

  mutations: {
    setCreators(state, creators) {
      state.creators = creators;
    },
    updateCreator(state, { index, updates }) {
      let creator = state.creators[index];
      let keys = _.keys(updates);
      state.lastEdit = { index: index, keys: keys, old: _.pick(updates, keys) };
      state.creators[index] = { ...creator, ...updates };
    },
    undoCreatorUpdate(state) {
      let { index, keys, old } = state.lastEdit;
      let creator = _.omit(state.creators[index], keys);
      state.creators[index] = { ...creator, ...old };
    },
    setMetamaskStatusError: (state, error) => {
      state.metamaskStatusError = error;
    },
  },
};
