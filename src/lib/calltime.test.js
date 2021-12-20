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

  it('returns time ~20ms after 20ms', (done) => {
    let ticker = calltime.valueConstantTicker();
    ticker('value');
    function callback() {
      let elapsed = ticker('value');
      expect(elapsed).toBeGreaterThan(0.02);
      // Time taken can vary greatly between runs so we have a large margin here to avoid false negatives
      expect(elapsed).toBeLessThan(0.1);
      done();
    }
    setTimeout(callback, 21);
  });
});
