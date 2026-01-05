# Quick Fixes & Easy Wins

These are the easiest improvements you can make right now with high impact.

## 1. Extract Dropdown Logic (15 min)

**Problem**: Duplicate code in `tags-dropdown.ts` and `burger-dropdown.ts`

**Solution**: Create shared utility

```typescript
// src/ts/utils/dropdown.ts
export function createDropdown(
  toggleId: string,
  menuId: string,
  options: { closeOnClickOutside?: boolean } = {}
) {
  const dropdownToggle = document.getElementById(toggleId) as HTMLElement;
  const dropdownMenu = document.getElementById(menuId);

  if (!dropdownMenu || !dropdownToggle) return;

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

  const isDropdownOpen = () => 
    dropdownToggle.getAttribute('aria-expanded') === 'true';

  // Event listeners
  dropdownToggle.addEventListener('mouseenter', showDropdown);
  dropdownMenu.addEventListener('mouseenter', showDropdown);
  dropdownToggle.addEventListener('mouseleave', hideDropdown);
  dropdownMenu.addEventListener('mouseleave', hideDropdown);

  dropdownToggle.addEventListener('click', () => {
    if (isDropdownOpen()) hideDropdown();
    else showDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isDropdownOpen()) {
      hideDropdown();
    }
  });

  if (options.closeOnClickOutside !== false) {
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
}
```

Then update both files to use it.

---

## 2. Add Config Validation (10 min)

**Problem**: Invalid config can cause cryptic errors

**Solution**: Add validation at startup

```javascript
// scripts/validate-config.js
import config from './config.js';

export function validateConfig() {
  const errors = [];

  // Required fields
  if (!config.siteName) errors.push('siteName is required');
  if (!config.siteUrl) errors.push('siteUrl is required');
  if (!config.postsPerPage || config.postsPerPage < 1) {
    errors.push('postsPerPage must be >= 1');
  }

  // URL validation
  try {
    new URL(config.siteUrl);
  } catch {
    errors.push(`siteUrl must be a valid URL: ${config.siteUrl}`);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}
```

Add to `build.js`:
```javascript
import { validateConfig } from './scripts/validate-config.js';
// At the start of the async function:
validateConfig();
```

---

## 3. Extract Constants (5 min)

**Problem**: Magic numbers scattered throughout

**Solution**: Create constants file

```javascript
// scripts/constants.js
export const ICON_SIZES = {
  SMALL: { width: 24, height: 24 },
  MEDIUM: { width: 36, height: 36 },
};

export const DEFAULT_PREVIEW_LENGTH = 200;
export const DEFAULT_POSTS_PER_PAGE = 5;
export const DEFAULT_TITLE_TRUNCATION = 25;
```

---

## 4. Improve Error Messages (10 min)

**Problem**: Some errors lack context

**Solution**: Add file context to errors

```javascript
// In scripts/blog/posts.js, around line 78:
if (!postContentElement) {
  throw new Error(
    `Post template must contain #post-content element\n` +
    `  Template: ${postTemplatePath}\n` +
    `  Post: ${post.htmlFileName || 'unknown'}\n` +
    `  Title: ${post.title || 'Untitled'}`
  );
}
```

---

## 5. Add Development Watch Mode (20 min)

**Problem**: Manual rebuilds during development

**Solution**: Add file watching

```javascript
// scripts/watch.js
import chokidar from 'chokidar';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const watchPaths = [
  'src/**/*',
  'scripts/**/*',
  'tailwind.config.js',
  'webpack.config.js',
];

let isBuilding = false;
let buildTimeout;

chokidar.watch(watchPaths).on('all', () => {
  if (isBuilding) return;
  
  clearTimeout(buildTimeout);
  buildTimeout = setTimeout(async () => {
    isBuilding = true;
    console.log('\n🔄 File changed, rebuilding...\n');
    try {
      await execAsync('node build.js');
      console.log('\n✅ Build complete!\n');
    } catch (error) {
      console.error('\n❌ Build failed:', error.message);
    } finally {
      isBuilding = false;
    }
  }, 500); // Debounce 500ms
});

console.log('👀 Watching for changes...');
```

Add to package.json:
```json
{
  "scripts": {
    "watch": "node scripts/watch.js"
  }
}
```

Install: `npm install --save-dev chokidar`

---

## 6. Add Build Progress Indicator (15 min)

**Problem**: Long builds feel unresponsive

**Solution**: Use progress bar

```javascript
// In build.js
import cliProgress from 'cli-progress';

const progressBar = new cliProgress.SingleBar({
  format: 'Building |{bar}| {percentage}% | {value}/{total} steps',
}, cliProgress.Presets.shades_classic);

const steps = [
  'Generating imports',
  'Bundling code',
  'Copying assets',
  'Generating content',
  'Processing CSS',
];

progressBar.start(steps.length, 0);

// After each step:
progressBar.increment();

// At the end:
progressBar.stop();
```

Install: `npm install --save-dev cli-progress`

---

## 7. Fix TypeScript Strict Mode (5 min)

**Problem**: TypeScript config could be stricter

**Solution**: Update tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 8. Add RSS Feed (30 min)

**Problem**: No RSS feed for blog

**Solution**: Generate RSS.xml

```javascript
// scripts/generate-rss.js
import { formatDateISO } from './utils/date-utils.js';
import config from './config.js';

export function generateRSSFeed(posts) {
  const items = posts.slice(0, 20).map(post => {
    const url = `${config.siteUrl}/blog/posts/${post.htmlFileName}`;
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.previewContent || '')}</description>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(config.siteName)}</title>
    <link>${config.siteUrl}</link>
    <description>${escapeXml(config.siteDescription)}</description>
    <language>${config.siteLanguage}</language>
    ${items}
  </channel>
</rss>`;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

Add to `generate.js`:
```javascript
import { generateRSSFeed } from './generate-rss.js';
// After processing posts:
const rssContent = generateRSSFeed(fullPosts);
writeFileContent(
  path.join(config.publicContentOutputDirectory, 'rss.xml'),
  rssContent
);
```

---

## Priority Order

1. **Config Validation** (10 min) - Prevents user errors
2. **Extract Constants** (5 min) - Improves maintainability  
3. **Extract Dropdown Logic** (15 min) - Reduces duplication
4. **Improve Error Messages** (10 min) - Better debugging
5. **TypeScript Strict Mode** (5 min) - Catches bugs early
6. **Build Progress** (15 min) - Better UX
7. **Watch Mode** (20 min) - Better DX
8. **RSS Feed** (30 min) - Feature addition

Total time: ~2 hours for all improvements

