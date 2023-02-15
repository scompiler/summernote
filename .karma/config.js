var webpackConfig = require('../config/webpack.karma.js');

module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'webpack', 'detectBrowsers', ],
    colors: true,
    logLevel: config.LOG_INFO,

    files: [
      { pattern: '../src/js/**/*.js' },
      { pattern: '../test/**/*.spec.js' },
      { pattern: '../src/js/**/*.ts', type: 'js' },
      { pattern: '../test/**/*.spec.ts', type: 'js' }
    ],

    detectBrowsers: {
      enabled: true,
      usePhantomJS: false,
      preferHeadless: true,
      postDetection: function(availableBrowsers) {
        return (config.browsers.length === 0) ? availableBrowsers.slice(0, 1) : [];
      }
    },

    preprocessors: {
      '../src/js/**/*.js': ['webpack', ],
      '../test/**/*.spec.js': ['webpack', ],
      '../src/js/**/*.ts': ['webpack', ],
      '../test/**/*.spec.ts': ['webpack', ],
    },

    webpack: webpackConfig,

    reporters: ['dots'],
    coverageReporter: {
      type: 'lcov',
      dir: '../coverage/',
      includeAllSources: true
    },
    browserNoActivityTimeout: 60000,
  });
};
