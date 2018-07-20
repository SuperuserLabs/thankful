export default {
  namespaced: true,

  state: {
    metamaskStatusError: 'Please install MetaMask to be able to donate',
  },
  mutations: {
    setMetamaskStatusError: (state, error) => {
      state.metamaskStatusError = error;
    },
  },
};
