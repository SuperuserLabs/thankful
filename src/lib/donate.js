import Web3 from 'web3';
import MetamaskInpageProvider from 'metamask-crx/app/scripts/lib/inpage-provider.js';
import PortStream from 'metamask-crx/app/scripts/lib/port-stream.js';
import browser from 'webextension-polyfill';
import BigNumber from 'bignumber.js';

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

        // TODO: Generate a bad address to test against (account with 0 balance)
        //console.log(web3.utils.)

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
    const donationPromises = _.toPairs(addressAmounts).map(async pair => {
      return this._donateOne(pair[0], await this._usdToWei(BigNumber(pair[1])));
    });
    await Promise.all(donationPromises).catch(console.error);
  }

  _donateOne(addr, amount) {
    return this._myAcc()
      .then(acc => {
        if (!web3.utils.isAddress(addr)) {
          throw 'Not an address';
        }
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
    return this._usdEthRate()
      .then(usdEthRate => {
        const ethAmount = usdAmount.dividedBy(usdEthRate);
        return ethAmount
          .multipliedBy(web3.utils.unitMap.ether)
          .dividedToIntegerBy(1);
      })
      .catch(console.error);
  }
}
