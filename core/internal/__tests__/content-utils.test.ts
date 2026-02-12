import assert from 'node:assert/strict';
import { test } from 'node:test';
import { injectContentIntoTemplate, replacePlaceholders } from '../content-utils.js';

test('injectContentIntoTemplate: replaces triple-brace placeholders only', () => {
  const dom = injectContentIntoTemplate('<body><div>{{{content}}}</div><p>{{title}}</p></body>', {
    content: '<span>Injected</span>',
    title: 'Ignored',
  });

  const bodyHtml = dom.window.document.body.innerHTML;
  assert.match(bodyHtml, /<span>Injected<\/span>/);
  assert.match(bodyHtml, /\{\{title\}\}/);
});

test('replacePlaceholders: replaces double-brace placeholders and preserves triple-brace tokens', () => {
  const output = replacePlaceholders(
    'title={{title}} content={{{content}}} missing={{missing}} page={{page}}',
    {
      title: 'Hello',
      content: 'NotUsedHere',
      page: '  /home\n  section  ',
    },
  );

  assert.match(output, /title=Hello/);
  assert.match(output, /content=\{\{\{content\}\}\}/);
  assert.match(output, /missing=/);
  assert.match(output, /page=\/home section/);
});
