const util = require('util');
const exec = util.promisify(require('child_process').exec);
const csv = require('csvtojson');
exec(
  'curl https://docs.google.com/spreadsheets/d/1-eQaGFvbwCnxY9UCgjYtXRweCT7yu92UC2sqK1UEBWc/export?format=csv | tail -n +3'
).then(result => {
  csv()
    .fromString(result.stdout)
    .then(jsonObj => {
      console.log(JSON.stringify(jsonObj));
    });
});
