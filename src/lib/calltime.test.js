const assert = require('assert');
const calltime = require('./calltime.ts');

describe('sinceLastCall', () => {
  it('returns zero on first call', () =>
    assert(calltime.sinceLastCall() == 0, 'should return zero on first call'));
});

describe('valueConstantTicker', () => {
  it('returns zero on first call', () =>
    assert(
      calltime.valueConstantTicker()() == 0,
      'should return zero on first call'
    ));
  it('returns time > 1 s after 1 s', done => {
    let ticker = calltime.valueConstantTicker();
    ticker('value');
    function callback() {
      assert(ticker('value') >= 1, 'should return zero on first call');
      done();
    }
    setTimeout(callback, 1000);
  });
});
