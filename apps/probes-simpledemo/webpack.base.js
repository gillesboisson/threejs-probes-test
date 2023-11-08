const path = require('path')

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: 'production',
  entry: {
    index: './index.ts',
    //index_worker: './index_worker.ts',
  },
  node: {
    fs: 'empty'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['raw-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  
    
  },
  // fallback: {
  //   "fs": false,
  //   "os": false,
  //   "path": false,
  // },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build/'),
    publicPath: '/', 
  },

  
}