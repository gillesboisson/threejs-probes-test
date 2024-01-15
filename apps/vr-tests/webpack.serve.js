const path = require('path');
const { commonWebpackConfig, serverPartConfig } = require('@libs/config/webpack-helpers');
const { entries, development } = require('./webpack.part');




module.exports = commonWebpackConfig(__dirname,entries,development,serverPartConfig(__dirname));



// module.exports = {
//   context: path.resolve(__dirname, 'src'),
//   devServer: {
//     contentBase: path.join(__dirname, 'build'),
//     compress: false,
//     port: 8080,
//   },
//   entry: {
//     index: './index.ts',
//     //index_worker: './index_worker.ts',
//   },

//   devtool: 'inline-source-map',
//   mode: 'development',
//   module: {
//     rules: [
//       {
//         test: /\.tsx?$/,
//         use: 'ts-loader',
//         exclude: /node_modules/,
//       },
//       {
//         test: /\.(glsl|vs|fs|vert|frag)$/,
//         exclude: /node_modules/,
//         use: ['raw-loader', 'glslify-loader'],
//       },
//     ],
//   },
//   resolve: {
//     extensions: ['.ts', '.js'],
//   },
//   output: {
//     filename: '[name].js',
//     path: path.resolve(__dirname, 'build/'),
//     publicPath: '/', 
//   },
//   // devServer: {
//   //   stats: "errors-only",
//   //   overlay: true,
//   //   host: process.env.HOST, // Defaults to `localhost`
//   //   port: process.env.PORT, // Defaults to 8080
//   //   // open: true, // Open the page in browser
//   //
//   // }
// };
