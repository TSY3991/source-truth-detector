'use strict';

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findShadowSources, MIN_CANONICAL_EXPORTS, SHARED_EXPORT_THRESHOLD } = require('../../src/analysis/shadowSource');

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures/shadow-source');
const CANONICAL = path.join(FIXTURE_DIR, 'canonical.js');
const SHADOW = path.join(FIXTURE_DIR, 'shadow.js');
const UNRELATED = path.join(FIXTURE_DIR, 'unrelated.js');
const ONE_EXPORT = path.join(FIXTURE_DIR, 'one-export.js');

function node() {
  return { inbound: new Set(), outbound: new Set() };
}

test('flags a file sharing >= threshold export names with a canonical source', () => {
  const graph = new Map([
    [CANONICAL, node()],
    [SHADOW, node()],
    [UNRELATED, node()],
  ]);
  const sourcesOfTruth = [{ file: CANONICAL, fanIn: 5 }];

  const result = findShadowSources(graph, sourcesOfTruth);

  assert.equal(result.length, 1);
  assert.equal(result[0].file, SHADOW);
  assert.equal(result[0].duplicatesFrom, CANONICAL);
  assert.deepEqual(result[0].sharedExports.sort(), ['A', 'B']);
  assert.ok(result[0].sharedExports.length >= SHARED_EXPORT_THRESHOLD);
});

test('does not flag the canonical source itself', () => {
  const graph = new Map([
    [CANONICAL, node()],
    [SHADOW, node()],
  ]);
  const sourcesOfTruth = [{ file: CANONICAL, fanIn: 5 }];

  const result = findShadowSources(graph, sourcesOfTruth);
  assert.ok(!result.some((r) => r.file === CANONICAL));
});

test('does not flag files with no shared exports', () => {
  const graph = new Map([
    [CANONICAL, node()],
    [UNRELATED, node()],
  ]);
  const sourcesOfTruth = [{ file: CANONICAL, fanIn: 5 }];

  const result = findShadowSources(graph, sourcesOfTruth);
  assert.deepEqual(result, []);
});

test('returns empty array when there are no sources of truth', () => {
  const graph = new Map([
    [CANONICAL, node()],
    [SHADOW, node()],
  ]);
  assert.deepEqual(findShadowSources(graph, []), []);
});

test('skips canonical sources with fewer than MIN_CANONICAL_EXPORTS exports', () => {
  const graph = new Map([
    [ONE_EXPORT, node()],
    [SHADOW, node()],
  ]);
  const sourcesOfTruth = [{ file: ONE_EXPORT, fanIn: 5 }];

  assert.ok(1 < MIN_CANONICAL_EXPORTS, 'sanity check: fixture has fewer exports than the minimum');
  assert.deepEqual(findShadowSources(graph, sourcesOfTruth), []);
});
