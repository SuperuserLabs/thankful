import _ from 'lodash';
import { Database, Creator } from '../../../lib/db.js';

let db = new Database();

function initThankfulTeamCreator() {
  const creator = new Creator('https://getthankful.io', 'Thankful Team');
  // Erik's address
  // TODO: Change to a multisig wallet
  creator.address = '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
  creator.info =
    'Be thankful for Thankful, donate so we can keep helping people to be thankful!';
  creator.priority = 1;
  creator.share = 0.2;
  return creator.save();
}

export default {
  namespaced: true,

  state: {
    creators: [],
    lastEdit: {},
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
      await initThankfulTeamCreator();
      await db.attributeGithubActivity();
      let creators = await db.getCreators({ withDurations: true });
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
  },
};
