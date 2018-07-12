import { Database } from '../../../lib/db.js';

let db = new Database();

const state = {
  creators: [],
};

const getters = {};

const actions = {};

const mutations = {
  setCreators: (state, creators) => {
    state.creators = creators;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
