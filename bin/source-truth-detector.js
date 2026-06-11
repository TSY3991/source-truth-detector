#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { buildGraph } = require('../src/graph/build');
const { listFiles } = require('../src/scan/listFiles');
const { findPossibleSourcesOfTruth } = require('../src/analysis/sourceOfTruth');
const { findShadowSources } = require('../src/analysis/shadowSource');

const args = process.argv.slice(2);

function printUsage() {
  console.error('Usage: node bin/source-truth-detector.js scan <rootDir> --entry <entrypoint> [--entry <entrypoint> ...]');
  process.exit(1);
}

const cmd = args[0];
if (cmd !== 'scan') printUsage();

const rootDir = args[1];
if (!rootDir) printUsage();

const entrypoints = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--entry') {
    if (!args[i + 1]) printUsage();
    entrypoints.push(args[i + 1]);
    i++;
  }
}
if (entrypoints.length === 0) printUsage();

const absRoot = path.resolve(rootDir);
const absEntries = entrypoints.map((e) => path.resolve(e));

console.log(`scan root  : ${absRoot}`);
console.log('entrypoints:');
for (const e of absEntries) {
  console.log(`  ${e}`);
}
console.log('');

// --- build dependency graph ---
let graph;
try {
  graph = buildGraph(absEntries, absRoot);
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}

// --- collect all .js/.jsx files in rootDir ---
const allFiles = listFiles(absRoot);
const usedSet = new Set(graph.keys());

const used = [...usedSet].sort();
const unreferenced = allFiles.filter(f => !usedSet.has(f));

const total = allFiles.length;
const usedCount = used.length;
const unreferencedCount = unreferenced.length;
const coverage = total > 0 ? ((usedCount / total) * 100).toFixed(1) : '0.0';

// --- USED files ---
console.log('USED files:');
for (const f of used) {
  console.log(' ', f);
}
console.log('');

// --- UNREFERENCED files ---
console.log('UNREFERENCED files:');
if (unreferenced.length === 0) {
  console.log('  (none)');
} else {
  for (const f of unreferenced) {
    console.log(' ', f);
  }
}
console.log('');

// --- POSSIBLE_SOURCE_OF_TRUTH files ---
const sourcesOfTruth = findPossibleSourcesOfTruth(graph);
console.log('POSSIBLE_SOURCE_OF_TRUTH files:');
if (sourcesOfTruth.length === 0) {
  console.log('  (none)');
} else {
  for (const { file, fanIn } of sourcesOfTruth) {
    console.log(`  ${file}  (referenced by ${fanIn} files)`);
  }
}
console.log('');

// --- SHADOW_SOURCE files ---
const shadowSources = findShadowSources(graph, sourcesOfTruth);
console.log('SHADOW_SOURCE files:');
if (shadowSources.length === 0) {
  console.log('  (none)');
} else {
  for (const { file, duplicatesFrom, sharedExports } of shadowSources) {
    console.log(`  ${file}`);
    console.log(`    -> duplicates ${sharedExports.join(', ')} from ${duplicatesFrom}`);
  }
}
console.log('');

// --- Scan Summary ---
console.log('Scan Summary:');
console.log(`  Total files scanned        : ${total}`);
console.log(`  Used files                 : ${usedCount}`);
console.log(`  Unreferenced files         : ${unreferencedCount}`);
console.log(`  Possible sources of truth  : ${sourcesOfTruth.length}`);
console.log(`  Shadow sources             : ${shadowSources.length}`);
console.log(`  Coverage                   : ${coverage}%`);
