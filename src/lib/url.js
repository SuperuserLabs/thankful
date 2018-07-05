export function isOnDomain(url, domain) {
  let urla = new URL(url);
  let reg = RegExp(`${domain}$`);
  return reg.test(urla.hostname);
}
