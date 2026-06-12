'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadConfig, CONFIG_FILENAME } = require('../../src/config/loadConfig');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'stdetector-config-'));
}

test('returns null when no config file exists', () => {
  const dir = makeTmpDir();
  assert.equal(loadConfig(dir), null);
});

test('loads config and resolves entry paths relative to config dir', () => {
  const dir = makeTmpDir();
  fs.writeFileSync(path.join(dir, 'entry.js'), '');
  fs.writeFileSync(
    path.join(dir, CONFIG_FILENAME),
    JSON.stringify({ entry: ['./entry.js'], format: 'json' })
  );

  const config = loadConfig(dir);
  assert.deepEqual(config.entry, [path.join(dir, 'entry.js')]);
  assert.equal(config.format, 'json');
});

test('throws on unknown keys', () => {
  const dir = makeTmpDir();
  fs.writeFileSync(path.join(dir, CONFIG_FILENAME), JSON.stringify({ bogus: true }));
  assert.throws(() => loadConfig(dir), /Unknown key "bogus"/);
});

test('throws when entry is not an array', () => {
  const dir = makeTmpDir();
  fs.writeFileSync(path.join(dir, CONFIG_FILENAME), JSON.stringify({ entry: 'entry.js' }));
  assert.throws(() => loadConfig(dir), /"entry" must be an array/);
});

test('throws on invalid JSON', () => {
  const dir = makeTmpDir();
  fs.writeFileSync(path.join(dir, CONFIG_FILENAME), '{ not json');
  assert.throws(() => loadConfig(dir), /Failed to parse config file/);
});

test('accepts an explicit config path', () => {
  const dir = makeTmpDir();
  const customPath = path.join(dir, 'custom.json');
  fs.writeFileSync(path.join(dir, 'entry.js'), '');
  fs.writeFileSync(customPath, JSON.stringify({ entry: ['./entry.js'] }));

  const config = loadConfig(dir, customPath);
  assert.deepEqual(config.entry, [path.join(dir, 'entry.js')]);
});

test('passes through threshold overrides', () => {
  const dir = makeTmpDir();
  fs.writeFileSync(
    path.join(dir, CONFIG_FILENAME),
    JSON.stringify({
      fanInThreshold: 3,
      fanInRatioThreshold: 0.2,
      minCanonicalExports: 1,
      sharedExportThreshold: 1,
      sharedRatioThreshold: 0.3,
    })
  );

  const config = loadConfig(dir);
  assert.equal(config.fanInThreshold, 3);
  assert.equal(config.fanInRatioThreshold, 0.2);
  assert.equal(config.minCanonicalExports, 1);
  assert.equal(config.sharedExportThreshold, 1);
  assert.equal(config.sharedRatioThreshold, 0.3);
});
