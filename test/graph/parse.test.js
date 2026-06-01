'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractSpecifiers } = require('../../src/graph/parse');

test('static import with default binding', () => {
  const result = extractSpecifiers("import foo from './foo';");
  assert.deepEqual(result, ['./foo']);
});

test('static import with named bindings', () => {
  const result = extractSpecifiers("import { bar, baz } from './bar';");
  assert.deepEqual(result, ['./bar']);
});

test('static import with namespace binding', () => {
  const result = extractSpecifiers("import * as ns from './ns';");
  assert.deepEqual(result, ['./ns']);
});

test('side-effect import (no binding)', () => {
  const result = extractSpecifiers("import './side-effect';");
  assert.deepEqual(result, ['./side-effect']);
});

test('re-export named from', () => {
  const result = extractSpecifiers("export { x } from './x';");
  assert.deepEqual(result, ['./x']);
});

test('re-export star from', () => {
  const result = extractSpecifiers("export * from './lib';");
  assert.deepEqual(result, ['./lib']);
});

test('require call', () => {
  const result = extractSpecifiers("const x = require('./dep');");
  assert.deepEqual(result, ['./dep']);
});

test('require with double-quoted string', () => {
  const result = extractSpecifiers('const x = require("./dep");');
  assert.deepEqual(result, ['./dep']);
});

test('multiple specifiers from different patterns', () => {
  const content = [
    "import a from './a';",
    "import './b';",
    "const c = require('./c');",
  ].join('\n');
  const result = extractSpecifiers(content);
  assert.deepEqual(result.sort(), ['./a', './b', './c']);
});

test('deduplicates repeated specifiers', () => {
  const content = [
    "import a from './a';",
    "import { aa } from './a';",
  ].join('\n');
  const result = extractSpecifiers(content);
  assert.equal(result.length, 1);
  assert.equal(result[0], './a');
});

test('bare (node_modules) specifier is included as-is', () => {
  const result = extractSpecifiers("import react from 'react';");
  assert.deepEqual(result, ['react']);
});

test('empty content returns empty array', () => {
  const result = extractSpecifiers('');
  assert.deepEqual(result, []);
});

test('does not match dynamic import()', () => {
  // dynamic import has no `from` and uses parens — FROM_RE and SIDE_EFFECT_RE should not match
  const result = extractSpecifiers("const m = import('./dynamic');");
  // dynamic import has no `from` keyword and is `import(` not `import '`
  assert.deepEqual(result, []);
});
