#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { buildGraph } = require('../src/graph/build');
const { listFiles } = require('../src/scan/listFiles');

const args = process.argv.slice(2);

function printUsage() {
  console.error('Usage: node bin/source-truth-detector.js scan <rootDir> --entry <entrypoint>');
  process.exit(1);
}

const cmd = args[0];
if (cmd !== 'scan') printUsage();

const rootDir = args[1];
if (!rootDir) printUsage();

const entryFlagIdx = args.indexOf('--entry');
if (entryFlagIdx === -1 || !args[entryFlagIdx + 1]) printUsage();
const entrypoint = args[entryFlagIdx + 1];

const absRoot = path.resolve(rootDir);
const absEntry = path.resolve(entrypoint);

console.log(`scan root  : ${absRoot}`);
console.log(`entrypoint : ${absEntry}`);
console.log('');

// --- build dependency graph ---
let graph;
try {
  graph = buildGraph(absEntry, absRoot);
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

// --- Scan Summary ---
console.log('Scan Summary:');
console.log(`  Total files scanned : ${total}`);
console.log(`  Used files          : ${usedCount}`);
console.log(`  Unreferenced files  : ${unreferencedCount}`);
console.log(`  Coverage            : ${coverage}%`);
