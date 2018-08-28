import BigNumber from 'bignumber.js';

let web3;

export default class Donate {
  async init() {
    const Web3 = (await import('web3')).default;
    const createMetaMaskProvider = (await import('metamask-extension-provider'))
      .default;
    const web3Provider = createMetaMaskProvider();

    web3Provider.on('error', error => {
      // Failed to connect to MetaMask, fallback logic.
      console.error('Failed to connect to MetaMask:', error);
    });

    await import('bn.js');
    web3 = new Web3(web3Provider);

    return web3.eth.net.getId();
  }

  async getId() {
    return web3.eth.net.getId();
  }

  async donateAll(donations) {
    const donationPromises = donations
      .filter(d => !!d.address)
      .map(async d => this._donateOne(d.address, BigNumber(d.funds), d.url));
    return donationPromises;
  }

  isAddress(address) {
    return web3.utils.isAddress(address);
  }

  // To test this, get a 0-balance address by taking an actual address and
  // making it lowercase (to get past the checksum) and then changing one
  // letter/number to something else.
  hasBalance(address) {
    return web3.eth.getBalance(address).then(balance => {
      return balance > 0;
    });
  }

  async _donateOne(
    addr,
    usdAmount,
    creatorUrl,
    // A basic transaction should only need 21k but we have some margin because
    // of the data we attach. Also, unused gas is refunded.
    gasLimit = 1e5
  ) {
    try {
      if (!this.isAddress(addr)) {
        throw `Not an address: ${addr}`;
      }
      // TODO: Re-enable this when we have some better way of telling the user
      // than by completely stopping them from donating
      //if (!(await this.hasBalance(addr))) {
      //  throw 'Address looks inactive (0 balance)';
      //}
      const weiAmount = await this._usdToWei(usdAmount);
      const myAcc = await this.getMyAddress();
      if (!myAcc) {
        throw 'You are not logged in to metamask, please install the extension and/or log in';
      }
      return new Promise(resolve =>
        web3.eth
          .sendTransaction({
            from: myAcc,
            to: addr,
            value: weiAmount,
            gas: gasLimit,
            // Function seems buggy
            //data: web3.utils.utf8ToHex('💛'),
            data: '0xf09f929b',
          })
          .once('transactionHash', resolve)
      ).then(hash => ({
        creatorUrl: creatorUrl,
        weiAmount: weiAmount,
        usdAmount: usdAmount,
        hash: hash,
        failed: false,
      }));
    } catch (error) {
      return {
        creatorUrl: creatorUrl,
        usdAmount: usdAmount,
        failed: true,
        error: error,
      };
    }
  }

  async getMyAddress() {
    return web3.eth.getAccounts().then(accounts => {
      return accounts[0];
    });
  }

  async _usdEthRate() {
    try {
      const response = await fetch(
        new Request('https://api.coinmarketcap.com/v2/ticker/1027/')
      );
      const ethInfo = await response.json();
      return BigNumber(ethInfo.data.quotes.USD.price);
    } catch (err) {
      throw ('Could not get usd/eth exchange rate', err);
    }
  }

  _usdToWei(usdAmount) {
    return this._usdEthRate().then(usdEthRate => {
      const ethAmount = usdAmount.dividedBy(usdEthRate);
      return ethAmount
        .multipliedBy(web3.utils.unitMap.ether)
        .dividedToIntegerBy(1);
    });
  }

  // Unused but works
  _weiToUsd(weiAmount) {
    return this._usdEthRate().then(usdEthRate => {
      const ethAmount = weiAmount.dividedBy(web3.utils.unitMap.ether);
      return ethAmount.multipliedBy(usdEthRate);
    });
  }
}
