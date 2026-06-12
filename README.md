# Source Truth Detector

**找出你的專案到底在用什麼。**

> Find what your project actually uses.

**作者**：**TSY**
🔗 [Facebook](https://www.facebook.com/profile.php?id=61590545304079)
(https://github.com/TSY3991/source-truth-detector)

---

## 起源

專案做久了，目錄裡一定會出現這種東西：

```
config_old.js
config_v2.js
config_final.js
config_final_new.js
```

每個檔案都「可能」還在用，也「可能」早就沒人理了。但沒有人敢刪——因為沒人能保證刪了不會炸。

這個工具的起點就是這個問題：**與其用檔名、修改時間、檔案大小去猜，不如直接從程式碼的 import / require 關係，把真正的依賴鏈畫出來。**

跑一次本專案自己的 `src/`：

```bash
node bin/source-truth-detector.js scan ./src --entry ./src/graph/build.js
```

```
USED files:
  src/graph/build.js
  src/graph/parse.js
  src/graph/resolve.js

UNREFERENCED files:
  src/analysis/shadowSource.js
  src/analysis/sourceOfTruth.js
  src/graph/extractExports.js
  src/scan/listFiles.js

POSSIBLE_SOURCE_OF_TRUTH files:
  src/graph/parse.js  (referenced by 1 files)
  src/graph/resolve.js  (referenced by 1 files)

SHADOW_SOURCE files:
  (none)

Scan Summary:
  Total files scanned        : 7
  Used files                 : 3
  Unreferenced files         : 4
  Possible sources of truth  : 2
  Shadow sources             : 0
  Coverage                   : 42.9%
```

→ 從 `build.js` 這個 entrypoint 出發，幾個 `src/analysis/` 與 `src/scan/` 底下的檔案沒有被依賴鏈引用到，所以是 `UNREFERENCED`（它們其實是被 CLI 主程式 `bin/` 直接呼叫，只是不在這個 entrypoint 的依賴鏈上）；`parse.js` / `resolve.js` 被多個檔案依賴，列為 `POSSIBLE_SOURCE_OF_TRUTH`；目前沒有偵測到 `SHADOW_SOURCE`。是不是「該刪」或「該注意」由你判斷——工具只負責把事實攤開。

---

## 中文介紹

Source Truth Detector 是一個 **read-only 分析工具**。

它不會：

- 修改程式碼
- 刪除檔案
- 自動重構

它只會告訴你：

- 哪些檔案真的被使用
- 哪些檔案沒有被任何地方引用
- 哪些檔案值得進一步檢查

---

## 三步驟工作流

```
Step 1: 指定 entrypoint
   └─ node bin/source-truth-detector.js scan <目錄> --entry <進入點>
        ↓
Step 2: 工具建立依賴圖，分類所有檔案
   └─ USED（依賴鏈可達） / UNREFERENCED（依賴鏈不可達）
        ↓
Step 3: 你看報告，自己決定
   └─ 該刪？該補 import？還是本來就是另一個 entrypoint 的入口？
```

**工具只做 Step 1-2。Step 3 永遠是你的判斷。**

---

## ✅ 現在就能用 — 30 秒範例（v0.7.0-alpha）

不需要 npm install、不需要建置。直接用 Node 執行：

```bash
node bin/source-truth-detector.js scan <掃描目錄> --entry <進入點檔案> [--entry <進入點檔案> ...]
```

**真實範例**（對本專案的 `src/` 跑一次）：

```bash
node bin/source-truth-detector.js scan ./src --entry ./src/graph/build.js
```

**輸出結果：**

```
scan root  : /path/to/source-truth-detector/src
entrypoints:
  /path/to/source-truth-detector/src/graph/build.js

USED files:
  src/graph/build.js
  src/graph/parse.js
  src/graph/resolve.js

UNREFERENCED files:
  src/analysis/shadowSource.js
  src/analysis/sourceOfTruth.js
  src/graph/extractExports.js
  src/scan/listFiles.js

POSSIBLE_SOURCE_OF_TRUTH files:
  src/graph/parse.js  (referenced by 1 files)
  src/graph/resolve.js  (referenced by 1 files)

SHADOW_SOURCE files:
  (none)

Scan Summary:
  Total files scanned        : 7
  Used files                 : 3
  Unreferenced files         : 4
  Possible sources of truth  : 2
  Shadow sources             : 0
  Coverage                   : 42.9%
```

`listFiles.js` 沒有被 `build.js` 的依賴鏈引用到，所以被標成 `UNREFERENCED`——即使它確實是專案的一部分（只是被 CLI 主程式直接呼叫，而非從這個 entrypoint 可達）。這正是工具的用途：**告訴你依賴鏈的事實，由你判斷這個結果合不合理**。

---

## 在你的專案使用

把這個 repo clone 到任意位置（不需要放進你的專案裡），然後指向你自己專案的路徑：

```bash
git clone <this-repo> source-truth-detector

node source-truth-detector/bin/source-truth-detector.js scan \
  /path/to/你的專案/src \
  --entry /path/to/你的專案/src/index.js \
  --entry /path/to/你的專案/src/server.js
```

- `<目錄>`：你想分析的資料夾（通常是 `src/`）
- `--entry`：你專案實際啟動的進入點檔案（例如 `src/index.js`、`src/main.jsx`）。**可以重複指定多次**——例如前端 `index.tsx` + 後端 `server.js` 同時給，工具會合併計算所有可達的檔案

跑完看 `UNREFERENCED files` 清單，那些就是「依賴鏈追不到」的檔案，值得你進一步檢查。

---

## ⚠️ 已知限制（v0.7.0-alpha）

使用前請先了解，避免誤判：

- **僅支援 `.js` / `.jsx`**：`.ts` / `.tsx` 檔案目前不會被掃描或視為依賴
- **僅追蹤相對路徑 import/require**（`./` 或 `../`）：對 `node_modules` 套件、bare specifier（例如 `import React from 'react'`）不會分析，也不會列入 USED/UNREFERENCED
- **自動排除目錄**：`node_modules`、`.git`、`dist`、`build`、`coverage`

---

## 適合誰

- React 開發者
- Node.js 開發者
- 接手舊專案的人
- 想整理專案但不敢亂刪的人

---

## 不適合誰

如果你需要：

- Auto Cleanup
- Auto Delete
- Auto Refactor
- AI 自動修改程式碼

這個工具不是做這件事的。

---

## 完整功能狀態

**已完成（v0.7.0-alpha）：**

- Dependency Graph — 建立檔案相依關係圖
- Import Tracking — 追蹤 `import` 語法
- Require Tracking — 追蹤 `require()` 語法
- Inbound / Outbound Analysis — 分析每個檔案的引用來源與去向
- USED / UNREFERENCED Detector + Coverage 摘要
- Multi-Entrypoint Support — 可同時指定多個 `--entry`，合併計算 USED 集合
- Source-of-Truth Heuristics — 找出被大量檔案依賴的核心設定來源（高 fan-in）
- Shadow Source Detection — 找出與核心來源共用大量 export 名稱、疑似過時複本的檔案
- JSON / Markdown Reports — `--format json` / `--format md`，可加 `--output <file>` 寫入檔案

**規劃中：**

- Config 設定檔（`.claude-truth-detector.json`）— 固定常用 entry / threshold
- TypeScript（`.ts` / `.tsx`）支援

---

## 開發 / 跑測試

```bash
git clone <this-repo>
cd source-truth-detector
npm install
npm test
```

---

## 分類標籤說明

| 標籤 | 狀態 | 意義 |
|---|---|---|
| `USED` | ✅ 已實作 | 被實際執行路徑引用 |
| `UNREFERENCED` | ✅ 已實作 | 存在但沒有地方呼叫它 |
| `POSSIBLE_SOURCE_OF_TRUTH` | ✅ 已實作 | 被大量檔案依賴（高 fan-in，閾值見下方） |
| `SHADOW_SOURCE` | ✅ 已實作 | 與 `POSSIBLE_SOURCE_OF_TRUTH` 共用大量同名 export，疑似過時複本 |

> `POSSIBLE_SOURCE_OF_TRUTH` 判斷標準：被 **5 個以上**檔案引用，或引用數佔 USED 檔案總數 **超過 15%**，符合任一即列出。
>
> `SHADOW_SOURCE` 判斷標準：與某個 `POSSIBLE_SOURCE_OF_TRUTH` 檔案共用 **2 個以上**的 export 名稱，且這些共用名稱佔該來源 export 總數 **超過 50%**。這是名稱層級的啟發式比對，不比對實際數值，找到的結果務必人工確認。

---

## FAQ

**Q: 跟 ESLint `no-unused-vars`、depcheck、madge 這些工具有什麼差？**
A: ESLint 的 `no-unused-vars` 看的是「檔案內」沒用到的變數，depcheck 看的是 `package.json` 裡沒用到的套件。這個工具看的是**專案內檔案之間**的依賴關係——「這個檔案有沒有被任何其他檔案 import / require」。三者互補，不重疊。

**Q: 為什麼要指定 entrypoint，不能直接掃整個資料夾嗎？**
A: 因為「有沒有被使用」永遠是相對於「從哪裡開始執行」而言。沒有 entrypoint，工具就只能告訴你「檔案之間誰 import 誰」，沒辦法判斷整條鏈最終有沒有連到「會被執行的進入點」。如果專案有多個進入點（前端+後端+worker），可以重複給多個 `--entry`，工具會合併所有可達的檔案。

**Q: `UNREFERENCED` 是不是代表可以刪掉？**
A: **不一定。** 常見情況包括：
- 真的是死碼，可以刪
- 是另一個你忘了用 `--entry` 帶入的進入點（補上該 entrypoint 重新跑一次即可）
- 是動態 import / 字串拼接路徑載入的檔案（這個工具只追蹤靜態 `import`/`require`）

工具只回答「依賴鏈追不到」這個事實，不代表「沒用」。

**Q: 會不會幫我修 import 或刪檔案？**
A: **絕對不會。** 這是 read-only 工具，只輸出報告，不寫入、不刪除、不修改任何檔案。

**Q: 支援 TypeScript 嗎？**
A: 目前（v0.7.0-alpha）只支援 `.js` / `.jsx`，TypeScript 支援在規劃中（見 Roadmap）。

---

# English

**Find what your project actually uses.**

---

## What it does

As projects grow, directories fill up with files like:

```
config_old.js
config_v2.js
config_final.js
config_final_new.js
```

Everyone knows they exist. Nobody knows which one is actually loaded at runtime.

Source Truth Detector is a **read-only analysis tool** that traces your actual dependency graph and tells you:

- Which files are genuinely referenced
- Which files are unreferenced by anything
- Which files are worth investigating further

It never modifies your project. It only reports.

---

## Three-step workflow

```
Step 1: Pick an entrypoint
   └─ node bin/source-truth-detector.js scan <dir> --entry <entrypoint>
        ↓
Step 2: The tool builds a dependency graph and classifies every file
   └─ USED (reachable) / UNREFERENCED (not reachable)
        ↓
Step 3: You read the report and decide
   └─ Delete it? Add a missing import? Or is it a different entrypoint's entry file?
```

**The tool only does Step 1-2. Step 3 is always your call.**

---

## What it does NOT do

- Does not delete files
- Does not rename or move anything
- Does not auto-fix imports
- Does not auto-refactor or auto-cleanup
- Does not connect to AI agents
- Does not guess — only follows explicit references

---

## Who it's for

- React developers
- Node.js developers
- Developers inheriting a legacy codebase
- Anyone who wants to clean up but is afraid to delete the wrong file

---

## Try it now — 30 second example (v0.7.0-alpha)

No npm install or build step required. Run directly with Node:

```bash
node bin/source-truth-detector.js scan <dir-to-scan> --entry <entrypoint-file> [--entry <entrypoint-file> ...]
```

**Real example** (scanning this project's own `src/`):

```bash
node bin/source-truth-detector.js scan ./src --entry ./src/graph/build.js
```

**Output:**

```
scan root  : /path/to/source-truth-detector/src
entrypoints:
  /path/to/source-truth-detector/src/graph/build.js

USED files:
  src/graph/build.js
  src/graph/parse.js
  src/graph/resolve.js

UNREFERENCED files:
  src/analysis/shadowSource.js
  src/analysis/sourceOfTruth.js
  src/graph/extractExports.js
  src/scan/listFiles.js

POSSIBLE_SOURCE_OF_TRUTH files:
  src/graph/parse.js  (referenced by 1 files)
  src/graph/resolve.js  (referenced by 1 files)

SHADOW_SOURCE files:
  (none)

Scan Summary:
  Total files scanned        : 7
  Used files                 : 3
  Unreferenced files         : 4
  Possible sources of truth  : 2
  Shadow sources             : 0
  Coverage                   : 42.9%
```

---

## Use it on your own project

Clone this repo anywhere (it does not need to live inside your project), then point it at your own project's path:

```bash
git clone <this-repo> source-truth-detector

node source-truth-detector/bin/source-truth-detector.js scan \
  /path/to/your-project/src \
  --entry /path/to/your-project/src/index.js \
  --entry /path/to/your-project/src/server.js
```

- `<dir>`: the folder you want to analyze (usually `src/`)
- `--entry`: your project's actual runtime entrypoint file (e.g. `src/index.js`, `src/main.jsx`). **Can be passed multiple times** — e.g. a frontend `index.tsx` and a backend `server.js` together; the tool merges all reachable files from every entrypoint

Check the `UNREFERENCED files` list — those are files the dependency chain can't reach, and worth investigating further.

---

## Known Limitations (v0.7.0-alpha)

- **Only `.js` / `.jsx`** — `.ts` / `.tsx` files are not scanned or tracked
- **Only relative imports/requires** (`./` or `../`) are resolved — `node_modules` packages and bare specifiers (e.g. `import React from 'react'`) are not analyzed
- **Excluded directories**: `node_modules`, `.git`, `dist`, `build`, `coverage`

---

## Current Features (v0.7.0-alpha)

**Implemented:**

- Dependency Graph — builds a full file dependency map
- Import Tracking — traces ES module `import` statements
- Require Tracking — traces CommonJS `require()` calls
- Inbound / Outbound Analysis — shows what each file depends on and what depends on it
- USED / UNREFERENCED Detector + Coverage summary
- Multi-Entrypoint Support — pass `--entry` multiple times; USED sets are merged
- Source-of-Truth Heuristics — flags files with unusually high fan-in (referenced by many other files)
- Shadow Source Detection — flags files sharing many export names with a source-of-truth file (likely stale copies)
- JSON / Markdown Reports — `--format json` / `--format md`, optionally write to a file with `--output <file>`

**Planned:**

- Config file (`.claude-truth-detector.json`)
- TypeScript (`.ts` / `.tsx`) support

---

## Roadmap

| Version | Focus |
|---|---|
| v0.1.0-alpha | Project skeleton, spec, classification definitions |
| v0.2.0-alpha | Static scanner — import/require graph, USED/UNREFERENCED |
| v0.4.0-alpha | Multi-Entrypoint support |
| v0.5.0-alpha | Source-of-Truth detection (fan-in heuristics) |
| v0.6.0-alpha | Shadow Source detection (export-name heuristics) |
| v0.7.0-alpha | JSON/Markdown reports (`--format`, `--output`) |
| v0.8.0 | Config file (`.claude-truth-detector.json`) |
| v1.0.0 | Stable, published to npm, CI integration guide |

---

## FAQ

**Q: How is this different from ESLint `no-unused-vars`, depcheck, or madge?**
A: ESLint's `no-unused-vars` looks at unused variables *within* a file. depcheck looks at unused packages in `package.json`. This tool looks at the dependency relationships **between files in your project** — "is this file imported/required by anything?" The three are complementary, not overlapping.

**Q: Why do I need to specify an entrypoint? Why not just scan the whole folder?**
A: "Used" only makes sense relative to "started from where." Without an entrypoint, the tool can only tell you which files import which — it can't tell whether a chain ultimately connects back to something that actually runs. If your project has multiple entrypoints (frontend + backend + worker), pass `--entry` multiple times — the tool merges everything reachable from any of them.

**Q: Does `UNREFERENCED` mean I can delete the file?**
A: **Not necessarily.** Common cases include:
- Genuinely dead code — safe to delete
- The entry file of an entrypoint you forgot to pass with `--entry` (re-run with it added)
- A file loaded via dynamic `import()` with a computed/string-built path (this tool only follows static `import`/`require`)

The tool reports the fact "the dependency chain can't reach this file" — not "this file is useless."

**Q: Will it fix my imports or delete files for me?**
A: **Never.** This is a read-only tool. It only prints a report — it never writes, deletes, or modifies anything.

**Q: Does it support TypeScript?**
A: Not yet (v0.7.0-alpha) — only `.js` / `.jsx`. TypeScript support is planned (see Roadmap).

---

## Philosophy

Names lie. A file called `config.js` may never be loaded at runtime.
Size lies. A 2000-line module may be dead code.
Recency lies. Last modified yesterday does not mean used today.

Only the dependency graph tells the truth.

---

## License

[MIT License](LICENSE) — 可改、可用、可商用，保留 LICENSE 檔即可。

---

## 致謝

這個工具源自整理舊專案時反覆遇到的問題：**目錄裡躺著一堆 `*_old` / `*_v2` / `*_final` 檔案，沒人敢刪，也沒人說得出哪個才是真正在跑的**。

與其每次都靠肉眼追 import，不如寫一個工具把依賴鏈畫出來、把事實攤開——剩下的判斷交還給人。

如果這個工具幫到你，歡迎來信或私訊交流：[Facebook](https://www.facebook.com/profile.php?id=61590545304079)

也特別感謝  駱君昊 (Hao)** · MetaFantasy Co-Founder · AIGC 數位創作者 的分享
🔗 [Facebook](https://www.facebook.com/lo.jain.hao)

---

**⭐ 覺得有用的話，歡迎 Star / Fork。**
