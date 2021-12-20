/*eslint-env node*/

const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

var LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

const PRODUCTION = 'production';
const DEVELOPMENT = 'development';

let mode = process.env['PRODUCTION'] ? PRODUCTION : DEVELOPMENT;

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
    compiler.hooks.done.tap('CleanUpStatsPlugin', (stats) => {
      const children = stats.compilation.children;
      if (Array.isArray(children)) {
        // eslint-disable-next-line no-param-reassign
        stats.compilation.children = children.filter((child) =>
          this.shouldPickStatChild(child)
        );
      }
    });
  }
}

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  pages: {
    dashboard: {
      entry: 'src/dashboard/dashboard.js',
    },
    popup: {
      entry: 'src/popup/popup.js',
    },
  },

  configureWebpack: {
    devtool: 'source-map',

    // Event pages and background/content scripts pages go here
    entry: {
      background: ['./src/background/background.ts'],
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
  },

  transpileDependencies: ['vuetify'],
};
