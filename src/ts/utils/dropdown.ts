/**
 * Creates a dropdown menu with hover, click, keyboard, and accessibility support.
 * @param toggle - The element (or ID) that toggles the dropdown
 * @param menu - The dropdown menu element (or ID)
 * @param options - Configuration options for the dropdown
 */
export function createDropdown(
  toggle: string | HTMLElement,
  menu: string | HTMLElement,
  options: {
    closeOnClickOutside?: boolean;
    onToggle?: (isOpen: boolean) => void;
  } = {},
) {
  const dropdownToggle = typeof toggle === 'string' ? document.getElementById(toggle) : toggle;
  const dropdownMenu = typeof menu === 'string' ? document.getElementById(menu) : menu;

  if (!dropdownMenu || !dropdownToggle) return;

  const showDropdown = () => {
    dropdownMenu.classList.remove('opacity-0', 'invisible', '-translate-y-2');
    dropdownMenu.classList.add('opacity-100', 'visible', 'translate-y-0');
    dropdownToggle.setAttribute('aria-expanded', 'true');
    options.onToggle?.(true);
  };

  const hideDropdown = () => {
    dropdownMenu.classList.remove('opacity-100', 'visible', 'translate-y-0');
    dropdownMenu.classList.add('opacity-0', 'invisible', '-translate-y-2');
    dropdownToggle.setAttribute('aria-expanded', 'false');
    options.onToggle?.(false);
  };

  const isDropdownOpen = () => {
    return dropdownToggle.getAttribute('aria-expanded') === 'true';
  };

  // Hover support
  dropdownToggle.addEventListener('mouseenter', showDropdown);
  dropdownMenu.addEventListener('mouseenter', showDropdown);
  dropdownToggle.addEventListener('mouseleave', hideDropdown);
  dropdownMenu.addEventListener('mouseleave', hideDropdown);

  // Click support
  dropdownToggle.addEventListener('click', () => {
    if (isDropdownOpen()) {
      hideDropdown();
    } else {
      showDropdown();
    }
  });

  // Keyboard support: Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isDropdownOpen()) {
      hideDropdown();
    }
  });

  // Close when clicking outside (if enabled)
  if (options.closeOnClickOutside !== false) {
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (isDropdownOpen() && !dropdownMenu.contains(target) && !dropdownToggle.contains(target)) {
        hideDropdown();
      }
    });
  }
}
