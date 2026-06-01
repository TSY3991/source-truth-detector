'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resolveSpecifier } = require('../../src/graph/resolve');

const FIXTURES = path.join(__dirname, 'fixtures');

// helpers
const dir = (name) => path.join(FIXTURES, name);
const abs = (...parts) => path.join(FIXTURES, ...parts);

test('resolves exact path with extension (.js)', () => {
  const result = resolveSpecifier('./dep.js', dir('simple'), dir('simple'));
  assert.equal(result, abs('simple', 'dep.js'));
});

test('resolves .js extension when omitted', () => {
  const result = resolveSpecifier('./dep', dir('ext-resolution'), dir('ext-resolution'));
  assert.equal(result, abs('ext-resolution', 'dep.js'));
});

test('resolves .jsx extension when omitted', () => {
  const result = resolveSpecifier('./Comp', dir('jsx-resolution'), dir('jsx-resolution'));
  assert.equal(result, abs('jsx-resolution', 'Comp.jsx'));
});

test('resolves index.js inside a directory', () => {
  const result = resolveSpecifier('./subdir', dir('index-resolution'), dir('index-resolution'));
  assert.equal(result, abs('index-resolution', 'subdir', 'index.js'));
});

test('resolves index.jsx inside a directory', () => {
  const result = resolveSpecifier('./subdir', dir('index-jsx-resolution'), dir('index-jsx-resolution'));
  assert.equal(result, abs('index-jsx-resolution', 'subdir', 'index.jsx'));
});

test('returns null for non-relative specifier', () => {
  const result = resolveSpecifier('react', dir('simple'), dir('simple'));
  assert.equal(result, null);
});

test('returns null for node: built-in', () => {
  const result = resolveSpecifier('node:fs', dir('simple'), dir('simple'));
  assert.equal(result, null);
});

test('returns null when specifier escapes rootDir', () => {
  // entry.js has `import outside from '../outside'`
  // sourceDir = out-of-root/, rootDir = out-of-root/ → ../outside is above root
  const result = resolveSpecifier('../outside', dir('out-of-root'), dir('out-of-root'));
  assert.equal(result, null);
});

test('returns null when file does not exist', () => {
  const result = resolveSpecifier('./nonexistent', dir('simple'), dir('simple'));
  assert.equal(result, null);
});

test('rootDir boundary: sibling dir is outside rootDir', () => {
  // rootDir is simple/, but specifier points to ../ext-resolution/dep
  const result = resolveSpecifier('../ext-resolution/dep', dir('simple'), dir('simple'));
  assert.equal(result, null);
});
