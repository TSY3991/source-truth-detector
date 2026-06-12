#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildGraph } = require('../src/graph/build');
const { listFiles } = require('../src/scan/listFiles');
const { findPossibleSourcesOfTruth } = require('../src/analysis/sourceOfTruth');
const { findShadowSources } = require('../src/analysis/shadowSource');
const { buildResult, formatText, formatJson, formatMarkdown } = require('../src/report/formatResult');
const { loadConfig } = require('../src/config/loadConfig');

const args = process.argv.slice(2);

function printUsage() {
  console.error('Usage: node bin/source-truth-detector.js scan <rootDir> [--entry <entrypoint> ...] [--format text|json|md] [--output <file>] [--config <path>]');
  console.error('  --entry can be omitted if .claude-truth-detector.json provides "entry"');
  process.exit(1);
}

const cmd = args[0];
if (cmd !== 'scan') printUsage();

const rootDir = args[1];
if (!rootDir) printUsage();

const entrypoints = [];
let format = null;
let outputFile = null;
let configPath = null;
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
  } else if (args[i] === '--config') {
    if (!args[i + 1]) printUsage();
    configPath = args[i + 1];
    i++;
  }
}

const absRoot = path.resolve(rootDir);

let config;
try {
  config = loadConfig(absRoot, configPath);
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}
config = config || {};

const absEntries = (entrypoints.length > 0 ? entrypoints.map((e) => path.resolve(e)) : config.entry) || [];
if (absEntries.length === 0) printUsage();

if (format === null) format = config.format || 'text';
if (outputFile === null) outputFile = config.output || null;
if (!['text', 'json', 'md'].includes(format)) printUsage();

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

const sourcesOfTruth = findPossibleSourcesOfTruth(graph, {
  fanInThreshold: config.fanInThreshold,
  fanInRatioThreshold: config.fanInRatioThreshold,
});
const shadowSources = findShadowSources(graph, sourcesOfTruth, {
  minCanonicalExports: config.minCanonicalExports,
  sharedExportThreshold: config.sharedExportThreshold,
  sharedRatioThreshold: config.sharedRatioThreshold,
});

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
