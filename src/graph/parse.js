'use strict';

// Matches `from 'specifier'` — covers named/default/namespace/re-export forms
const FROM_RE = /\bfrom\s+['"]([^'"]+)['"]/g;
// Matches side-effect `import 'specifier'` (no binding, no from)
const SIDE_EFFECT_RE = /\bimport\s+['"]([^'"]+)['"]/g;
// Matches CommonJS require('specifier')
const REQUIRE_RE = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

/**
 * Extract all import/require specifiers from file content.
 * Returns a deduplicated array — order is insertion order.
 *
 * @param {string} fileContent
 * @returns {string[]}
 */
function extractSpecifiers(fileContent) {
  const seen = new Set();

  for (const re of [FROM_RE, SIDE_EFFECT_RE, REQUIRE_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(fileContent)) !== null) {
      seen.add(m[1]);
    }
  }

  return Array.from(seen);
}

module.exports = { extractSpecifiers };
