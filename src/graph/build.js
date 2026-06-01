'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { extractSpecifiers } = require('./parse');
const { resolveSpecifier } = require('./resolve');

/**
 * Walk the dependency graph starting from entrypoint using BFS.
 *
 * Returns a Map where each key is an absolute file path and each value is:
 *   { inbound: Set<string>, outbound: Set<string> }
 *
 * Only files reachable from entrypoint within rootDir are included.
 * Unresolvable specifiers (node_modules, missing files, outside rootDir) are skipped.
 *
 * @param {string} entrypoint  absolute or rootDir-relative path to the entry file
 * @param {string} rootDir     project root used as the resolution boundary
 * @returns {Map<string, { inbound: Set<string>, outbound: Set<string> }>}
 */
function buildGraph(entrypoint, rootDir) {
  const entry = path.resolve(entrypoint);
  const root = path.resolve(rootDir);

  /** @type {Map<string, { inbound: Set<string>, outbound: Set<string> }>} */
  const graph = new Map();
  const visited = new Set();
  const queue = [entry];

  function ensureNode(filePath) {
    if (!graph.has(filePath)) {
      graph.set(filePath, { inbound: new Set(), outbound: new Set() });
    }
    return graph.get(filePath);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    ensureNode(current);

    let content;
    try {
      content = fs.readFileSync(current, 'utf8');
    } catch {
      continue;
    }

    const sourceDir = path.dirname(current);
    for (const specifier of extractSpecifiers(content)) {
      const resolved = resolveSpecifier(specifier, sourceDir, root);
      if (resolved === null) continue;

      ensureNode(resolved);
      graph.get(current).outbound.add(resolved);
      graph.get(resolved).inbound.add(current);

      if (!visited.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return graph;
}

module.exports = { buildGraph };
