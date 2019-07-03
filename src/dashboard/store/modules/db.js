import _ from 'lodash';
import { getDatabase } from '../../../lib/db.ts';

const scoringFunction = c => {
  const oneHour = 60 * 60;
  return Math.sqrt(c.duration + c.thanksAmount * oneHour);
};

let db = getDatabase();

export default {
  namespaced: true,

  state: {
    creators: [],
    donations: [],
    activities: {},
    lastEdit: {},
    loaded: { creators: false, activities: false, donations: false },
  },

  getters: {
    favoriteCreators(state, getters) {
      let creators = _.orderBy(
        getters.creatorsNotIgnored,
        ['priority', 'score'],
        ['asc', 'desc']
      );
      creators = creators.slice(0, 12);

      // Move Thankful to end
      if (creators.length > 0 && creators[0].name === 'Thankful Team') {
        creators.push(creators.shift());
      }

      return creators;
    },
    creatorsNotIgnored(state, getters) {
      let creators = _.filter(getters.creators, c => c.ignore !== true);
      return creators;
    },
    creators(state) {
      return _.map(state.creators, (e, i) => ({
        ...e,
        index: i,
        score: scoringFunction(e),
      }));
    },
    creatorsWithShare(state, getters) {
      if (getters.favoriteCreators.length > 0) {
        let creators = getters.favoriteCreators;
        let totScore = _.sumBy(creators, 'score');
        let factor = 1 - _.sumBy(creators, 'share');

        return creators.map(c => {
          let share;
          if (c.share) {
            share = c.share;
          } else {
            share = (c.score / totScore) * factor;
          }
          return {
            ..._.pick(c, ['id', 'name', 'duration', 'url', 'address', 'index']),
            share: share,
          };
        });
      }
      return [];
    },

    activityByCreator: state => creatorId => state.activities[creatorId],

    activities: ({ activities }) => onlyUnattributed =>
      onlyUnattributed ? activities.undefined : _.flatten(_.values(activities)),
  },

  actions: {
    async ensureCreators({ dispatch, state }) {
      if (state.loaded.creators) {
        return;
      }
      return dispatch('loadCreators');
    },
    async ensureActivities({ dispatch, state }) {
      if (state.loaded.activities) {
        return;
      }
      return dispatch('loadActivities');
    },
    async ensureDonations({ dispatch, state }) {
      if (state.loaded.donations) {
        return;
      }
      return dispatch('loadDonations');
    },
    async loadDonations({ commit }) {
      let donations = await db.getDonations();
      commit('setDonations', donations);
      commit('setLoaded', 'donations');
    },
    async loadCreators({ commit }) {
      let creators = await db.getCreators({
        withDurations: true,
        withThanksAmount: true,
      });
      commit('setCreators', creators);
      commit('setLoaded', 'creators');
    },
    async loadActivities({ commit }) {
      let all = await db.getActivities({ limit: -1 });
      commit('setActivities', _.groupBy(all, 'creator_id'));
      commit('setLoaded', 'activities');
    },
    doUpdateCreator({ commit, dispatch }, { index, updates }) {
      commit('updateCreator', { index, updates });
      return dispatch('save', { index: index });
    },
    undo({ commit, dispatch, state }) {
      const { index } = state.lastEdit;
      console.log(state.lastEdit);
      commit('undoCreatorUpdate');
      return dispatch('save', { index: index });
    },
    save({ state }, { index }) {
      let c = state.creators[index];
      db.updateCreator(c.url[0], c.name, c);
    },
    async removeCreator({ commit, state }, { index }) {
      await state.creators[index].delete();
      commit('remove', { index });
    },
    async logDonation({ commit }, { creator_id, weiAmount, usdAmount, hash }) {
      let id = await db.logDonation(creator_id, weiAmount, usdAmount, hash);
      let donation = await db.getDonation(id);
      commit('addDonation', donation);
      return donation;
    },
  },

  mutations: {
    addDonation(state, donation) {
      state.donations.push(donation);
    },
    setDonations(state, donations) {
      state.donations = donations;
    },
    setLoaded(state, variable) {
      state.loaded[variable] = true;
    },
    setCreators(state, creators) {
      state.creators = creators;
    },
    setActivities(state, activities) {
      state.activities = activities;
    },
    updateCreator(state, { index, updates }) {
      let creator = state.creators[index];
      let keys = _.keys(updates);
      state.lastEdit = { index: index, keys: keys, old: _.pick(creator, keys) };
      state.creators.splice(
        index,
        1,
        Object.assign(
          Object.create(Object.getPrototypeOf(creator)),
          creator,
          updates
        )
      );
    },
    undoCreatorUpdate(state) {
      let { index, keys, old } = state.lastEdit;
      let creator = state.creators[index];
      state.creators.splice(
        index,
        1,
        Object.assign(
          Object.create(Object.getPrototypeOf(creator)),
          _.omit(creator, keys),
          old
        )
      );
    },
    remove(state, { index }) {
      state.creators.splice(index, 1);
    },
  },
};
