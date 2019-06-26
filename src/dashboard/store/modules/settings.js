import browser from 'webextension-polyfill';

export default {
  namespaced: true,

  state: {
    totalAmount: 10,
  },

  getters: {},

  mutations: {
    updateSettings(state, settings) {
      state.totalAmount = settings.totalAmount;
      //Object.assign(state, {'settings': settings});
      console.log('fucking state');
      console.log(state);
      browser.storage.local.set({
        settings: JSON.parse(JSON.stringify(state)),
      });
    },
  },

  actions: {
    async loadSettings({ commit }) {
      let settings = (await browser.storage.local.get('settings')).settings;
      console.log('fucking settings');
      console.log(settings);
      commit('updateSettings', settings);
    },
  },
};
