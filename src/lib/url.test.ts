import { isOnDomain } from './url';

describe('url', () => {
  it('checks if an URL is from domain', () => {
    expect(isOnDomain('https://github.com/SuperuserLabs', 'github.com')).toBe(
      true
    );
  });
});
