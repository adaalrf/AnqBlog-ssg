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

    dropdownToggle.addEventListener('mouseenter', showDropdown);
    dropdownMenu.addEventListener('mouseenter', showDropdown);

    dropdownToggle.addEventListener('mouseleave', hideDropdown);
    dropdownMenu.addEventListener('mouseleave', hideDropdown);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdownToggle.getAttribute('aria-expanded') === 'true') {
        hideDropdown();
      }
    });
  }
});
