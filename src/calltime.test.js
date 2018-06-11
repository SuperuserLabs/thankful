import assert from 'assert';
import * as calltime from './calltime.js';

describe('Calltime', () => {
  it('returns zero on first call', () =>
    assert(calltime.sinceLastCall() == 0, 'should return zero on first call'));
});
