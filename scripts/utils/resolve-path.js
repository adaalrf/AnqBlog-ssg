import path from 'path';
import fs from 'fs';

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

const projectRoot = findRoot(process.cwd());

// Function to resolve paths relative to the project root
export const fr = (relativePath) => path.join(projectRoot, relativePath);

// Function to calculate the relative path based on the depth
export const rp = (outputDir, file, baseDir) => {
  const outputFilePath = path.join(outputDir, file);
  const relativePath = path.posix.relative(
    path.posix.dirname(outputFilePath),
    baseDir,
  );
  return relativePath ? relativePath + '/' : '';
};
