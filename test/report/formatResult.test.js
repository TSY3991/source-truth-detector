'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildResult, formatText, formatJson, formatMarkdown } = require('../../src/report/formatResult');

function sampleResult() {
  return buildResult({
    scanRoot: '/root',
    entrypoints: ['/root/entry.js'],
    used: ['/root/entry.js', '/root/dep.js'],
    unreferenced: ['/root/orphan.js'],
    possibleSourcesOfTruth: [{ file: '/root/dep.js', fanIn: 5 }],
    shadowSources: [{ file: '/root/dup.js', duplicatesFrom: '/root/dep.js', sharedExports: ['a', 'b'] }],
    total: 3,
    coverage: '66.7',
  });
}

test('buildResult: computes summary fields', () => {
  const result = sampleResult();
  assert.deepEqual(result.summary, {
    totalFiles: 3,
    usedFiles: 2,
    unreferencedFiles: 1,
    possibleSourcesOfTruth: 1,
    shadowSources: 1,
    coverage: 66.7,
  });
});

test('formatText: contains all sections', () => {
  const out = formatText(sampleResult());
  assert.ok(out.includes('scan root  : /root'));
  assert.ok(out.includes('USED files:'));
  assert.ok(out.includes('UNREFERENCED files:'));
  assert.ok(out.includes('POSSIBLE_SOURCE_OF_TRUTH files:'));
  assert.ok(out.includes('SHADOW_SOURCE files:'));
  assert.ok(out.includes('Scan Summary:'));
  assert.ok(out.includes('Coverage                   : 66.7%'));
});

test('formatJson: round-trips result data', () => {
  const result = sampleResult();
  const parsed = JSON.parse(formatJson(result));
  assert.deepEqual(parsed, result);
});

test('formatMarkdown: contains headings and tables', () => {
  const out = formatMarkdown(sampleResult());
  assert.ok(out.includes('# Source Truth Detector Report'));
  assert.ok(out.includes('## Scan Summary'));
  assert.ok(out.includes('| Coverage | 66.7% |'));
  assert.ok(out.includes('## UNREFERENCED files'));
  assert.ok(out.includes('`/root/orphan.js`'));
  assert.ok(out.includes('## SHADOW_SOURCE files'));
  assert.ok(out.includes('duplicates `a, b` from `/root/dep.js`'));
});

test('formatMarkdown: (none) when sections empty', () => {
  const empty = buildResult({
    scanRoot: '/root',
    entrypoints: ['/root/entry.js'],
    used: ['/root/entry.js'],
    unreferenced: [],
    possibleSourcesOfTruth: [],
    shadowSources: [],
    total: 1,
    coverage: '100.0',
  });
  const out = formatMarkdown(empty);
  assert.match(out, /## UNREFERENCED files\n\n\(none\)/);
  assert.match(out, /## POSSIBLE_SOURCE_OF_TRUTH files\n\n\(none\)/);
  assert.match(out, /## SHADOW_SOURCE files\n\n\(none\)/);
});
