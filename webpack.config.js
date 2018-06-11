const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  mode: 'production',
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
        },
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
        },
      },
    ],
  },
  entry: {
    background: './src/background.js',
    popup: './src/popup.js',
    content_youtube: './src/content_youtube.js',
    dashboard: './src/dashboard.js',
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
    new HtmlWebpackPlugin({
      filename: 'dashboard/index.html',
      template: 'src/dashboard.pug',
      inject: false,
    }),
    new VueLoaderPlugin(),
  ],
};
