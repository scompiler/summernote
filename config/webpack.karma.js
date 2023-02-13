const config = require('./webpack.development');

// Do not include entry - karma-webpack does not support it
delete config.entry;

// Show only errors while using karma
config.stats = 'errors-only';

delete config.externals.bootstrap;

module.exports = config;
