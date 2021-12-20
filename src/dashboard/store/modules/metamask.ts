import { IDonation, IDonationRequest } from '@/lib/models';
import Donate from '@/lib/donate';
import networks from '../../../lib/networks';

let donate: Donate;

export default {
  namespaced: true,

  state: {
    netId: -1,
    address: null,
    budget_per_month: 0,
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
      return (addr) => donate.isAddress(addr);
    },
  },

  actions: {
    changeDonationAmount({ state, commit }, payload) {
      let creator = payload.creator;
      let new_value = payload.new_value;

      let dist = state.distribution;
      let unchanged_share_sum = 1 - creator.share;
      let change = new_value / 100 - creator.share;
      dist = dist.map((c) => {
        if (c.id === creator.id) {
          c.share = new_value / 100;
        } else if (unchanged_share_sum > 10e-3) {
          c.share = c.share - (c.share * change) / unchanged_share_sum;
        } else {
          // redistribute equally if all other sliders are set to ~0
          c.share = (-1 * change) / (dist.length - 1);
        }
        return c;
      });

      commit('distribute', dist);
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
      { dispatch, commit },
      donationRequests: IDonationRequest[]
    ): Promise<IDonation>[] {
      return donationRequests
        .filter((d) => !!d.address)
        .map(async (d) => {
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
    set_budget(state, budget_per_month) {
      state.budget_per_month = budget_per_month;
    },
    distribute(state, new_dist) {
      new_dist = new_dist.map((c) => {
        c.funds = parseFloat((c.share * state.budget_per_month).toFixed(2));
        return c;
      });
      state.distribution = new_dist;
    },
  },
};
