import browser from 'webextension-polyfill';

export default {
  namespaced: true,

  state: {
    budget_per_month: 20,
    budget_per_thanks: 1,
  },

  getters: {},

  mutations: {
    updateSettings(state, settings) {
      Object.assign(state, settings);
      let serialized_state = JSON.parse(JSON.stringify(state));
      console.log('Updated settings:', serialized_state);
      browser.storage.local.set({ settings: serialized_state });
    },
  },

  actions: {
    async loadSettings({ commit }) {
      let settings = (await browser.storage.local.get('settings')).settings;
      console.log('Loaded settings:', settings);
      commit('updateSettings', settings);
    },
  },
};
