import BigNumber from 'bignumber.js';
import { IDonationRequest, IDonationSuccess } from './models.ts';
//import Promise from 'bluebird';

let web3;

export default class Donate {
  async init(): Promise<Number> {
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
    return this.getNetId();
  }

  async getNetId(): Promise<number> {
    //return web3.eth.net.getId();
    return new Promise((resolve, reject) => {
      web3.version.getNetwork((err, net) => {
        if (err) reject(err);
        resolve(net);
      });
    });
  }

  isAddress(address: String): boolean {
    return web3.isAddress(address);
  }

  // To test this, get a 0-balance address by taking an actual address and
  // making it lowercase (to get past the checksum) and then changing one
  // letter/number to something else.
  async hasBalance(address: String): Promise<boolean> {
    let balance = await web3.eth.getBalance(address);
    return balance > 0;
  }

  async donate(
    donation: IDonationRequest,
    // A basic transaction should only need 21k but we have some margin because
    // of the data we attach. Also, unused gas is refunded.
    gasLimit = 1e5
  ): Promise<IDonationSuccess> {
    try {
      if (!this.isAddress(donation.address)) {
        throw `Not an address: ${donation.address}`;
      }
      // TODO: Re-enable this when we have some better way of telling the user
      // than by completely stopping them from donating
      //if (!(await this.hasBalance(addr))) {
      //  throw 'Address looks inactive (0 balance)';
      //}
      const usdAmount = new BigNumber(donation.funds);
      const weiAmount = await this._usdToWei(usdAmount);
      const myAcc = await this.getMyAddress();
      if (!myAcc) {
        throw 'You are not logged in to metamask, please install the extension and/or log in';
      }

      let txid = await new Promise((resolve, reject) => {
        console.log('starting transaction');
        web3.eth.sendTransaction(
          {
            from: myAcc,
            to: donation.address,
            value: weiAmount,
            gas: gasLimit,
            // Function seems buggy
            //data: web3.utils.utf8ToHex('💛'),
            data: '0xf09f929b',
          },
          (err, txid) => {
            if (err) reject(err);
            console.log('transaction', txid);
            resolve(txid);
          }
        );
        //.once('transactionHash', resolve)
      });

      return {
        address: donation.address,
        creator_id: donation.id,
        tx_id: txid.toString(),
        net_id: await this.getNetId(),
        weiAmount: weiAmount.toString(),
        usdAmount: usdAmount.toString(),
      };
    } catch (err) {
      console.error('donateone broke', err);
      throw err;
    }
  }

  getMyAddress(): String {
    return web3.eth.accounts[0];
  }

  async _usdEthRate(): Promise<BigNumber> {
    try {
      const response = await fetch(
        new Request('https://api.coinmarketcap.com/v2/ticker/1027/')
      );
      const ethInfo = await response.json();
      return new BigNumber(ethInfo.data.quotes.USD.price);
    } catch (err) {
      console.error('Could not get USD/ETH exchange rate');
      throw err;
    }
  }

  _usdToWei(usdAmount: BigNumber): BigNumber {
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
  _weiToUsd(weiAmount: BigNumber): BigNumber {
    return this._usdEthRate().then(usdEthRate => {
      const ethAmount = weiAmount.dividedBy(web3.utils.unitMap.ether);
      return ethAmount.multipliedBy(usdEthRate);
    });
  }
}
