import browser from 'webextension-polyfill';

export default {
  namespaced: true,

  state: {
    totalAmount: 10,
  },

  getters: {},

  mutations: {
    updateSettings(state, settings) {
      Object.assign(state, settings);
      browser.storage.local.set({ settings: state });
    },
  },

  actions: {
    async loadSettings({ commit }) {
      let settings = (await browser.storage.local.get('settings')).settings;
      commit('updateSettings', settings);
    },
  },
};
