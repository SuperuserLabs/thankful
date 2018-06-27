var fs = require('fs');
var deploy = require('firefox-extension-deploy');

let secret = process.env['MOZILLA_SECRET'];
let issuer = process.env['MOZILLA_ISSUER'];
let extension_id = process.env['MOZILLA_EXTENSION_ID'];
let version = process.env['THANKFUL_VERSION'];

console.log(process.env);

deploy({
  // obtained by following the instructions here:
  // https://addons-server.readthedocs.io/en/latest/topics/api/auth.html
  // or from this page:
  // https://addons.mozilla.org/en-US/developers/addon/api/key/
  issuer: issuer,
  secret: secret,

  // the ID of your extension
  id: extension_id,
  // the version to publish
  version: version,

  // a ReadStream containing a .zip (WebExtensions) or .xpi (Add-on SDK)
  src: fs.createReadStream('thankful.zip'),
}).then(
  function() {
    // success!
    console.log('Extension deployed successfully!');
    process.exit(0);
  },
  function(err) {
    console.error(err);
    process.exit(1);
  }
);
