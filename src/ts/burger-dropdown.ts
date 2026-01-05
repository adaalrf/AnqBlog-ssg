document.addEventListener('DOMContentLoaded', () => {
  const dropdownToggle = document.getElementById('burger-dropdown') as HTMLButtonElement;
  const dropdownMenu = document.getElementById('burger-dropdown-menu');

  if (dropdownMenu && dropdownToggle) {
    const showDropdown = () => {
      dropdownMenu.classList.remove('opacity-0', 'invisible', '-translate-y-2');
      dropdownMenu.classList.add('opacity-100', 'visible', 'translate-y-0');
      dropdownToggle.setAttribute('aria-expanded', 'true');
    };

    const hideDropdown = () => {
      dropdownMenu.classList.remove('opacity-100', 'visible', 'translate-y-0');
      dropdownMenu.classList.add('opacity-0', 'invisible', '-translate-y-2');
      dropdownToggle.setAttribute('aria-expanded', 'false');
    };

    const isDropdownOpen = () => {
      return dropdownToggle.getAttribute('aria-expanded') === 'true';
    };

    dropdownToggle.addEventListener('mouseenter', showDropdown);
    dropdownMenu.addEventListener('mouseenter', showDropdown);

    dropdownToggle.addEventListener('mouseleave', hideDropdown);
    dropdownMenu.addEventListener('mouseleave', hideDropdown);

    // Keyboard and click support
    dropdownToggle.addEventListener('click', () => {
      if (isDropdownOpen()) {
        hideDropdown();
      } else {
        showDropdown();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isDropdownOpen()) {
        hideDropdown();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (
        isDropdownOpen() &&
        !dropdownMenu.contains(target) &&
        !dropdownToggle.contains(target)
      ) {
        hideDropdown();
      }
    });
  }
});
