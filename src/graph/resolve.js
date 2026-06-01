'use strict';

const path = require('node:path');
const fs = require('node:fs');

// Extension candidates appended to base path
const EXT_SUFFIXES = ['', '.js', '.jsx'];

/**
 * Resolve a relative specifier to an absolute path that exists on disk.
 * Returns null if:
 *   - specifier is not relative (no leading `.`)
 *   - resolved path is outside rootDir
 *   - no candidate file exists
 *
 * @param {string} specifier
 * @param {string} sourceDir  absolute directory containing the importing file
 * @param {string} rootDir    project root — results outside this return null
 * @returns {string|null}
 */
function resolveSpecifier(specifier, sourceDir, rootDir) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const base = path.resolve(sourceDir, specifier);
  const normalRoot = path.resolve(rootDir);

  // Reject anything that escapes the project root
  if (base !== normalRoot && !base.startsWith(normalRoot + path.sep)) {
    return null;
  }

  const candidates = [
    ...EXT_SUFFIXES.map((s) => base + s),
    ...EXT_SUFFIXES.filter((s) => s).map((s) => path.join(base, 'index' + s)),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // candidate does not exist — try next
    }
  }

  return null;
}

module.exports = { resolveSpecifier };
