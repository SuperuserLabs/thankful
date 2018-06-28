const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  mode: process.env['PRODUCTION'] ? 'production' : 'development',
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
        oneOf: [
          // this applies to `<template lang="pug">` in Vue components
          {
            resourceQuery: /^\?vue/,
            use: ['pug-plain-loader'],
          },
          // this applies to pug imports inside JavaScript
          {
            use: ['raw-loader', 'pug-plain-loader'],
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
    ],
  },
  entry: {
    background: ['./src/background/background.js'],
    popup: ['./src/popup/popup.js'],
    dashboard: ['./src/dashboard/dashboard.js'],
    content_youtube: ['./src/content_scripts/content_youtube.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/index.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'popup/index.html',
      template: 'src/popup/popup.pug',
      inject: true,
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
