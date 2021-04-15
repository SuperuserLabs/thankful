/*eslint-env node*/
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  entry: {
    app: ['./src/server/server.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist-server'),
    filename: 'index.js',
  },
  externals: [nodeExternals()],
};
