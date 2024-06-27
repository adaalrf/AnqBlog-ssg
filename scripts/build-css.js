const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const { fr, rp } = require('./resolve-path');

// Define input and output paths
const inputFilePath = fr('src/styles/tailwind.css');
const outputFilePath = fr('public/styles/styles.css');

// Ensure the output directory exists
if (!fs.existsSync(path.dirname(outputFilePath))) {
  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
}

// Read the input CSS file
fs.readFile(inputFilePath, 'utf8', (err, css) => {
  if (err) throw err;

  // Process the CSS with PostCSS, Tailwind CSS, and Autoprefixer
  postcss([tailwindcss, autoprefixer])
    .process(css, { from: inputFilePath, to: outputFilePath })
    .then((result) => {
      // Write the processed CSS to the output file
      fs.writeFile(outputFilePath, result.css, () =>
        console.log(`Generated ${outputFilePath}`),
      );
      if (result.map) {
        fs.writeFile(
          outputFilePath + '.map',
          result.map.toString(),
          () => true,
        );
      }
    })
    .catch((error) => console.error('Failed to process CSS:', error));
});
