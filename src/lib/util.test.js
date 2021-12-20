/**
 * @jest-environment jsdom
 */

let util = require('./util');

describe('isNode', () => {
  it('checks is running as Node (usually tests)', () => {
    expect(util.isNode()).toBe(true);
  });
});

describe('isWebExtension', () => {
  it('checks is running as WebExtension', () => {
    expect(util.isWebExtension()).toBe(false);
  });
});
