const addr = {};
// All on Ropsten
addr.erik = '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
addr.patrik = '0xbcEf85708670FA0127C484Ac649724B8028Ea08b';
addr.jacob = '0xBF9e8395854cE02abB454d5131F45F2bFFB54017';

export class Donate {
  constructor() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider
      console.log('Using metamask');
      web3js = new Web3(web3.currentProvider);
    } else {
      throw 'Found no injected web3. Have you logged into Metamask?';
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      // We'll probably want to use this for unit testing
      // web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    web3.version.getNetwork((err, netId) => {
      switch (netId) {
        case '1':
          console.log('This is mainnet');
          break;
        case '2':
          console.log('This is the deprecated Morden test network.');
          break;
        case '3':
          console.log('This is the ropsten test network.');
          break;
        case '4':
          console.log('This is the Rinkeby test network.');
          break;
        case '42':
          console.log('This is the Kovan test network.');
          break;
        default:
          console.log('This is an unknown network.');
      }
    });

    console.log('Connected to web3');
  }

  donateMulti() {
    // Async is required here
    // https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#dizzy-all-async---think-of-metamask-as-a-light-client
    web3.eth.sendTransaction(
      {
        from: _myAcc(),
        to: addr.erik,
        value: 1e15,
        gas: 1e6,
      },
      (err, res) => {
        if (err) {
          throw err;
        }
        console.log('Sent money:', res);
      }
    );
  }

  _myAcc() {
    // Sync is supposed to work here but didn't
    web3.eth.getAccounts(function(err, accounts) {
      return console.log('My account:', accounts[0]);
    });
  }
}
