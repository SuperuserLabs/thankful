const util = require('util');
const exec = util.promisify(require('child_process').exec);
const csv = require('csvtojson');

async function get_addresses() {
  let result = await exec(
    'curl "https://docs.google.com/spreadsheets/d/1-eQaGFvbwCnxY9UCgjYtXRweCT7yu92UC2sqK1UEBWc/export?format=csv" | tail -n +4'
  );

  //console.warn(result.stdout);
  let csvObj = await csv().fromString(result.stdout);
  console.log(JSON.stringify(csvObj, null, 2));
}

get_addresses();
