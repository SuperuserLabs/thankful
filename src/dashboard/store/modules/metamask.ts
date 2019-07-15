import { IDonation, IDonationRequest, IDonationSuccess } from '~/lib/models';
import Donate from '~/lib/donate';
import networks from '../../../lib/networks';
import _ from 'lodash';

let donate: Donate;

export default {
  namespaced: true,

  state: {
    netId: -1,
    address: null,
    pendingDonations: {},
    distribution: [],
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
    changeDonationAmount({ state, commit }, creators, creator, new_value) {
      let dist = state.distribution.length > 0 ? state.distribution : creators;
      let redist_targets = dist.filter(c => c.id !== creator.id);
      let unchanged_share_sum = _.sumBy(redist_targets, 'share');
      let change = new_value / 100 - creator.share;
      let new_dist = redist_targets.map(share => {
        if (unchanged_share_sum > 10e-3) {
          return share - (share * change) / unchanged_share_sum;
        } // redistribute equally if all other sliders are set to ~0
        return (-1 * change) / redist_targets.length;
      });
      creator.share = new_value / 100;
      new_dist.push(creator);
      console.log('change amoutn');
      console.log(new_dist);
      commit('distribute', new_dist);
    },
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
      state.pendingDonations[donation.id] = donation;
      state.pendingDonations[donation.id].status = 'pending';
    },
    completePendingDonation(state, donation) {
      state.pendingDonations = {
        ...state.pendingDonations,
        [donation.id]: {
          ...state.pendingDonations[donation.id],
          status: 'completed',
        },
      };
    },
    failPendingDonation(state, donation) {
      state.pendingDonations = {
        ...state.pendingDonations,
        [donation.id]: {
          ...state.pendingDonations[donation.id],
          status: 'failed',
        },
      };
    },
    distribute(state, new_dist) {
      state.distribution = new_dist;
    },
  },
};
