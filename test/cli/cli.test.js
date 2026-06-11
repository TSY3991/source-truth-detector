'use strict';

const { execSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const BIN = path.resolve(__dirname, '../../bin/source-truth-detector.js');
const FIXTURE_ROOT = path.resolve(__dirname, '../graph/fixtures/simple');
const ENTRY = path.resolve(FIXTURE_ROOT, 'entry.js');
const MULTI_ROOT = path.resolve(__dirname, '../graph/fixtures/multi-entry');
const ENTRY_A = path.resolve(MULTI_ROOT, 'entryA.js');
const ENTRY_B = path.resolve(MULTI_ROOT, 'entryB.js');

function runScan(root, ...entries) {
  const entryFlags = entries.map((e) => `--entry "${e}"`).join(' ');
  return execSync(
    `node "${BIN}" scan "${root}" ${entryFlags}`,
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
  assert.ok(out.includes('Used files                 : 2'), `used count mismatch:\n${out}`);
  assert.ok(out.includes('Total files scanned        : 2'), `total count mismatch:\n${out}`);
  assert.ok(out.includes('Unreferenced files         : 0'), `unreferenced mismatch:\n${out}`);
  assert.ok(out.includes('Coverage                   : 100.0%'), `coverage mismatch:\n${out}`);
});

test('cli scan: simple fixture — POSSIBLE_SOURCE_OF_TRUTH section is present', () => {
  const out = runScan(FIXTURE_ROOT, ENTRY);
  assert.ok(out.includes('POSSIBLE_SOURCE_OF_TRUTH files:'), 'missing POSSIBLE_SOURCE_OF_TRUTH section');
  assert.ok(out.includes('Possible sources of truth  :'), 'missing Possible sources of truth summary line');
});

test('cli scan: exits 1 without --entry flag', () => {
  assert.throws(
    () => execSync(`node "${BIN}" scan "${FIXTURE_ROOT}"`, { encoding: 'utf8', stdio: 'pipe' }),
    { status: 1 }
  );
});

// ── multi-entry ───────────────────────────────────────────────────────────────

test('cli scan: accepts multiple --entry flags and lists entrypoints', () => {
  const out = runScan(MULTI_ROOT, ENTRY_A, ENTRY_B);
  assert.ok(out.includes('entrypoints:'), 'missing entrypoints section');
  assert.ok(out.includes('entryA.js'), 'entryA.js not listed as entrypoint');
  assert.ok(out.includes('entryB.js'), 'entryB.js not listed as entrypoint');
});

test('cli scan: multi-entry — files reachable from either entry are USED', () => {
  const out = runScan(MULTI_ROOT, ENTRY_A, ENTRY_B);
  assert.ok(out.includes('entryA.js'), 'entryA.js USED');
  assert.ok(out.includes('entryB.js'), 'entryB.js USED');
  assert.ok(out.includes('shared.js'), 'shared.js USED');
  assert.ok(out.includes('depA.js'), 'depA.js USED');
  assert.ok(out.includes('depB.js'), 'depB.js USED');
});

test('cli scan: multi-entry — orphan.js is UNREFERENCED, used=5, total=6', () => {
  const out = runScan(MULTI_ROOT, ENTRY_A, ENTRY_B);
  assert.ok(out.includes('Used files                 : 5'), `used count mismatch:\n${out}`);
  assert.ok(out.includes('Total files scanned        : 6'), `total count mismatch:\n${out}`);
  assert.ok(out.includes('Unreferenced files         : 1'), `unreferenced mismatch:\n${out}`);

  const unreferencedSection = out.split('UNREFERENCED files:')[1].split('POSSIBLE_SOURCE_OF_TRUTH files:')[0];
  assert.ok(unreferencedSection.includes('orphan.js'), 'orphan.js not in UNREFERENCED section');
});

test('cli scan: multi-entry — shared.js flagged as POSSIBLE_SOURCE_OF_TRUTH (fan-in 2)', () => {
  const out = runScan(MULTI_ROOT, ENTRY_A, ENTRY_B);
  const sotSection = out.split('POSSIBLE_SOURCE_OF_TRUTH files:')[1].split('Scan Summary:')[0];
  assert.ok(sotSection.includes('shared.js'), 'shared.js not flagged as POSSIBLE_SOURCE_OF_TRUTH');
  assert.ok(sotSection.includes('referenced by 2 files'), 'shared.js fan-in count mismatch');
});
