
// const baseConfig = require('./webpack.base');

// module.exports = {
//   ...baseConfig,
//   devtool: 'inline-source-map',
//   mode: 'development',
  
//   devServer: {
//     contentBase: './build',
//     compress: true,
//     port: 9000,
//     hot: true,
//   },
// }


const path = require('path');
const { commonWebpackConfig } = require('@libs/config/webpack-helpers');
const { entries, development } = require('./webpack.part');




module.exports = commonWebpackConfig(__dirname,entries,development);