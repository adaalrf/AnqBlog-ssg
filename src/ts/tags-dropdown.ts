import { createDropdown } from './utils/dropdown';

document.addEventListener('DOMContentLoaded', () => {
  const dropdownToggle = document.getElementById('tags-dropdown') as HTMLAnchorElement;
  const dropdownMenu = document.getElementById('tags-dropdown-menu');

  if (dropdownMenu && dropdownToggle) {
    // Create the dropdown with shared logic
    void createDropdown('tags-dropdown', 'tags-dropdown-menu');

    // Tags dropdown has special behavior: it's a link that should navigate
    // The dropdown is just a preview/quick access, clicking should navigate
    dropdownToggle.addEventListener('click', () => {
      // Don't prevent default - always allow navigation to /blog/tags
      // The dropdown will close automatically via the shared logic
    });

    // Keyboard support: Enter and Space keys (additional to shared Escape key)
    dropdownToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        // Allow default behavior (navigation) for Enter/Space
        // The dropdown state is managed by the shared logic
      }
    });
  }
});
