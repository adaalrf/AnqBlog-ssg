import path from 'path';
import { test } from 'node:test';
import assert from 'node:assert';
import { createModuleConfigApi } from '../module-config-api.js';

test('createModuleConfigApi: requireString returns configured string', () => {
  const api = createModuleConfigApi('test', { key: 'value' });
  assert.strictEqual(api.requireString('key'), 'value');
});

test('createModuleConfigApi: requireString throws for missing/invalid string', () => {
  const api = createModuleConfigApi('test', { key: '' });
  assert.throws(() => api.requireString('key'), /\[test\] missing or invalid config key: key/);
});

test('createModuleConfigApi: requireExistingPath returns path when it exists', () => {
  const existingPath = path.join(process.cwd(), 'README.md');
  const api = createModuleConfigApi('test', { existingPath });
  assert.strictEqual(api.requireExistingPath('existingPath'), existingPath);
});

test('createModuleConfigApi: requireExistingPath throws for missing path', () => {
  const missingPath = path.join(process.cwd(), '__missing_config_path__');
  const api = createModuleConfigApi('test', { missingPath });
  assert.throws(
    () => api.requireExistingPath('missingPath'),
    /\[test\] config path does not exist: missingPath ->/,
  );
});

test('createModuleConfigApi: requireInteger returns integer and honors min', () => {
  const api = createModuleConfigApi('test', { count: 3 });
  assert.strictEqual(api.requireInteger('count', 2), 3);
});

test('createModuleConfigApi: requireInteger throws for non-integer', () => {
  const api = createModuleConfigApi('test', { count: 1.5 });
  assert.throws(
    () => api.requireInteger('count'),
    /\[test\] missing or invalid integer config key: count/,
  );
});

test('createModuleConfigApi: requireInteger throws when below min', () => {
  const api = createModuleConfigApi('test', { count: 1 });
  assert.throws(
    () => api.requireInteger('count', 2),
    /\[test\] config key must be >= 2: count -> 1/,
  );
});

test('createModuleConfigApi: optionalPositiveNumber returns undefined when key is absent', () => {
  const api = createModuleConfigApi('test', {});
  assert.strictEqual(api.optionalPositiveNumber('size'), undefined);
});

test('createModuleConfigApi: optionalPositiveNumber returns positive number', () => {
  const api = createModuleConfigApi('test', { size: 10 });
  assert.strictEqual(api.optionalPositiveNumber('size'), 10);
});

test('createModuleConfigApi: optionalPositiveNumber throws on invalid value', () => {
  const api = createModuleConfigApi('test', { size: 0 });
  assert.throws(
    () => api.optionalPositiveNumber('size'),
    /\[test\] optional config key must be a positive number: size/,
  );
});
