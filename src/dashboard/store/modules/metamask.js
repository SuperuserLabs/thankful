import browser from 'webextension-polyfill';

let networks = {
  '-1': { color: 'warning' },
  1: { name: 'Main Ethereum Network', color: 'green' },
  3: { name: 'Ropsten Test Network', color: 'red' },
  4: { name: 'Rinkeby Test Network', color: 'orange' },
  42: { name: 'Kovan Test Network', color: 'purple' },
};
let donate;

export default {
  namespaced: true,

  state: {
    netId: -1,
    address: null,
  },
  getters: {
    netName(state) {
      return networks[state.netId].name;
    },
    netColor(state) {
      return networks[state.netId].color;
    },
    isAddress() {
      return addr => donate.isAddress(addr);
    },
  },
  actions: {
    async initialize({ dispatch }) {
      let module = await import(/* webpackChunkName: "donate" */ '../../../lib/donate.js');
      donate = new module.default();
      await donate.init();
      dispatch('update');
      setInterval(() => dispatch('update'), 5000);
    },
    async update({ commit }) {
      try {
        let id = await donate.getId();
        commit('setNetId', id);
        let addr = await donate.getMyAddress();
        if (addr !== undefined) {
          commit('setAddress', addr);
        } else {
          commit('unsetAddress');
        }
      } catch (err) {
        console.error('Failed to update metamask status:', err);
        commit('unsetNetId');
        commit('unsetAddress');
      }
    },
    async donateAll({ dispatch }, donations) {
      let all = await donate.donateAll(donations);
      return all.map(async d => {
        let donation = await d;
        if (donation.failed) {
          throw donation.err;
        }
        // For communicating with the background script
        browser.storage.local.set({ lastDonation: new Date() });
        return dispatch('db/logDonation', donation, { root: true });
      });
    },
  },
  mutations: {
    setAddress(state, address) {
      state.address = address;
    },
    setNetId(state, netId) {
      state.netId = netId;
    },
    unsetAddress(state) {
      state.address = null;
    },
    unsetNetId(state) {
      state.netId = -1;
    },
  },
};
