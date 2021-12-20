const util = require('util');
const exec = util.promisify(require('child_process').exec);
const csv = require('csvtojson');
const _ = require('lodash');

async function get_addresses() {
  let result = await exec(
    'curl -L "https://docs.google.com/spreadsheets/d/1-eQaGFvbwCnxY9UCgjYtXRweCT7yu92UC2sqK1UEBWc/export?format=csv" | tail -n +4'
  );

  //console.warn(result.stdout);
  let creators = await csv().fromString(result.stdout);

  creators = _.map(creators, c => {
    c = _.mapKeys(c, (v, k) => k.toLowerCase());
    c.urls = c.urls.split(';').filter(s => s.length > 0);
    return c;
  }).filter(c => c.name);

  console.log(JSON.stringify(creators, null, 2));
}

get_addresses();
