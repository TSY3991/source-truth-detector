# source-truth-detector

> Find what is actually used, not what looks important.

A read-only CLI tool that analyzes your project and surfaces what is truly load-bearing — not what appears important by name, size, or recency.

---

## What it does

Your codebase has a real structure and a perceived structure. They are rarely the same.

`source-truth-detector` reads your project and classifies every file, config, and export into one of four categories:

| Label | Meaning |
|---|---|
| `USED` | Referenced by something that runs |
| `UNREFERENCED` | Exists but nothing calls it |
| `POSSIBLE_SOURCE_OF_TRUTH` | High fan-in — many things depend on it |
| `SHADOW_SOURCE` | Duplicated logic living outside the canonical location |

It never modifies your project. It only reports.

---

## What it does NOT do

- Does not delete files
- Does not rename or move anything
- Does not auto-fix imports
- Does not connect to AI agents
- Does not run GitHub Actions
- Does not publish or deploy anything
- Does not guess — only follows explicit references

---

## MVP Features

- Trace `import` / `require` chains from entrypoints
- Identify files with zero inbound references
- Flag configs and env files that are actually read vs. present
- Detect duplicated constants or schema fragments (shadow sources)
- Output a structured report: JSON, Markdown, or terminal summary

---

## CLI Usage (planned)

```bash
# Scan current project from default entrypoint
npx source-truth-detector scan

# Specify entrypoint
npx source-truth-detector scan --entry src/index.ts

# Output as JSON report
npx source-truth-detector scan --format json --out reports/truth.json

# Show only unreferenced files
npx source-truth-detector scan --filter UNREFERENCED

# Show only high-dependency nodes
npx source-truth-detector scan --filter POSSIBLE_SOURCE_OF_TRUTH
```

---

## Open Source Roadmap

### v0.1.0-alpha — Skeleton
- [ ] Project structure
- [ ] README + MVP Spec
- [ ] Classification definitions

### v0.2.0 — Static Scanner (JS/TS)
- [ ] Import graph builder
- [ ] Entrypoint tracing
- [ ] USED / UNREFERENCED classification

### v0.3.0 — Source-of-Truth Detection
- [ ] Fan-in analysis (POSSIBLE_SOURCE_OF_TRUTH)
- [ ] Duplicate constant / schema detection (SHADOW_SOURCE)

### v0.4.0 — Report Engine
- [ ] JSON output
- [ ] Markdown report
- [ ] Terminal summary with color

### v0.5.0 — Multi-language
- [ ] Python support
- [ ] Go support

### v1.0.0 — Stable
- [ ] Published to npm
- [ ] Documented public API
- [ ] CI integration guide (read-only)

---

## Philosophy

This tool exists because:

1. Names lie. A file called `config.js` may be ignored at runtime.
2. Size lies. A 2000-line module may be dead code.
3. Recency lies. Last modified yesterday does not mean used today.

Only the dependency graph tells the truth.

---

## License

MIT
