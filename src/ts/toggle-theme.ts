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

const sunIcon = `<image src="${rp(
  '../assets/icons/sun.svg',
)}" alt="Sun icon" height="24" width="24" />`;
const moonIcon = `<image src="${rp(
  '../assets/icons/moon.svg',
)}" alt="Moon icon" height="24" width="24" />`;

const burgerLight = `<image src="${rp(
  '../assets/icons/burger-light.svg',
)}" alt="Burger menu" height="36" width="36" />`;
const burgerDark = `<image src="${rp(
  '../assets/icons/burger-dark.svg',
)}" alt="Burger menu" height="36" width="36" />`;

/**
 * Sets the theme of the website.
 * @param {'light' | 'dark'} theme - The theme to set.
 */
function setTheme(theme: 'light' | 'dark'): void {
  if (htmlElement && toggleThemeBtn && burgerMenu) {
    if (theme === 'light') {
      htmlElement.classList.replace('dark', 'light');
      toggleThemeBtn.innerHTML = sunIcon;
      burgerMenu.innerHTML = burgerLight;
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.classList.replace('light', 'dark');
      toggleThemeBtn.innerHTML = moonIcon;
      burgerMenu.innerHTML = burgerDark;
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
