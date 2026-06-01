# Source Truth Detector

**找出你的專案到底在用什麼。**

> Find what your project actually uses.

---

## 中文介紹

很多專案開發久了，目錄裡會出現這樣的情況：

```
config_old.js
config_v2.js
config_final.js
config_final_new.js
```

大家知道它們存在。但沒有人知道：**到底哪個檔案真的被使用？**

---

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

## 目前功能（v0.2.0-alpha）

**已完成：**

- Dependency Graph — 建立檔案相依關係圖
- Import Tracking — 追蹤 `import` 語法
- Require Tracking — 追蹤 `require()` 語法
- Inbound / Outbound Analysis — 分析每個檔案的引用來源與去向

**規劃中：**

- UNREFERENCED Detector — 找出沒有被引用的檔案
- Source-of-Truth Heuristics — 找出真正的核心設定來源
- Shadow Source Detection — 找出重複的邏輯片段
- Markdown / JSON Reports — 輸出可閱讀的分析報告

---

## 快速開始

目前尚未發布至 npm registry。CLI 入口點（`bin/cli.js`）尚在開發中。

請使用以下方式取得並執行測試：

```bash
# 取得專案
git clone https://github.com/your-org/source-truth-detector.git
cd source-truth-detector
npm install

# 執行測試
npm test
```

以下為規劃中的 CLI 指令（尚未可用）：

```bash
# （planned）掃描目前專案
npx source-truth-detector scan

# （planned）指定入口點
npx source-truth-detector scan --entry src/index.ts

# （planned）輸出 JSON 報告
npx source-truth-detector scan --format json --out reports/truth.json

# （planned）只顯示未被引用的檔案
npx source-truth-detector scan --filter UNREFERENCED

# （planned）只顯示高依賴節點
npx source-truth-detector scan --filter POSSIBLE_SOURCE_OF_TRUTH
```

---

## 分類標籤說明

| 標籤 | 意義 |
|---|---|
| `USED` | 被實際執行路徑引用 |
| `UNREFERENCED` | 存在但沒有地方呼叫它 |
| `POSSIBLE_SOURCE_OF_TRUTH` | 被大量檔案依賴（高 fan-in） |
| `SHADOW_SOURCE` | 重複邏輯，存在於非正式位置 |

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

## Current Features (v0.2.0-alpha)

**Implemented:**

- Dependency Graph — builds a full file dependency map
- Import Tracking — traces ES module `import` statements
- Require Tracking — traces CommonJS `require()` calls
- Inbound / Outbound Analysis — shows what each file depends on and what depends on it

**Planned:**

- UNREFERENCED Detector
- Source-of-Truth Heuristics
- Shadow Source Detection
- Markdown / JSON Reports

---

## Roadmap

| Version | Focus |
|---|---|
| v0.1.0-alpha | Project skeleton, spec, classification definitions |
| v0.2.0-alpha | Static scanner — import/require graph, USED/UNREFERENCED |
| v0.3.0 | Source-of-Truth detection, Shadow Source detection |
| v0.4.0 | Report engine — JSON, Markdown, terminal summary |
| v0.5.0 | Multi-language support (Python, Go) |
| v1.0.0 | Stable, published to npm, CI integration guide |

---

## Philosophy

Names lie. A file called `config.js` may never be loaded at runtime.
Size lies. A 2000-line module may be dead code.
Recency lies. Last modified yesterday does not mean used today.

Only the dependency graph tells the truth.

---

## License

MIT
