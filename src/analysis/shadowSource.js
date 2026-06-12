'use strict';

const fs = require('node:fs');
const { extractExports } = require('../graph/extractExports');

// A POSSIBLE_SOURCE_OF_TRUTH node needs at least this many exports to be a
// meaningful "canonical" source worth comparing against.
const MIN_CANONICAL_EXPORTS = 2;
// A USED node must share at least this many export names with a canonical
// source to be flagged as a shadow.
const SHARED_EXPORT_THRESHOLD = 2;
// ...and those shared names must cover at least this fraction of the
// canonical source's exports.
const SHARED_RATIO_THRESHOLD = 0.5;

/**
 * Find USED nodes that appear to duplicate exported names from a
 * POSSIBLE_SOURCE_OF_TRUTH node — a best-effort static heuristic for
 * SHADOW_SOURCE per docs/MVP_SPEC.md.
 *
 * A USED node qualifies if it shares SHARED_EXPORT_THRESHOLD or more export
 * names with a canonical (POSSIBLE_SOURCE_OF_TRUTH) node, AND those shared
 * names cover more than SHARED_RATIO_THRESHOLD of the canonical node's
 * exports. Canonical nodes themselves are never flagged as shadows of
 * themselves or of each other.
 *
 * @param {Map<string, { inbound: Set<string>, outbound: Set<string> }>} graph
 * @param {{ file: string, fanIn: number }[]} sourcesOfTruth
 * @param {{ minCanonicalExports?: number, sharedExportThreshold?: number, sharedRatioThreshold?: number }} [options]
 * @returns {{ file: string, duplicatesFrom: string, sharedExports: string[] }[]}
 */
function findShadowSources(graph, sourcesOfTruth, options = {}) {
  const minCanonicalExports = options.minCanonicalExports ?? MIN_CANONICAL_EXPORTS;
  const sharedExportThreshold = options.sharedExportThreshold ?? SHARED_EXPORT_THRESHOLD;
  const sharedRatioThreshold = options.sharedRatioThreshold ?? SHARED_RATIO_THRESHOLD;

  const canonicalFiles = new Set(sourcesOfTruth.map((s) => s.file));
  const exportsCache = new Map();

  function getExports(file) {
    if (exportsCache.has(file)) return exportsCache.get(file);
    let names;
    try {
      names = new Set(extractExports(fs.readFileSync(file, 'utf8')));
    } catch {
      names = new Set();
    }
    exportsCache.set(file, names);
    return names;
  }

  const results = [];

  for (const { file: canonicalFile } of sourcesOfTruth) {
    const canonicalExports = getExports(canonicalFile);
    if (canonicalExports.size < minCanonicalExports) continue;

    for (const candidate of graph.keys()) {
      if (candidate === canonicalFile) continue;
      if (canonicalFiles.has(candidate)) continue;

      const candidateExports = getExports(candidate);
      if (candidateExports.size === 0) continue;

      const shared = [...candidateExports].filter((name) => canonicalExports.has(name));
      const ratio = shared.length / canonicalExports.size;

      if (shared.length >= sharedExportThreshold && ratio > sharedRatioThreshold) {
        results.push({ file: candidate, duplicatesFrom: canonicalFile, sharedExports: shared });
      }
    }
  }

  return results;
}

module.exports = {
  findShadowSources,
  MIN_CANONICAL_EXPORTS,
  SHARED_EXPORT_THRESHOLD,
  SHARED_RATIO_THRESHOLD,
};
