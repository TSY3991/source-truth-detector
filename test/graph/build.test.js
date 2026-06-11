'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildGraph } = require('../../src/graph/build');

const FIXTURES = path.join(__dirname, 'fixtures');
const fix = (name, file) => path.join(FIXTURES, name, file);
const fixDir = (name) => path.join(FIXTURES, name);

// ── simple ────────────────────────────────────────────────────────────────────

test('simple: graph has entry and dep nodes', () => {
  const entry = fix('simple', 'entry.js');
  const dep = fix('simple', 'dep.js');
  const graph = buildGraph(entry, fixDir('simple'));

  assert.ok(graph.has(entry), 'entry node present');
  assert.ok(graph.has(dep), 'dep node present');
  assert.equal(graph.size, 2);
});

test('simple: entry → dep edge is recorded', () => {
  const entry = fix('simple', 'entry.js');
  const dep = fix('simple', 'dep.js');
  const graph = buildGraph(entry, fixDir('simple'));

  assert.ok(graph.get(entry).outbound.has(dep), 'entry.outbound has dep');
  assert.ok(graph.get(dep).inbound.has(entry), 'dep.inbound has entry');
});

test('simple: dep has no outbound edges', () => {
  const dep = fix('simple', 'dep.js');
  const graph = buildGraph(fix('simple', 'entry.js'), fixDir('simple'));
  assert.equal(graph.get(dep).outbound.size, 0);
});

// ── ext-resolution ────────────────────────────────────────────────────────────

test('ext-resolution: resolves dep without extension', () => {
  const entry = fix('ext-resolution', 'entry.js');
  const dep = fix('ext-resolution', 'dep.js');
  const graph = buildGraph(entry, fixDir('ext-resolution'));

  assert.ok(graph.has(dep), 'dep.js resolved');
  assert.ok(graph.get(entry).outbound.has(dep));
});

// ── index-resolution ──────────────────────────────────────────────────────────

test('index-resolution: resolves ./subdir to subdir/index.js', () => {
  const entry = fix('index-resolution', 'entry.js');
  const idx = path.join(fixDir('index-resolution'), 'subdir', 'index.js');
  const graph = buildGraph(entry, fixDir('index-resolution'));

  assert.ok(graph.has(idx), 'subdir/index.js in graph');
  assert.ok(graph.get(entry).outbound.has(idx));
});

// ── require ───────────────────────────────────────────────────────────────────

test('require: CommonJS require() is followed', () => {
  const entry = fix('require-style', 'entry.js');
  const dep = fix('require-style', 'dep.js');
  const graph = buildGraph(entry, fixDir('require-style'));

  assert.ok(graph.has(dep), 'dep.js in graph via require');
  assert.ok(graph.get(entry).outbound.has(dep));
  assert.ok(graph.get(dep).inbound.has(entry));
});

// ── out-of-root ───────────────────────────────────────────────────────────────

test('out-of-root: specifier outside rootDir is not followed', () => {
  const entry = fix('out-of-root', 'entry.js');
  const graph = buildGraph(entry, fixDir('out-of-root'));

  // Only entry node should exist — the outside import is dropped
  assert.equal(graph.size, 1, 'only entry in graph');
  assert.ok(graph.has(entry));
  assert.equal(graph.get(entry).outbound.size, 0);
});

// ── visited guard (no infinite loop) ─────────────────────────────────────────

test('visited set prevents duplicate processing', () => {
  // simple fixture has 2 files; running twice should give same result
  const entry = fix('simple', 'entry.js');
  const g1 = buildGraph(entry, fixDir('simple'));
  const g2 = buildGraph(entry, fixDir('simple'));
  assert.equal(g1.size, g2.size);
});

// ── graph shape invariants ────────────────────────────────────────────────────

test('all nodes are Map entries with inbound and outbound Sets', () => {
  const graph = buildGraph(fix('simple', 'entry.js'), fixDir('simple'));
  for (const [, node] of graph) {
    assert.ok(node.inbound instanceof Set, 'inbound is Set');
    assert.ok(node.outbound instanceof Set, 'outbound is Set');
  }
});

test('entry node has empty inbound set', () => {
  const entry = fix('simple', 'entry.js');
  const graph = buildGraph(entry, fixDir('simple'));
  assert.equal(graph.get(entry).inbound.size, 0);
});

// ── multi-entry ───────────────────────────────────────────────────────────────

test('multi-entry: graph includes nodes reachable from either entrypoint', () => {
  const entryA = fix('multi-entry', 'entryA.js');
  const entryB = fix('multi-entry', 'entryB.js');
  const shared = fix('multi-entry', 'shared.js');
  const depA = fix('multi-entry', 'depA.js');
  const depB = fix('multi-entry', 'depB.js');
  const orphan = fix('multi-entry', 'orphan.js');

  const graph = buildGraph([entryA, entryB], fixDir('multi-entry'));

  assert.ok(graph.has(entryA), 'entryA in graph');
  assert.ok(graph.has(entryB), 'entryB in graph');
  assert.ok(graph.has(shared), 'shared in graph');
  assert.ok(graph.has(depA), 'depA in graph');
  assert.ok(graph.has(depB), 'depB in graph');
  assert.ok(!graph.has(orphan), 'orphan not in graph');
});

test('multi-entry: shared node has inbound edges from both entrypoints', () => {
  const entryA = fix('multi-entry', 'entryA.js');
  const entryB = fix('multi-entry', 'entryB.js');
  const shared = fix('multi-entry', 'shared.js');

  const graph = buildGraph([entryA, entryB], fixDir('multi-entry'));

  assert.ok(graph.get(shared).inbound.has(entryA), 'shared.inbound has entryA');
  assert.ok(graph.get(shared).inbound.has(entryB), 'shared.inbound has entryB');
});

test('multi-entry: single-string entrypoint still works (backward compatible)', () => {
  const entryA = fix('multi-entry', 'entryA.js');
  const graph = buildGraph(entryA, fixDir('multi-entry'));

  assert.ok(graph.has(entryA));
  assert.ok(graph.has(fix('multi-entry', 'shared.js')));
  assert.ok(graph.has(fix('multi-entry', 'depA.js')));
  assert.ok(!graph.has(fix('multi-entry', 'depB.js')), 'depB not reachable from entryA alone');
});
