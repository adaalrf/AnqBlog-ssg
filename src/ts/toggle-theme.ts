const htmlElement = document.querySelector<HTMLElement>('html');
const toggleThemeBtn = document.querySelector<HTMLElement>('#toggle-theme-btn');
const burgerMenu = document.querySelector<HTMLElement>('#burger-dropdown');
const savedTheme = localStorage.getItem('theme');

const rp = (path: string): string => {
  const fullPath = new URL(path, import.meta.url).pathname;
  const rootPath = new URL(import.meta.url).pathname
    .split('/') // Remove the filename
    .slice(0, -2) // Remove the 'ts' and 'js' directories
    .join('/'); // Join the path back together
  return fullPath.replace(rootPath, '');
};

const sunIconPath = rp('../assets/icons/sun.svg');
const moonIconPath = rp('../assets/icons/moon.svg');
const burgerLightPath = rp('../assets/icons/burger-light.svg');
const burgerDarkPath = rp('../assets/icons/burger-dark.svg');

/**
 * Creates an <img> element for the theme icon.
 * @param {string} iconPath - The path to the icon.
 * @param {string} altText - Alternative text for accessibility.
 * @param {number} height - Height of the image.
 * @param {number} width - Width of the image.
 */
function createIconElement(
  iconPath: string,
  altText: string,
  height: number,
  width: number,
): HTMLImageElement {
  const img = document.createElement('img');
  img.src = iconPath;
  img.alt = altText;
  img.height = height;
  img.width = width;
  return img;
}

/**
 * Sets the theme of the website.
 * @param {'light' | 'dark'} theme - The theme to set.
 */
function setTheme(theme: 'light' | 'dark'): void {
  if (htmlElement && toggleThemeBtn && burgerMenu) {
    // Clear existing content
    toggleThemeBtn.textContent = '';
    burgerMenu.textContent = '';

    if (theme === 'light') {
      htmlElement.classList.replace('dark', 'light');
      toggleThemeBtn.appendChild(
        createIconElement(sunIconPath, 'Sun icon', 24, 24),
      );
      burgerMenu.appendChild(
        createIconElement(burgerLightPath, 'Burger menu', 36, 36),
      );
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.classList.replace('light', 'dark');
      toggleThemeBtn.appendChild(
        createIconElement(moonIconPath, 'Moon icon', 24, 24),
      );
      burgerMenu.appendChild(
        createIconElement(burgerDarkPath, 'Burger menu', 36, 36),
      );
      localStorage.setItem('theme', 'dark');
    }
    toggleThemeBtn.classList.remove('hidden');
  }
}

/**
 * Toggles the theme between light and dark.
 */
function toggleTheme(): void {
  if (htmlElement?.classList.contains('light')) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', toggleTheme);
}

window.addEventListener('DOMContentLoaded', () => {
  setTheme(savedTheme === 'light' ? 'light' : 'dark');
});
