'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findPossibleSourcesOfTruth, FAN_IN_THRESHOLD, FAN_IN_RATIO_THRESHOLD } = require('../../src/analysis/sourceOfTruth');

function node(inboundFiles = [], outboundFiles = []) {
  return { inbound: new Set(inboundFiles), outbound: new Set(outboundFiles) };
}

test('returns empty array for empty graph', () => {
  const graph = new Map();
  assert.deepEqual(findPossibleSourcesOfTruth(graph), []);
});

test('does not flag a node with low fan-in in a large graph', () => {
  // 10 nodes total, one node with fan-in 1 → 1/10 = 10% < 15%, and < 5
  const graph = new Map();
  graph.set('shared.js', node(['a.js']));
  for (let i = 0; i < 9; i++) {
    graph.set(`f${i}.js`, node([]));
  }
  const result = findPossibleSourcesOfTruth(graph);
  assert.deepEqual(result, []);
});

test('flags a node with fan-in >= FAN_IN_THRESHOLD (absolute)', () => {
  // 7 nodes total, shared.js referenced by 5 → 5 >= FAN_IN_THRESHOLD
  const graph = new Map();
  const referencers = ['a.js', 'b.js', 'c.js', 'd.js', 'e.js'];
  graph.set('shared.js', node(referencers));
  graph.set('entry.js', node([]));
  for (const f of referencers) {
    graph.set(f, node([], ['shared.js']));
  }

  const result = findPossibleSourcesOfTruth(graph);
  assert.equal(result.length, 1);
  assert.equal(result[0].file, 'shared.js');
  assert.equal(result[0].fanIn, FAN_IN_THRESHOLD);
});

test('flags a node exceeding FAN_IN_RATIO_THRESHOLD even with fan-in < 5', () => {
  // 5 nodes total, shared.js referenced by 1 → 1/5 = 20% > 15%
  const graph = new Map();
  graph.set('shared.js', node(['a.js']));
  graph.set('a.js', node([], ['shared.js']));
  graph.set('b.js', node([]));
  graph.set('c.js', node([]));
  graph.set('d.js', node([]));

  const ratio = 1 / graph.size;
  assert.ok(ratio > FAN_IN_RATIO_THRESHOLD, 'sanity check: ratio exceeds threshold');

  const result = findPossibleSourcesOfTruth(graph);
  assert.equal(result.length, 1);
  assert.equal(result[0].file, 'shared.js');
  assert.equal(result[0].fanIn, 1);
});

test('results are sorted by fanIn descending', () => {
  const graph = new Map();
  // 8 nodes total. low.js: fanIn=2 → 2/8=25% > 15% (qualifies via ratio).
  // high.js: fanIn=6 → qualifies via absolute threshold.
  graph.set('low.js', node(['x1.js', 'x2.js']));
  graph.set('high.js', node(['x1.js', 'x2.js', 'x3.js', 'x4.js', 'x5.js', 'x6.js']));
  for (const f of ['x1.js', 'x2.js', 'x3.js', 'x4.js', 'x5.js', 'x6.js']) {
    graph.set(f, node([]));
  }

  const result = findPossibleSourcesOfTruth(graph);
  assert.equal(result.length, 2);
  assert.equal(result[0].file, 'high.js');
  assert.ok(result[0].fanIn >= result[1].fanIn);
});
