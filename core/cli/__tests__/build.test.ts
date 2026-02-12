import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const buildScriptPath = path.join(process.cwd(), 'dist', 'core', 'cli', 'build.js');
const nodeExecPath = process.execPath;

const runBuildCli = async (
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> => {
  try {
    const { stdout, stderr } = await execFileAsync(nodeExecPath, [buildScriptPath, ...args], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, NODE_ENV: 'test' },
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    return {
      code: typeof err.code === 'number' ? err.code : 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
};

test('build cli: rejects unsupported flags', { timeout: 120_000 }, async () => {
  const result = await runBuildCli(['--dry-run']);
  assert.equal(result.code, 1);
});

test('build cli: succeeds with no flags', { timeout: 180_000 }, async () => {
  const result = await runBuildCli([]);
  assert.equal(result.code, 0);
});
