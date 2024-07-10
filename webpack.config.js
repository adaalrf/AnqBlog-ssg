import { resolve as _resolve } from 'path';

export default {
  entry: './src/ts/main.ts', // Entry point for the bundle
  mode: 'production', // Set the mode to production for optimization
  optimization: {
    usedExports: true, // Enable tree shaking to remove unused exports
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // Apply this rule to .ts files
        use: 'ts-loader', // Use ts-loader to handle TypeScript files
        exclude: /node_modules/, // Exclude node_modules from being processed
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'], // Resolve these extensions in imports
  },
  output: {
    filename: 'bundle.js', // Output bundle filename
    path: _resolve('public/js'), // Output path for the bundle
  },
};
