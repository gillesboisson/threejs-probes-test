module.exports = {
  entries: {
    entry: {
      index: './index.ts',
      //index_worker: './index_worker.ts',
    },
  },
  development: {
    devtool: 'inline-source-map',
    mode: 'development',
  },
  production: {
    mode: 'production',
  }
};