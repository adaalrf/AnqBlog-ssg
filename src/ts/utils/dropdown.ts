/**
 * Creates a dropdown menu with hover, click, keyboard, and accessibility support.
 * @param toggleId - The ID of the element that toggles the dropdown
 * @param menuId - The ID of the dropdown menu element
 * @param options - Configuration options for the dropdown
 */
export function createDropdown(
  toggleId: string,
  menuId: string,
  options: {
    closeOnClickOutside?: boolean;
    onToggle?: (isOpen: boolean) => void;
  } = {},
) {
  const dropdownToggle = document.getElementById(toggleId) as HTMLElement;
  const dropdownMenu = document.getElementById(menuId);

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
