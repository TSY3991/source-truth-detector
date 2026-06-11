'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractExports } = require('../../src/graph/extractExports');

test('export const declarations', () => {
  const result = extractExports("export const FOO = 1;\nexport const BAR = 2;");
  assert.deepEqual(result, ['FOO', 'BAR']);
});

test('export function and class declarations', () => {
  const result = extractExports("export function doThing() {}\nexport class Widget {}");
  assert.deepEqual(result, ['doThing', 'Widget']);
});

test('named export list, including renames', () => {
  const result = extractExports("const a = 1, b = 2;\nexport { a, b as renamed };");
  assert.deepEqual(result, ['a', 'renamed']);
});

test('export default is skipped (no name)', () => {
  const result = extractExports("export default function () {}\nexport { x } from './x';");
  assert.deepEqual(result, ['x']);
});

test('CommonJS exports.foo assignment', () => {
  const result = extractExports("exports.foo = 1;\nmodule.exports.bar = 2;");
  assert.deepEqual(result, ['foo', 'bar']);
});

test('CommonJS module.exports object literal, including key:value', () => {
  const result = extractExports("module.exports = { foo, bar: baz, qux };");
  assert.deepEqual(result, ['foo', 'bar', 'qux']);
});

test('returns empty array when nothing is exported', () => {
  const result = extractExports("const x = 1;\nfunction helper() {}");
  assert.deepEqual(result, []);
});

test('deduplicates repeated export names', () => {
  const result = extractExports("export const FOO = 1;\nexports.FOO = FOO;");
  assert.deepEqual(result, ['FOO']);
});
