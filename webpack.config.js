const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
          },
        },
      },
      {
        test: /\.pug$/,
        use: {
          loader: 'pug-loader',
        }
      },
    ]
  },
  entry: {
    background_scripts: './src/background.js',
    popup: './src/popup.js',
  },
  output: {
    path: path.resolve(__dirname, 'addon'),
    filename: '[name]/index.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'popup/index.html',
      template: 'src/popup.pug',
      inject: true,
    }),
  ]
};
