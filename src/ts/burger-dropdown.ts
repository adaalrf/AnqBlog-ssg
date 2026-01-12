import { createDropdown } from './utils/dropdown';

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector<HTMLElement>('[data-hook="menu-toggle"]');
  const menu = document.querySelector<HTMLElement>('[data-hook="menu-dropdown"]');
  if (!toggle || !menu) return;
  void createDropdown(toggle, menu);
});
