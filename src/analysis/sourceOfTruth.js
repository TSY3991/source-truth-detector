'use strict';

// Thresholds per docs/MVP_SPEC.md — POSSIBLE_SOURCE_OF_TRUTH
const FAN_IN_THRESHOLD = 5;
const FAN_IN_RATIO_THRESHOLD = 0.15;

/**
 * Find nodes with unusually high fan-in — files that many other USED files
 * depend on, and are therefore likely "source of truth" for the project.
 *
 * A node qualifies if either:
 *   - it is referenced by FAN_IN_THRESHOLD or more distinct USED files, OR
 *   - its fan-in ratio (inbound / total USED files) exceeds FAN_IN_RATIO_THRESHOLD
 *
 * @param {Map<string, { inbound: Set<string>, outbound: Set<string> }>} graph
 * @returns {{ file: string, fanIn: number }[]}  sorted by fanIn descending
 */
function findPossibleSourcesOfTruth(graph) {
  const usedCount = graph.size;
  const results = [];

  for (const [file, node] of graph) {
    const fanIn = node.inbound.size;
    const exceedsAbsolute = fanIn >= FAN_IN_THRESHOLD;
    const exceedsRatio = usedCount > 0 && fanIn / usedCount > FAN_IN_RATIO_THRESHOLD;

    if (exceedsAbsolute || exceedsRatio) {
      results.push({ file, fanIn });
    }
  }

  return results.sort((a, b) => b.fanIn - a.fanIn);
}

module.exports = {
  findPossibleSourcesOfTruth,
  FAN_IN_THRESHOLD,
  FAN_IN_RATIO_THRESHOLD,
};
