/*eslint-env node*/
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

let mode = process.env['PRODUCTION'] ? 'production' : 'development';
module.exports = {
  //optimization: {
  //splitChunks: {
  //chunks: 'all',
  //},
  //},
  mode: mode,
  module: {
    rules: [
      {
        test: /\.styl$/,
        loader: [MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              require('@babel/plugin-proposal-object-rest-spread'),
              require('@babel/plugin-syntax-dynamic-import'),
            ],
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
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(eot|ttf|woff2?)(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 50000,
            },
          },
        ],
      },
    ],
  },
  entry: {
    background: ['./src/background/background.js'],
    popup: ['./src/popup/popup.js'],
    dashboard: ['./src/dashboard/dashboard.js'],
    content_youtube: ['./src/content_scripts/content_youtube.js'],
    content_medium: ['./src/content_scripts/content_medium.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: '[name]/index.js',
  },
  plugins: [
    new LodashModuleReplacementPlugin({
      shorthands: true,
      collections: true,
      paths: true,
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new HtmlWebpackPlugin({
      filename: 'popup/index.html',
      template: 'src/popup/popup.pug',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      filename: 'dashboard/index.html',
      template: 'src/dashboard/dashboard.pug',
      chunks: ['dashboard'],
    }),
    new VueLoaderPlugin(),
    new webpack.EnvironmentPlugin({
      NODE_ENV: mode, // use 'development' unless process.env.NODE_ENV is defined
    }),
  ],
  devtool: 'cheap-module-eval-source-map',
  watchOptions: {
    poll: true,
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true, // set to true if you want JS source maps
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      minChunks: 1,
      maxAsyncRequests: 15,
      maxInitialRequests: 9,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
