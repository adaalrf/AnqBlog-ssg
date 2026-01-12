const htmlElement = document.documentElement;
const toggleButtons = Array.from(
  document.querySelectorAll<HTMLElement>('[data-hook="theme-toggle"], [data-hook="theme-toggle-mobile"]'),
);
const menuToggle = document.querySelector<HTMLElement>('[data-hook="menu-toggle"]');

const burgerIcons = {
  light: '/assets/icons/burger-light.svg',
  dark: '/assets/icons/burger-dark.svg',
};

const themeLabel = (theme: string) => `Theme: ${theme}`;

/** Return the configured theme names from the DOM (fallback to defaults). */
const getThemes = (): string[] => {
  const raw = htmlElement.dataset.themes ?? 'dark light rose mono';
  const parsed = raw.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : ['dark', 'light'];
};

/** Determine the default theme stored on the document or first configured theme. */
const getDefaultTheme = (): string => {
  const defaultTheme = htmlElement.dataset.theme;
  return defaultTheme ?? getThemes()[0];
};

/** Cycle to the next theme in the provided list. */
const cycleTheme = (current: string, themes: string[]): string => {
  const currentIndex = themes.indexOf(current);
  return themes[(currentIndex + 1) % themes.length];
};

/** Update the burger menu icon to match the current theme lightness. */
const renderBurgerIcon = (theme: string): void => {
  if (!menuToggle) return;
  const isLight = theme === 'light' || theme === 'mono';
  const iconPath = isLight ? burgerIcons.light : burgerIcons.dark;
  menuToggle.innerHTML = '';
  const img = document.createElement('img');
  img.src = iconPath;
  img.alt = 'Menu';
  img.width = 36;
  img.height = 36;
  menuToggle.appendChild(img);
};

/** Render the textual theme label on each toggle button. */
const renderToggleLabels = (theme: string): void => {
  toggleButtons.forEach((btn) => {
    btn.textContent = '';
    btn.textContent = themeLabel(theme);
    btn.setAttribute('aria-label', `Current theme: ${theme}. Click to cycle themes.`);
    btn.classList.remove('hidden');
  });
};

const applyTheme = (theme: string) => {
  htmlElement.dataset.theme = theme;
  renderToggleLabels(theme);
  renderBurgerIcon(theme);
  localStorage.setItem('theme', theme);
};

const getStoredTheme = (themes: string[]): string | null => {
  const stored = localStorage.getItem('theme');
  return stored && themes.includes(stored) ? stored : null;
};

const initTheme = () => {
  const themes = getThemes();
  const stored = getStoredTheme(themes);
  const defaultTheme = stored ?? getDefaultTheme();
  applyTheme(defaultTheme);
};

const handleToggle = () => {
  const themes = getThemes();
  const current = htmlElement.dataset.theme ?? getDefaultTheme();
  const next = cycleTheme(current, themes);
  applyTheme(next);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}

toggleButtons.forEach((btn) => btn.addEventListener('click', handleToggle));
