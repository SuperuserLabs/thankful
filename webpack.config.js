const path = require('path');

module: {
  rules: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    },
  ];
}

module.exports = {
  entry: {
    background_scripts: './background.js',
    popup: './popup.js',
  },
  output: {
    path: path.resolve(__dirname, 'addon'),
    filename: '[name]/index.js',
  },
};
