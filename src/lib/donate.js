import BigNumber from 'bignumber.js';
//import Promise from 'bluebird';

let web3;

export default class Donate {
  async init() {
    const Web3 = (await import('web3')).default;
    const createMetaMaskProvider = (await import('metamask-extension-provider'))
      .default;
    const web3Provider = createMetaMaskProvider();

    web3Provider.on('error', error => {
      console.error('Failed to connect to MetaMask:', error);
    });

    // TODO: Add comment that explains this import
    await import('bn.js');
    web3 = new Web3(web3Provider);

    //return web3.eth.net.getId();
    return this.getId();
  }

  async getId() {
    //return web3.eth.net.getId();
    return new Promise((resolve, reject) => {
      web3.version.getNetwork((err, net) => {
        if (err) reject(err);
        resolve(net);
      });
    });
  }

  async donateAll(donations) {
    const donationPromises = donations.filter(d => !!d.address).map(async d => {
      return this._donateOne(d.address, new BigNumber(d.funds), d.id);
    });
    return donationPromises;
  }

  isAddress(address) {
    return web3.isAddress(address);
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
    creator_id,
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
      return new Promise((resolve, reject) => {
        console.log('starting transaction');
        web3.eth.sendTransaction(
          {
            from: myAcc,
            to: addr,
            value: weiAmount,
            gas: gasLimit,
            // Function seems buggy
            //data: web3.utils.utf8ToHex('💛'),
            data: '0xf09f929b',
          },
          (err, hash) => {
            if (err) reject(err);
            console.log('transaction', hash);
            resolve(hash);
          }
        );
        //.once('transactionHash', resolve)
      }).then(hash => ({
        creator_id: creator_id,
        weiAmount: weiAmount.toString(),
        usdAmount: usdAmount.toString(),
        hash: hash,
        failed: false,
      }));
    } catch (error) {
      console.error('donateone broke', error);
      return {
        creator_id: creator_id,
        usdAmount: usdAmount,
        failed: true,
        error: error,
      };
    }
  }

  async getMyAddress() {
    return web3.eth.accounts[0];
  }

  async _usdEthRate() {
    try {
      const response = await fetch(
        new Request('https://api.coinmarketcap.com/v2/ticker/1027/')
      );
      const ethInfo = await response.json();
      return new BigNumber(ethInfo.data.quotes.USD.price);
    } catch (err) {
      throw ('Could not get usd/eth exchange rate', err);
    }
  }

  _usdToWei(usdAmount) {
    return this._usdEthRate().then(usdEthRate => {
      const ethAmount = usdAmount.dividedBy(usdEthRate);
      console.log('ethamount', ethAmount);
      return (
        ethAmount
          //.multipliedBy(web3.utils.unitMap.ether)
          .mul('1000000000000000000')
          .dividedToIntegerBy(1)
      );
    });
  }

  // Unused but works
  // Doesn't work now with the old bignumber.js version
  _weiToUsd(weiAmount) {
    return this._usdEthRate().then(usdEthRate => {
      const ethAmount = weiAmount.dividedBy(web3.utils.unitMap.ether);
      return ethAmount.multipliedBy(usdEthRate);
    });
  }
}
