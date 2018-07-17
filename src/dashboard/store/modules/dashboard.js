import { Database } from '../../../lib/db.js';

let db = new Database();

const state = {};

db.getCreators().then(creators => {
  state.creators = creators;
});

const getters = {};

const actions = {};

const mutations = {};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
