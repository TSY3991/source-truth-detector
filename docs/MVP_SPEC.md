# MVP Specification — source-truth-detector

Version: 0.1.0-alpha  
Status: Draft

---

## Core Classification System

Every file, module, export, config, or constant in a scanned project is assigned exactly one label.

---

### 1. USED

**Definition:**  
The node is reachable from at least one confirmed entrypoint via a traceable reference chain.

**What counts as a reference:**
- `import` / `import()` statements (ES modules)
- `require()` calls (CommonJS)
- Re-exports (`export { x } from '...'`) where the re-export is itself USED
- Config keys that are read by code that is USED
- Env vars that are accessed via `process.env.X` in USED code

**What does NOT count:**
- Comments mentioning the file
- The file existing in the same directory as a USED file
- Being listed in `package.json` devDependencies (unless imported by a USED test)

**Output example:**
```
USED  src/auth/token.ts  (referenced by: src/api/middleware.ts, src/api/routes.ts)
```

---

### 2. UNREFERENCED

**Definition:**  
The node exists in the project but has zero inbound references from any USED node.

**Common causes:**
- Deleted feature whose files were not removed
- Utility written but never integrated
- Config file for a tool that is no longer installed
- Example or template file committed but not executed

**Important distinction:**  
UNREFERENCED is not the same as "should be deleted." It is a factual classification. The user decides what to do.

**Output example:**
```
UNREFERENCED  src/legacy/csv-parser.ts  (last modified: 2024-11-02)
UNREFERENCED  .eslintrc.old.json
```

---

### 3. POSSIBLE_SOURCE_OF_TRUTH

**Definition:**  
A node that is referenced by an unusually high number of other USED nodes. High fan-in indicates that this file or export is load-bearing for the project's coherence.

**Threshold (MVP default):**  
Referenced by 5 or more distinct USED files, OR referenced by more than 15% of all USED files in the project (whichever is lower).

**Why this matters:**  
These nodes are the real architecture. Changing them causes cascading effects. They are often underdocumented because "everyone knows" they matter — until someone new joins or the project grows.

**Typical examples:**
- A shared `types.ts` or `interfaces.ts`
- A central `config.ts` that exports runtime constants
- A base class or utility imported across many modules
- A single `.env` file that many services read

**Output example:**
```
POSSIBLE_SOURCE_OF_TRUTH  src/types/index.ts  (referenced by 23 files)
POSSIBLE_SOURCE_OF_TRUTH  .env  (read by 8 modules)
```

---

### 4. SHADOW_SOURCE

**Definition:**  
A node that contains logic, constants, or schema definitions that appear to duplicate content already present in a POSSIBLE_SOURCE_OF_TRUTH node — but lives outside the canonical location.

**Detection signals (MVP heuristics):**
- Identical or near-identical constant names with matching values
- Type definitions with the same shape as an existing canonical type
- Config keys duplicated in a secondary config file that is also USED
- Schema fields copy-pasted from a canonical schema file

**Why this matters:**  
Shadow sources are the source of drift. When the canonical source is updated, shadow copies are not. This is where bugs are born.

**Important:**  
Shadow sources are USED — they are not dead code. That is what makes them dangerous. They are active but incorrect mirrors.

**Output example:**
```
SHADOW_SOURCE  src/dashboard/constants.ts
  → duplicates USER_ROLES from src/types/index.ts (POSSIBLE_SOURCE_OF_TRUTH)

SHADOW_SOURCE  services/email/.env.local
  → duplicates 4 keys from root .env (POSSIBLE_SOURCE_OF_TRUTH)
```

---

## Classification Rules Summary

| Label | Reachable from entrypoint | Fan-in | Duplicates canonical node |
|---|---|---|---|
| USED | Yes | Low–medium | No |
| UNREFERENCED | No | — | — |
| POSSIBLE_SOURCE_OF_TRUTH | Yes | High | No |
| SHADOW_SOURCE | Yes | Any | Yes |

A node can only have one label. Priority order when multiple signals apply:

1. SHADOW_SOURCE (active + duplicating — most actionable)
2. POSSIBLE_SOURCE_OF_TRUTH (active + high fan-in)
3. USED (active + normal)
4. UNREFERENCED (not reachable)

---

## Out of Scope for MVP

- Circular dependency detection (future)
- Cross-repository analysis (future)
- Runtime tracing (future — static only)
- AI-assisted classification (future)
- Auto-remediation of any kind (never automatic)
