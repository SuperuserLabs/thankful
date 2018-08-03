import { isOnDomain, canonicalizeUrl } from './url';

describe('url', () => {
  it('checks if an URL is from domain', () => {
    expect(isOnDomain('https://github.com/SuperuserLabs', 'github.com')).toBe(
      true
    );
  });
  it('fixes trailing slash', () => {
    expect(canonicalizeUrl('https://getthankful.io/')).toBe(
      canonicalizeUrl('https://getthankful.io')
    );
  });
});
