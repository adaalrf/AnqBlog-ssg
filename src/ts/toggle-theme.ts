const htmlElement = document.querySelector<HTMLElement>('html');
const toggleThemeBtn = document.querySelector<HTMLElement>('#toggle-theme-btn');
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

function setTheme(theme: 'light' | 'dark'): void {
  if (htmlElement && toggleThemeBtn) {
    if (theme === 'light') {
      htmlElement.classList.replace('dark', 'light');
      toggleThemeBtn.innerHTML = sunIcon;
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.classList.replace('light', 'dark');
      toggleThemeBtn.innerHTML = moonIcon;
      localStorage.setItem('theme', 'dark');
    }
    toggleThemeBtn.classList.replace('hidden', 'block');
  }
}

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
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');
});
