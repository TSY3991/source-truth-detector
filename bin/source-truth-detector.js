#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildGraph } = require('../src/graph/build');
const { listFiles } = require('../src/scan/listFiles');
const { findPossibleSourcesOfTruth } = require('../src/analysis/sourceOfTruth');
const { findShadowSources } = require('../src/analysis/shadowSource');
const { buildResult, formatText, formatJson, formatMarkdown } = require('../src/report/formatResult');

const args = process.argv.slice(2);

function printUsage() {
  console.error('Usage: node bin/source-truth-detector.js scan <rootDir> --entry <entrypoint> [--entry <entrypoint> ...] [--format text|json|md] [--output <file>]');
  process.exit(1);
}

const cmd = args[0];
if (cmd !== 'scan') printUsage();

const rootDir = args[1];
if (!rootDir) printUsage();

const entrypoints = [];
let format = 'text';
let outputFile = null;
for (let i = 2; i < args.length; i++) {
  if (args[i] === '--entry') {
    if (!args[i + 1]) printUsage();
    entrypoints.push(args[i + 1]);
    i++;
  } else if (args[i] === '--format') {
    if (!args[i + 1]) printUsage();
    format = args[i + 1];
    i++;
  } else if (args[i] === '--output') {
    if (!args[i + 1]) printUsage();
    outputFile = args[i + 1];
    i++;
  }
}
if (entrypoints.length === 0) printUsage();
if (!['text', 'json', 'md'].includes(format)) printUsage();

const absRoot = path.resolve(rootDir);
const absEntries = entrypoints.map((e) => path.resolve(e));

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
const coverage = total > 0 ? ((used.length / total) * 100).toFixed(1) : '0.0';

const sourcesOfTruth = findPossibleSourcesOfTruth(graph);
const shadowSources = findShadowSources(graph, sourcesOfTruth);

const result = buildResult({
  scanRoot: absRoot,
  entrypoints: absEntries,
  used,
  unreferenced,
  possibleSourcesOfTruth: sourcesOfTruth,
  shadowSources,
  total,
  coverage,
});

let output;
if (format === 'json') {
  output = formatJson(result);
} else if (format === 'md') {
  output = formatMarkdown(result);
} else {
  output = formatText(result);
}

if (outputFile) {
  fs.writeFileSync(path.resolve(outputFile), output + '\n', 'utf8');
  console.log(`Report written to: ${path.resolve(outputFile)}`);
} else {
  console.log(output);
}
