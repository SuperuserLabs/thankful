'use strict';

export function isOnDomain(url, domain) {
  url = new URL(url);
  let reg = RegExp(`${domain}$`);
  return reg.test(url.hostname);
}
