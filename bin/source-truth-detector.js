#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { buildGraph } = require('../src/graph/build');

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

let graph;
try {
  graph = buildGraph(absEntry, absRoot);
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}

const used = [...graph.keys()].sort();

console.log('USED files:');
for (const f of used) {
  console.log(' ', f);
}
console.log('');
console.log(`total used : ${used.length}`);
