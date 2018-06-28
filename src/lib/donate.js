import 'idempotent-babel-polyfill';
import Web3 from 'web3';
import MetamaskInpageProvider from 'metamask-crx/app/scripts/lib/inpage-provider.js';
import PortStream from 'metamask-crx/app/scripts/lib/port-stream.js';
import browser from 'webextension-polyfill';
import BigNumber from 'bignumber.js';
import { Database, Donation } from './db';

const addrs = {};
// All on Ropsten
addrs.erik = '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
addrs.patrik = '0xbcEf85708670FA0127C484Ac649724B8028Ea08b';
addrs.jacob = '0xBF9e8395854cE02abB454d5131F45F2bFFB54017';
addrs.johan = '0xB41371729C8e5EEF5D0992f8c2D10f809EcFE112';

let web3;
let db;

export default class Donate {
  constructor() {
    db = new Database();

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

  async donateAll(donations, refreshCallback) {
    const donationPromises = donations.map(async d => {
      return this._donateOne(
        d.address,
        BigNumber(d.allocatedFunds),
        d.url,
        refreshCallback
      );
    });
    return Promise.all(donationPromises).catch(console.error);
  }

  isAddress(address) {
    return web3.utils.isAddress(address);
  }

  // To test this, get a 0-balance address by taking an actual address and
  // making it lowercase (to get past the checksum) and then changing one
  // letter/number to something else.
  hasBalance(address) {
    return web3.eth
      .getBalance(address)
      .then(balance => {
        return balance > 0;
      })
      .catch(err => {
        console.error('Could not get balance of', address, ':', err);
      });
  }

  async _donateOne(
    addr,
    usdAmount,
    creatorUrl,
    refreshCallback,
    // A basic transaction should only need 21k but we have some margin because
    // of the data we attach. Also, unused gas is refunded.
    gasLimit = 1e5
  ) {
    try {
      if (!this.isAddress(addr)) {
        throw 'Not an address';
      }
      if (!(await this.hasBalance(addr))) {
        throw 'Address looks inactive (0 balance)';
      }
      const weiAmount = await this._usdToWei(usdAmount);
      const myAcc = await this._myAcc();
      return web3.eth
        .sendTransaction({
          from: myAcc,
          to: addr,
          value: weiAmount,
          gas: gasLimit,
          // Function seems buggy
          //data: web3.utils.utf8ToHex('💛'),
          data: '0xf09f929b',
        })
        .once('transactionHash', hash => {
          return db
            .logDonation(creatorUrl, weiAmount, usdAmount, hash)
            .then(refreshCallback)
            .catch(err => {
              console.error('Failed to log donation:', err);
            });
        });
    } catch (error) {
      console.error('Failed to donate to', addr, ':', error);
    }
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

  // Unused but works
  _weiToUsd(weiAmount) {
    return this._usdEthRate()
      .then(usdEthRate => {
        const ethAmount = weiAmount.dividedBy(web3.utils.unitMap.ether);
        return ethAmount.multipliedBy(usdEthRate);
      })
      .catch(console.error);
  }
}
