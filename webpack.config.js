import { resolve } from 'path';

export default {
  entry: './src/ts/main.ts',
  mode: 'production',
  optimization: {
    usedExports: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: resolve('public/js'),
  },
};
