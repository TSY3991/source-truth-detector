'use strict';

const { execSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const BIN = path.resolve(__dirname, '../../bin/source-truth-detector.js');
const FIXTURE_ROOT = path.resolve(__dirname, '../graph/fixtures/simple');
const ENTRY = path.resolve(FIXTURE_ROOT, 'entry.js');

function runScan(root, entry) {
  return execSync(
    `node "${BIN}" scan "${root}" --entry "${entry}"`,
    { encoding: 'utf8' }
  );
}

test('cli scan: outputs scan root and entrypoint', () => {
  const out = runScan(FIXTURE_ROOT, ENTRY);
  assert.ok(out.includes('scan root'), 'missing scan root line');
  assert.ok(out.includes('entrypoint'), 'missing entrypoint line');
});

test('cli scan: lists USED files section', () => {
  const out = runScan(FIXTURE_ROOT, ENTRY);
  assert.ok(out.includes('USED files'), 'missing USED files section');
  assert.ok(out.includes('entry.js'), 'entry.js not listed');
  assert.ok(out.includes('dep.js'), 'dep.js not listed');
});

test('cli scan: lists UNREFERENCED files section', () => {
  const out = runScan(FIXTURE_ROOT, ENTRY);
  assert.ok(out.includes('UNREFERENCED files'), 'missing UNREFERENCED files section');
});

test('cli scan: Scan Summary contains expected keys', () => {
  const out = runScan(FIXTURE_ROOT, ENTRY);
  assert.ok(out.includes('Scan Summary'), 'missing Scan Summary');
  assert.ok(out.includes('Total files scanned'), 'missing Total files scanned');
  assert.ok(out.includes('Used files'), 'missing Used files');
  assert.ok(out.includes('Unreferenced files'), 'missing Unreferenced files');
  assert.ok(out.includes('Coverage'), 'missing Coverage');
});

test('cli scan: simple fixture — used=2, total=2, unreferenced=0, coverage=100.0%', () => {
  const out = runScan(FIXTURE_ROOT, ENTRY);
  assert.ok(out.includes('Used files          : 2'), `used count mismatch:\n${out}`);
  assert.ok(out.includes('Total files scanned : 2'), `total count mismatch:\n${out}`);
  assert.ok(out.includes('Unreferenced files  : 0'), `unreferenced mismatch:\n${out}`);
  assert.ok(out.includes('Coverage            : 100.0%'), `coverage mismatch:\n${out}`);
});

test('cli scan: exits 1 without --entry flag', () => {
  assert.throws(
    () => execSync(`node "${BIN}" scan "${FIXTURE_ROOT}"`, { encoding: 'utf8', stdio: 'pipe' }),
    { status: 1 }
  );
});
