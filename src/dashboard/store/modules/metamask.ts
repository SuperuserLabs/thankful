import {
  IDonation,
  IDonationRequest,
  IDonationSuccess,
} from '../../../lib/models';

let networks = {
  '-1': { color: 'warning' },
  1: { name: 'Main Ethereum Network', color: 'green' },
  3: { name: 'Ropsten Test Network', color: 'red' },
  4: { name: 'Rinkeby Test Network', color: 'orange' },
  42: { name: 'Kovan Test Network', color: 'purple' },
};

import Donate from '../../../lib/donate.ts';
let donate: Donate;

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
      donate = new Donate();
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
    donateAll(
      { dispatch },
      donations: IDonationRequest[]
    ): Promise<IDonation>[] {
      return donate.donateAll(donations).map(async pendingDonation => {
        try {
          let donation = await pendingDonation;
          return dispatch('db/logDonation', donation, { root: true });
        } catch (err) {
          throw err;
        }
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
