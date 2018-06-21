import Web3 from 'web3';
import MetamaskInpageProvider from 'metamask-crx/app/scripts/lib/inpage-provider.js';
import PortStream from 'metamask-crx/app/scripts/lib/port-stream.js';
import browser from 'webextension-polyfill';

const addrs = {};
// All on Ropsten
addrs.erik = '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
addrs.patrik = '0xbcEf85708670FA0127C484Ac649724B8028Ea08b';
addrs.jacob = '0xBF9e8395854cE02abB454d5131F45F2bFFB54017';
addrs.johan = '0xB41371729C8e5EEF5D0992f8c2D10f809EcFE112';

let web3;

export default class Donate {
  constructor() {
    this._metamaskExtensionId()
      .then(METAMASK_EXTENSION_ID => {
        const metamaskPort = browser.runtime.connect(METAMASK_EXTENSION_ID);
        const pluginStream = new PortStream(metamaskPort);
        const web3Provider = new MetamaskInpageProvider(pluginStream);
        web3 = new Web3(web3Provider);

        // We might want to use this for unit testing
        // web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

        return web3.eth.net.getId();
      })
      .then(netId => {
        // Networks:
        // 1:  Mainnet
        // 2:  Deprecated Morden testnet
        // 3:  Ropsten testnet
        // 4:  Rinkeby testnet
        // 42: Kovan testnet
        if (netId !== 3) {
          // Abort if not connected to Ropsten (testnet)
          web3 = undefined;
          throw 'Not connected to Ropsten, connected to: ' + netId;
        }
      })
      .catch(err => {
        throw err;
      });
  }

  async donateAll(addressAmounts) {
    console.log(addressAmounts);
    const donationPromises = [];
    Object.keys(addressAmounts).forEach(address => {
      // TODO: Replace with exchange rate and wei conversion stuff
      donationPromises.push(
        this._donateOne(address, addressAmounts[address] * 1e16)
      );
    });
    await Promise.all(donationPromises)
      .then(res => {
        console.log('Donations made:', res.length);
      })
      .catch(console.error);
  }

  _donateOne(addr, amount) {
    return this._myAcc()
      .then(acc => {
        return web3.eth.sendTransaction({
          from: acc,
          to: addr,
          value: amount,
          gas: 1e6,
          // Function seems buggy
          //data: web3.utils.utf8ToHex('💛'),
          data: '0xf09f929b',
        });
      })
      .then(res => {
        console.log('Sent money:', res);
      })
      .catch(console.error);
  }

  _myAcc() {
    return web3.eth.getAccounts().then(accounts => {
      return accounts[0];
    });
  }

  _metamaskExtensionId() {
    if (browser.runtime.getBrowserInfo) {
      return browser.runtime
        .getBrowserInfo()
        .then(res => {
          if (res.name === 'Firefox') {
            return 'webextension@metamask.io';
          } else {
            // Assume Chrome if it's some other string
            return 'nkbihfbeogaeaoehlefnkodbefgpgknn';
          }
        })
        .catch(console.error);
    } else {
      // Assume Chrome if getBrowserInfo isn't defined
      return Promise.resolve('nkbihfbeogaeaoehlefnkodbefgpgknn');
    }
  }

  async _ethUsdRate() {
    try {
      const response = await fetch(
        new Request('https://api.coinmarketcap.com/v1/ticker/ethereum/')
      );
      const ethInfo = (await response.json())[0];
      return ethInfo.price_usd;
    } catch (err) {
      throw ('Could not get eth/usd exchange rate', err);
    }
  }
}
