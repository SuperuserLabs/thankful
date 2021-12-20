/*eslint-env node*/

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          esmodules: true,
        },
      },
    ],
    '@babel/typescript',
  ],

  plugins: [
    'lodash',
    '@babel/plugin-transform-runtime',
    [
      'transform-imports',
      {
        vuetify: {
          transform: 'vuetify/es5/components/${member}',
          preventFullImport: true,
        },
        lodash: {
          transform: 'lodash/${member}',
          preventFullImport: true,
        },
        '@fortawesome/free-solid-svg-icons': {
          transform: '@fortawesome/free-solid-svg-icons/${member}',
          skipDefaultConversion: true,
        },
        '@fortawesome/free-brands-svg-icons': {
          transform: '@fortawesome/free-brands-svg-icons/${member}',
          skipDefaultConversion: true,
        },
      },
    ],
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-syntax-dynamic-import',
    '@vue/cli-plugin-babel/preset',
  ],
};
