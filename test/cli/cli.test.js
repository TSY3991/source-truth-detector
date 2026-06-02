'use strict';

const { execSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const BIN = path.resolve(__dirname, '../../bin/source-truth-detector.js');
const FIXTURE_ROOT = path.resolve(__dirname, '../graph/fixtures/simple');
const ENTRY = path.resolve(FIXTURE_ROOT, 'entry.js');

test('cli scan: outputs scan root and entrypoint', () => {
  const out = execSync(
    `node "${BIN}" scan "${FIXTURE_ROOT}" --entry "${ENTRY}"`,
    { encoding: 'utf8' }
  );
  assert.ok(out.includes('scan root'), 'missing scan root line');
  assert.ok(out.includes('entrypoint'), 'missing entrypoint line');
});

test('cli scan: lists USED files', () => {
  const out = execSync(
    `node "${BIN}" scan "${FIXTURE_ROOT}" --entry "${ENTRY}"`,
    { encoding: 'utf8' }
  );
  assert.ok(out.includes('USED files'), 'missing USED files section');
  assert.ok(out.includes('entry.js'), 'entry.js not listed');
  assert.ok(out.includes('dep.js'), 'dep.js not listed');
});

test('cli scan: total used count is 2', () => {
  const out = execSync(
    `node "${BIN}" scan "${FIXTURE_ROOT}" --entry "${ENTRY}"`,
    { encoding: 'utf8' }
  );
  assert.ok(out.includes('total used : 2'), `unexpected total: ${out}`);
});

test('cli scan: exits 1 without --entry flag', () => {
  assert.throws(
    () => execSync(`node "${BIN}" scan "${FIXTURE_ROOT}"`, { encoding: 'utf8', stdio: 'pipe' }),
    { status: 1 }
  );
});
