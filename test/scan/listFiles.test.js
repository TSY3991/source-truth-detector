'use strict';

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { listFiles } = require('../../src/scan/listFiles');

// helper: create a temp dir tree
function makeTempTree(tree) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'std-test-'));
  function write(base, obj) {
    for (const [name, value] of Object.entries(obj)) {
      const p = path.join(base, name);
      if (typeof value === 'string') {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, value);
      } else {
        fs.mkdirSync(p, { recursive: true });
        write(p, value);
      }
    }
  }
  write(root, tree);
  return root;
}

test('listFiles: returns .js files', () => {
  const root = makeTempTree({
    'a.js': '',
    'b.js': '',
  });
  const files = listFiles(root);
  assert.ok(files.some(f => f.endsWith('a.js')));
  assert.ok(files.some(f => f.endsWith('b.js')));
  assert.equal(files.length, 2);
});

test('listFiles: returns .jsx files', () => {
  const root = makeTempTree({
    'Comp.jsx': '',
  });
  const files = listFiles(root);
  assert.equal(files.length, 1);
  assert.ok(files[0].endsWith('Comp.jsx'));
});

test('listFiles: excludes node_modules', () => {
  const root = makeTempTree({
    'a.js': '',
    node_modules: { 'dep.js': '' },
  });
  const files = listFiles(root);
  assert.equal(files.length, 1);
  assert.ok(!files.some(f => f.includes('node_modules')));
});

test('listFiles: excludes .git', () => {
  const root = makeTempTree({
    'a.js': '',
    '.git': { 'config': '' },
  });
  const files = listFiles(root);
  assert.equal(files.length, 1);
});

test('listFiles: excludes dist, build, coverage', () => {
  const root = makeTempTree({
    'a.js': '',
    dist: { 'bundle.js': '' },
    build: { 'out.js': '' },
    coverage: { 'report.js': '' },
  });
  const files = listFiles(root);
  assert.equal(files.length, 1);
  assert.ok(files[0].endsWith('a.js'));
});

test('listFiles: ignores non-js/jsx files', () => {
  const root = makeTempTree({
    'a.js': '',
    'b.ts': '',
    'c.json': '',
    'README.md': '',
  });
  const files = listFiles(root);
  assert.equal(files.length, 1);
  assert.ok(files[0].endsWith('a.js'));
});

test('listFiles: walks subdirectories', () => {
  const root = makeTempTree({
    'a.js': '',
    sub: { 'b.js': '', deep: { 'c.jsx': '' } },
  });
  const files = listFiles(root);
  assert.equal(files.length, 3);
});

test('listFiles: result is sorted', () => {
  const root = makeTempTree({
    'z.js': '',
    'a.js': '',
    'm.js': '',
  });
  const files = listFiles(root);
  const sorted = [...files].sort();
  assert.deepEqual(files, sorted);
});
