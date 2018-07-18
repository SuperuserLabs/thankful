/*eslint-env node*/

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

let mode = process.env['PRODUCTION'] ? 'production' : 'development';

module.exports = {
  mode: mode,
  module: {
    rules: [
      {
        test: /\.styl$/,
        loader: ['style-loader', 'css-loader', 'stylus-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [require('@babel/plugin-proposal-object-rest-spread')],
          },
        },
      },
      {
        test: /\.pug$/,
        oneOf: [
          // this applies to `<template lang="pug">` in Vue components
          {
            resourceQuery: /^\?vue/,
            use: ['pug-plain-loader'],
          },
          // this applies to pug imports inside JavaScript
          {
            use: [
              'raw-loader',
              {
                loader: 'pug-plain-loader',
                options: {
                  data: { mode: mode },
                  pretty: true,
                },
              },
            ],
          },
        ],
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(eot|ttf|woff2?)(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
        use: [
          {
            loader: 'url-loader',
          },
        ],
      },
    ],
  },
  entry: {
    background: ['idempotent-babel-polyfill', './src/background/background.js'],
    popup: ['idempotent-babel-polyfill', './src/popup/popup.js'],
    dashboard: ['idempotent-babel-polyfill', './src/dashboard/dashboard.js'],
    content_youtube: [
      'idempotent-babel-polyfill',
      './src/content_scripts/content_youtube.js',
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/index.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'popup/index.html',
      template: 'src/popup/popup.pug',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      filename: 'dashboard/index.html',
      template: 'src/dashboard/dashboard.pug',
      inject: false,
    }),
    new VueLoaderPlugin(),
  ],
  devtool: 'cheap-module-source-remap',
};
