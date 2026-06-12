# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to its own alpha versioning (`vX.Y.Z-alpha`) until v1.0.0.

## [Unreleased]

- TypeScript (`.ts` / `.tsx`) support (planned)

## [0.8.0-alpha] - 2026-06-12

### Added

- `.claude-truth-detector.json` config file support — pin `entry`, `format`,
  `output`, and SHADOW_SOURCE / POSSIBLE_SOURCE_OF_TRUTH thresholds
  (`fanInThreshold`, `fanInRatioThreshold`, `minCanonicalExports`,
  `sharedExportThreshold`, `sharedRatioThreshold`) per project.
- `--config <path>` flag to point at a config file in a different location.
- CLI flags continue to override the corresponding config file values.

## [0.7.0-alpha] - 2026-06-12

### Added

- `--format json|md` to output the scan result as JSON or Markdown.
- `--output <file>` to write the report to a file instead of stdout.
- `src/report/formatResult.js` — shared result builder and formatters for
  text/JSON/Markdown output.

## [0.6.0-alpha] - 2026-06-11

### Added

- SHADOW_SOURCE classification — flags USED files that share a large
  fraction of exported names with a POSSIBLE_SOURCE_OF_TRUTH file, surfacing
  likely stale duplicates (e.g. `config_old.js`).
- `src/graph/extractExports.js` — static export-name extraction for ES
  modules and CommonJS.

## [0.5.0-alpha] - 2026-06-11

### Added

- Multi-entrypoint support — `--entry` can be passed multiple times; USED
  sets are merged across all reachable files.
- POSSIBLE_SOURCE_OF_TRUTH classification — flags files with unusually high
  fan-in (referenced by many other files).
- `SKILL.md` for Claude Code Desktop skill integration.

## [0.2.0-alpha] - 2026-06-01

### Added

- Initial static scanner — builds an import/require dependency graph from
  one entrypoint.
- USED / UNREFERENCED classification and coverage summary.
- Minimal `scan` CLI command.
