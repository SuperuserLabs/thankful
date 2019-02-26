export function isOnDomain(url: string, domain: string): boolean {
  let urla = new URL(url);
  let reg = RegExp(`${domain}$`);
  return reg.test(urla.hostname);
}

export function canonicalizeUrl(url_str: string): string {
  // TODO: When this function is updated to support more sites, we will have to
  // run it on all old database entries to update them. Any way to do this
  // without lots of database upgrades?
  let url = new URL(url_str);
  if (url.host == 'www.youtube.com' && url.pathname == '/watch') {
    // example: www.youtube.com/watch?v=videoid
    // removes searchParams such as t=1min, feature=youtu.be etc.
    url_str = url.origin + url.pathname;
    url_str += '?v=' + url.searchParams.get('v');
  }
  return url_str;
}
