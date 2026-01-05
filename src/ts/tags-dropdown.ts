document.addEventListener('DOMContentLoaded', () => {
  const dropdownToggle = document.getElementById('tags-dropdown') as HTMLAnchorElement;
  const dropdownMenu = document.getElementById('tags-dropdown-menu');

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

    // Keyboard support: Enter and Space keys
    dropdownToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isDropdownOpen()) {
          hideDropdown();
        } else {
          showDropdown();
        }
      }
    });

    // Click support: always allow navigation to tags page
    // The dropdown is just a preview/quick access, clicking the link should navigate
    dropdownToggle.addEventListener('click', (e) => {
      // Don't prevent default - always allow navigation to /blog/tags
      // Hide dropdown if it's open, but still navigate
      if (isDropdownOpen()) {
        hideDropdown();
      }
      // Let the click proceed to navigate to /blog/tags
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
