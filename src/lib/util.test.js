import { isWebExtension, isNode } from './util';

describe('isNode', () => {
  it('checks is running as Node (usually tests)', () => {
    expect(isNode()).toBe(true);
  });
});

describe('isWebExtension', () => {
  it('checks is running as WebExtension', () => {
    expect(isWebExtension()).toBe(false);
  });
});
