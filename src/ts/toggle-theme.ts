const htmlElement = document.querySelector<HTMLElement>('html');
const toggleThemeBtn = document.querySelector<HTMLElement>('#toggle-theme-btn');
const toggleThemeBtnMobile = document.querySelector<HTMLElement>('#toggle-theme-btn-mobile');
const burgerMenu = document.querySelector<HTMLElement>('#burger-dropdown');
const savedTheme = localStorage.getItem('theme');

// Use absolute paths from site root for static assets
// This works regardless of the current page's location
const sunIconPath = '/assets/icons/sun.svg';
const moonIconPath = '/assets/icons/moon.svg';
const burgerLightPath = '/assets/icons/burger-light.svg';
const burgerDarkPath = '/assets/icons/burger-dark.svg';

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
  if (htmlElement && burgerMenu) {
    // Clear existing content
    if (toggleThemeBtn) {
      toggleThemeBtn.textContent = '';
    }
    if (toggleThemeBtnMobile) {
      toggleThemeBtnMobile.textContent = '';
    }
    burgerMenu.textContent = '';

    if (theme === 'light') {
      htmlElement.classList.replace('dark', 'light');
      if (toggleThemeBtn) {
        toggleThemeBtn.appendChild(createIconElement(sunIconPath, 'Sun icon', 24, 24));
        toggleThemeBtn.classList.remove('hidden');
      }
      if (toggleThemeBtnMobile) {
        toggleThemeBtnMobile.appendChild(createIconElement(sunIconPath, 'Sun icon', 24, 24));
        toggleThemeBtnMobile.classList.remove('hidden');
      }
      burgerMenu.appendChild(createIconElement(burgerLightPath, 'Burger menu', 36, 36));
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.classList.replace('light', 'dark');
      if (toggleThemeBtn) {
        toggleThemeBtn.appendChild(createIconElement(moonIconPath, 'Moon icon', 24, 24));
        toggleThemeBtn.classList.remove('hidden');
      }
      if (toggleThemeBtnMobile) {
        toggleThemeBtnMobile.appendChild(createIconElement(moonIconPath, 'Moon icon', 24, 24));
        toggleThemeBtnMobile.classList.remove('hidden');
      }
      burgerMenu.appendChild(createIconElement(burgerDarkPath, 'Burger menu', 36, 36));
      localStorage.setItem('theme', 'dark');
    }
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

// Initialize theme on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTheme(savedTheme === 'light' ? 'light' : 'dark');
  });
} else {
  // DOM already loaded
  setTheme(savedTheme === 'light' ? 'light' : 'dark');
}

if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', () => {
    toggleTheme();
  });
}

if (toggleThemeBtnMobile) {
  toggleThemeBtnMobile.addEventListener('click', () => {
    toggleTheme();
  });
}
