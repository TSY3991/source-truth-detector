'use strict';

const fs = require('node:fs');
const path = require('node:path');

const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);
const INCLUDED_EXTS = new Set(['.js', '.jsx']);

/**
 * Recursively walk rootDir and return all .js/.jsx files,
 * excluding EXCLUDED_DIRS at any depth.
 *
 * @param {string} rootDir  absolute path to scan root
 * @returns {string[]}      sorted array of absolute file paths
 */
function listFiles(rootDir) {
  const results = [];

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        if (INCLUDED_EXTS.has(path.extname(entry.name))) {
          results.push(path.join(dir, entry.name));
        }
      }
    }
  }

  walk(rootDir);
  return results.sort();
}

module.exports = { listFiles, EXCLUDED_DIRS, INCLUDED_EXTS };
