document.addEventListener('DOMContentLoaded', () => {
  const dropdownToggle = document.getElementById('burger-dropdown');
  const dropdownMenu = document.getElementById('burger-dropdown-menu');

  if (dropdownMenu && dropdownToggle) {
    const showDropdown = () => {
      dropdownMenu.classList.remove('opacity-0', 'invisible', '-translate-y-2');
      dropdownMenu.classList.add('opacity-100', 'visible', 'translate-y-0');
    };

    const hideDropdown = () => {
      dropdownMenu.classList.remove('opacity-100', 'visible', 'translate-y-0');
      dropdownMenu.classList.add('opacity-0', 'invisible', '-translate-y-2');
    };

    dropdownToggle.addEventListener('mouseenter', showDropdown);
    dropdownMenu.addEventListener('mouseenter', showDropdown);

    dropdownToggle.addEventListener('mouseleave', hideDropdown);
    dropdownMenu.addEventListener('mouseleave', hideDropdown);
  }
});
