import addressRegistry from '../../dist/crypto_addresses.json';

/* eslint-disable prettier/prettier */
const express = require('express');
const app = express();
const port = 3333;

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/creators', (req, res) => {
  res.send("List of creator URI's");
});

app.get('/creators/:username', (req, res) => {
  let username = req.params.username;

  let creator = addressRegistry.find(element => element.name === username);

  if (creator) {
    let output = {
      username: creator.name,
      name: creator.name,
      type: creator.type,
      address: creator['eth address'],
      verified: true,
      urls: [],
    };

    if (creator.website) output.urls.push(creator.website);
    if (creator.github) output.urls.push(creator.github);
    if (creator.youtube) output.urls.push(creator.youtube);
    if (creator.medium) output.urls.push(creator.medium);
    if (creator.patreon) output.urls.push(creator.patreon);
    if (creator.twitter) output.urls.push(creator.twitter);

    res.json(output);
  } else if (username === 'test') {
    res.json({
      username: 'test',
      name: 'Test',
      type: 'org',
      address: '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35',
      verified: true,
      urls: [],
    });
  } else {
    res.status(404).json({
      code: 404,
      message: 'Creator not found.',
    });
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
