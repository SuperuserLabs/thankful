/*eslint-env node*/
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

const PRODUCTION = 'production';
const DEVELOPMENT = 'development';

// Cleans up log spam from mini-css-extract-plugin and the like.
// Based on: https://github.com/webpack-contrib/mini-css-extract-plugin/issues/168#issuecomment-420095982
class CleanUpStatsPlugin {
  constructor(name) {
    this.name = name;
  }

  shouldPickStatChild(child) {
    return child.name.indexOf(this.name) !== 0;
  }

  apply(compiler) {
    compiler.hooks.done.tap('CleanUpStatsPlugin', stats => {
      const children = stats.compilation.children;
      if (Array.isArray(children)) {
        // eslint-disable-next-line no-param-reassign
        stats.compilation.children = children.filter(child =>
          this.shouldPickStatChild(child)
        );
      }
    });
  }
}

let mode = process.env['PRODUCTION'] ? PRODUCTION : DEVELOPMENT;
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
        // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: { babelrc: true },
          },
          { loader: 'ts-loader' },
        ],
      },
      {
        test: /\.styl$/,
        loader: [MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { babelrc: true },
        },
      },
      {
        test: /\.pug$/,
        oneOf: [
          // this applies to `<template lang="pug">` in Vue components
          {
            resourceQuery: /^\?vue/,
            use: [
              {
                loader: 'pug-plain-loader',
                options: {
                  data: { mode: mode },
                  pretty: true,
                },
              },
            ],
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
  resolve: {
    extensions: ['.js', '.ts', '.vue'],
    alias: {
      ['~']: path.resolve(__dirname, 'src'),
    },
  },
  entry: {
    background: ['./src/background/background.ts'],
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
    new CleanUpStatsPlugin('mini-css-extract-plugin'),
    new CleanUpStatsPlugin('html-webpack-plugin'),
    // TODO: Detect if webpack is run with --watch, not if the PRODUCTION env variable is set
  ].concat(
    mode === DEVELOPMENT
      ? [
          /* new BundleAnalyzerPlugin() */
        ]
      : []
  ),

  devtool: 'cheap-module-source-map',
  optimization: {
    minimizer: [
      new TerserPlugin({
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
