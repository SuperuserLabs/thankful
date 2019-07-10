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
    pendingDonations: {},
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
        let id = await donate.getNetId();
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
      { state, dispatch, commit },
      donationRequests: IDonationRequest[]
    ): Promise<IDonation>[] {
      return donationRequests
        .filter(d => !!d.address)
        .map(async d => {
          commit('addPendingDonation', d);
          try {
            let donationCompleted = await donate.donate(d);
            commit('completePendingDonation', d);
            return dispatch('db/logDonation', donationCompleted, {
              root: true,
            });
          } catch (err) {
            commit('failPendingDonation', d);
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
    addPendingDonation(state, donation) {
      console.log('fucking lol donation');
      console.log(donation);
      state.pendingDonations[donation.id] = donation;
      state.pendingDonations[donation.id].status = 'pending';
    },
    completePendingDonation(state, donation) {
      console.log('completed donation!');
      state.pendingDonations = {
        ...state.pendingDonations,
        [donation.id]: {
          ...state.pendingDonations[donation.id],
          status: 'completed',
        },
      };
      console.log(state.pendingDonations);
    },
    failPendingDonation(state, donation) {
      console.log('donation failed');
      state.pendingDonations = {
        ...state.pendingDonations,
        [donation.id]: {
          ...state.pendingDonations[donation.id],
          status: 'failed',
        },
      };
      console.log('pendingDonations');
      console.log(state.pendingDonations);
    },
  },
};
