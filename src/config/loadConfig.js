'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONFIG_FILENAME = '.claude-truth-detector.json';

const ALLOWED_KEYS = new Set([
  'entry',
  'format',
  'output',
  'fanInThreshold',
  'fanInRatioThreshold',
  'minCanonicalExports',
  'sharedExportThreshold',
  'sharedRatioThreshold',
]);

/**
 * Load `.claude-truth-detector.json` from the given root directory (or an
 * explicit path). Returns `null` if no config file is present.
 *
 * `entry` paths are resolved relative to the config file's directory.
 *
 * @param {string} rootDir - absolute scan root, used to locate the default config file
 * @param {string|null} configPath - explicit path to a config file (overrides default location)
 * @returns {object|null}
 */
function loadConfig(rootDir, configPath = null) {
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.join(rootDir, CONFIG_FILENAME);

  if (!fs.existsSync(resolvedPath)) return null;

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse config file ${resolvedPath}: ${err.message}`);
  }

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_KEYS.has(key)) {
      throw new Error(`Unknown key "${key}" in config file ${resolvedPath}`);
    }
  }

  const configDir = path.dirname(resolvedPath);
  const config = { ...raw };

  if (config.entry) {
    if (!Array.isArray(config.entry)) {
      throw new Error(`"entry" must be an array of paths in config file ${resolvedPath}`);
    }
    config.entry = config.entry.map((e) => path.resolve(configDir, e));
  }

  return config;
}

module.exports = {
  loadConfig,
  CONFIG_FILENAME,
};
