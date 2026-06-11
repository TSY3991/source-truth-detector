'use strict';

// `export const X`, `export function X`, `export class X`, `export async function X`, etc.
const DECL_RE = /\bexport\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/g;
// `export { a, b as c }` / `export { a, b as c } from './x'`
const NAMED_RE = /\bexport\s*\{([^}]*)\}/g;
// `exports.foo = ...` / `module.exports.foo = ...`
const CJS_PROP_RE = /\b(?:module\.exports|exports)\.([A-Za-z_$][\w$]*)\s*=/g;
// `module.exports = { a, b: c, ... }`
const CJS_OBJECT_RE = /\bmodule\.exports\s*=\s*\{([^}]*)\}/g;

/**
 * Split a brace-list like "a, b as c, d: e" into the *exported/external* names.
 * For "x as y" or "x: y" forms, the right-hand name (y) is what's kept.
 *
 * @param {string} body
 * @returns {string[]}
 */
function splitBraceList(body) {
  return body
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const asMatch = part.match(/\bas\s+([A-Za-z_$][\w$]*)/);
      if (asMatch) return asMatch[1];
      const colonMatch = part.match(/^([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)/);
      if (colonMatch) return colonMatch[1];
      const nameMatch = part.match(/^([A-Za-z_$][\w$]*)/);
      return nameMatch ? nameMatch[1] : null;
    })
    .filter(Boolean);
}

/**
 * Extract the set of exported identifier names from file content.
 * Covers ES module declarations/named exports and CommonJS `exports.x` /
 * `module.exports = { ... }` patterns. `export default` has no name and is skipped.
 *
 * This is a best-effort static heuristic, not a full parser.
 *
 * @param {string} fileContent
 * @returns {string[]} deduplicated, insertion-ordered export names
 */
function extractExports(fileContent) {
  const seen = new Set();

  let m;

  DECL_RE.lastIndex = 0;
  while ((m = DECL_RE.exec(fileContent)) !== null) {
    seen.add(m[1]);
  }

  NAMED_RE.lastIndex = 0;
  while ((m = NAMED_RE.exec(fileContent)) !== null) {
    for (const name of splitBraceList(m[1])) {
      if (name === 'default') continue;
      seen.add(name);
    }
  }

  CJS_PROP_RE.lastIndex = 0;
  while ((m = CJS_PROP_RE.exec(fileContent)) !== null) {
    seen.add(m[1]);
  }

  CJS_OBJECT_RE.lastIndex = 0;
  while ((m = CJS_OBJECT_RE.exec(fileContent)) !== null) {
    for (const name of splitBraceList(m[1])) {
      seen.add(name);
    }
  }

  return Array.from(seen);
}

module.exports = { extractExports };
