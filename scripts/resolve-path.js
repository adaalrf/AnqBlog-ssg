/**
 * This is a small helper script to find the project root by looking for a marker file:
 * ('package.json' in my case, but change this as you see fit).
 * The function recursively traverses up the directory tree until it finds the marker file.
 *
 * It also provides a function to resolve paths relative to the project root.
 *
 * __dirname is a global variable in node.js that contains the directory name of the current module.
 * fs is the file system module in node.js
 * and path is the path module in node.js
 *
 * this might differ in other environments.
 *
 * fr = find root
 * rp = relative path
 *
 * use case: Calculate the relative path
 *     const relativePath = rp(outputFilePath, fr('public'));
 **/

const path = require('path');
const fs = require('fs');

// Function to find the project root by looking for a marker file (e.g., package.json)
const findRoot = (dir) => {
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }
  const parentDir = path.dirname(dir);
  if (parentDir === dir) {
    throw new Error('Project root not found');
  }
  return findRoot(parentDir);
};

const projectRoot = findRoot(__dirname);

// Function to resolve paths relative to the project root
const resolvePath = (relativePath) => path.join(projectRoot, relativePath);

// Function to calculate the relative path based on the depth
const calculateRelativePath = (outputFilePath, outputDir) => {
  const relativePath = path.posix.relative(
    path.posix.dirname(outputFilePath),
    outputDir,
  );
  return relativePath ? relativePath + '/' : '';
};

module.exports = {
  fr: resolvePath,
  rp: calculateRelativePath,
};
