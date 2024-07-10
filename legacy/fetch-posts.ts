/**
 * Fetches the HTML content of a post by filename and extracts the content of an element with the specified ID.
 * @param {string} filename - The filename of the post to fetch.
 * @param {string} targetId - The ID of the element to extract content from.
 * @returns {Promise<string>} - The text content of the target element, or an error message.
 */
async function fetchPostContent(
  filename: string,
  targetId: string,
): Promise<string> {
  try {
    const response = await fetch(`posts/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
    }

    const content = await response.text();
    if (!content) {
      return 'No content fetched';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const targetElement = doc.getElementById(targetId);

    if (targetElement) {
      return targetElement.innerHTML; // Changed to innerHTML to keep HTML structure
    } else {
      return `Element with ID "${targetId}" not found.`;
    }
  } catch (error) {
    console.error('Error fetching or parsing content:', error);
    return 'An error occurred while fetching or parsing content.';
  }
}

/**
 * Adds click event listeners to post links,
 * fetches the post content,
 * and updates the post content display.
 */
async function generatePostLinks() {
  const postLinksContainer = document.getElementById('post-links-div');
  if (!postLinksContainer) {
    console.error('Post links container not found');
    return;
  }

  const links =
    postLinksContainer.querySelectorAll<HTMLAnchorElement>('.preview-link');
  links.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const filename = link.getAttribute('data-file');
      const targetId = link.getAttribute('data-target');
      if (filename && targetId) {
        const content = await fetchPostContent(filename, 'post-content');
        const postContentContainer = document.getElementById(targetId);
        if (postContentContainer) {
          postContentContainer.innerHTML = content; // Update content
        } else {
          console.error('Post content container not found');
        }
      } else {
        console.error('Filename or target ID not found on link');
      }
    });
  });
}

// Initialize the script when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  generatePostLinks();
});
