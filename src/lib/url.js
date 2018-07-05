export function isOnDomain(url, domain) {
  let urla = new URL(url);
  let reg = RegExp(`${domain}$`);
  return reg.test(urla.hostname);
}

export function canonicalizeUrl(orig_url_str) {
  // Base format is: host
  // example: google.com
  let url = new URL(orig_url_str);
  let url_str = url.host;

  // Extension formats for different domains
  if (url.host == 'www.youtube.com') {
    // pathname+searchParams(v)
    // example: /watch?v=videoid
    url_str += url.pathname;
    if (url.pathname == '/watch') {
      url_str += '?v=' + url.searchParams.get('v');
    }
  } else if (url.host == 'github.com') {
    // first depth path
    // example: /SuperuserLabs
    let levels = url.pathname.split('/');
    console.log(levels);
    if (levels.length > 0) {
      url_str += '/' + levels[1];
    }
  }
  console.log(url_str);
  return url_str;
}
