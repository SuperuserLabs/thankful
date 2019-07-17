const calltime = require('./calltime.ts');

describe('sinceLastCall', () => {
  it('returns zero on first call', () => {
    expect(calltime.sinceLastCall()).toEqual(0);
  });
});

describe('valueConstantTicker', () => {
  it('returns zero on first call', () => {
    let ticker = calltime.valueConstantTicker();
    expect(ticker()).toEqual(0);
  });

  it('returns time ~20ms after 20ms', done => {
    let ticker = calltime.valueConstantTicker();
    ticker('value');
    function callback() {
      expect(ticker('value')).toBeCloseTo(0.02, 2);
      done();
    }
    setTimeout(callback, 21);
  });
});
