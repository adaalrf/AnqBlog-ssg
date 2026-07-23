import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

test('layout-template: mobile dropdown menu has stable list structure', async () => {
  const templatePath = path.join(process.cwd(), 'templates', 'layout-template.html');
  const template = await fs.readFile(templatePath, 'utf8');
  const dom = new JSDOM(template);
  const document = dom.window.document;

  const menuDropdown = document.querySelector('[data-hook="menu-dropdown"]');
  assert.ok(menuDropdown, 'menu dropdown must exist');

  const menuItems = Array.from(menuDropdown.children);
  assert.equal(menuItems.length, 5);
  for (const item of menuItems) {
    assert.equal(item.tagName, 'LI');
    assert.ok(item.classList.contains('dropdown-item'));
    assert.equal(item.querySelectorAll('li').length, 0);
  }
});
