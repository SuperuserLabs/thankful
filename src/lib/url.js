'use strict';

export function isDomain(url, domain) {
  url = new URL(url);
  let reg = RegExp(`${domain}$`);
  return reg.test(url.hostname);
}
