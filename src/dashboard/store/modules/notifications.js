import _ from 'lodash';

export default {
  namespaced: true,

  state: {
    messages: [
      { text: 'Just testing...', type: 'info', active: true },
      {
        title: 'A test',
        text: 'Just testing errors',
        type: 'error',
        active: true,
      },
    ],
  },

  getters: {
    active(state) {
      return _.filter(
        _.map(state.messages, (e, i) => ({ ...e, index: i })),
        'active'
      );
    },
  },

  mutations: {
    insert(state, { title = null, text, type = 'info' }) {
      state.messages.push({ title, text, type, active: true });
    },
    hide(state, id) {
      state.messages[id].active = false;
    },
  },

  actions: {},
};
