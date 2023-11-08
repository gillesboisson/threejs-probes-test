// const path = require('path')

// module.exports = {
//   extends: "./webpack.config.base.js",
//   mode: 'production',
//   entry: {
//     index: './index.ts',
//     //index_worker: './index_worker.ts',
//   },
//   output: {
//     path: path.resolve(__dirname, 'build'),
//     filename: 'bundle.js',
//     publicPath: '/',
    
//   },
//   performance: {
//     maxEntrypointSize: 1024000,
//     maxAssetSize: 1024000
//   },
// }

const path = require('path');
const { commonWebpackConfig } = require('@libs/config/webpack-helpers');
const { entries, production } = require('./webpack.part');

