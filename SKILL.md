---
name: source-truth-detector
description: Read-only 依賴鏈分析工具 — 從指定的 entrypoint 出發，建立 import/require 依賴圖，分類專案內每個 .js/.jsx 檔案為 USED（被依賴鏈引用）、UNREFERENCED（追不到）、POSSIBLE_SOURCE_OF_TRUTH（高 fan-in，被大量檔案依賴）、SHADOW_SOURCE（與來源檔共用大量 export 名稱，疑似過時複本）。絕不修改、刪除、重構任何檔案。觸發詞：「找出專案沒用到的檔案」「這個檔案還有人用嗎」「掃一下依賴關係」「找 dead code」「找 source of truth」「config_old / config_v2 哪個才是真的」「找重複的設定檔」「source-truth-detector」「scan unreferenced files」時觸發。
---

<!--
  source-truth-detector skill — Created by TSY
  Repo: https://github.com/TSY3991/source-truth-detector
  License: MIT — 保留此標註即可修改、使用、商用
-->

# source-truth-detector

**找出你的專案到底在用什麼。** 一個 read-only 的依賴鏈分析 CLI 工具。

## 它會做什麼

從一個或多個 entrypoint 出發，沿著 `import` / `require` 建立依賴圖，把專案內所有 `.js` / `.jsx` 檔案分類成：

- `USED` — 從 entrypoint 出發，依賴鏈可以追到
- `UNREFERENCED` — 依賴鏈追不到（可能是死碼、忘記掛 entrypoint、或動態載入）
- `POSSIBLE_SOURCE_OF_TRUTH` — 被 5 個以上檔案引用，或引用數佔 USED 檔案總數超過 15%（高 fan-in，可能是核心設定/共用模組）
- `SHADOW_SOURCE` — 與某個 `POSSIBLE_SOURCE_OF_TRUTH` 檔案共用 2 個以上、且超過一半的 export 名稱（疑似過時複本，可能是 `config_old.js` 這類檔案）

並輸出 Coverage 摘要。

## 它絕對不會做

- 不修改程式碼
- 不刪除檔案
- 不自動重構 / 自動 import

**永遠只輸出報告，由使用者自己判斷下一步。**

## 怎麼用（給 Claude）

當使用者要求分析某個專案有哪些檔案沒被用到、或想找出依賴鏈核心檔案時：

1. 確認使用者專案的根目錄（通常是 `src/`）以及實際的執行入口檔（如 `src/index.js`、`src/main.jsx`、`src/server.js`）。如果有多個入口（前端 + 後端 + worker），全部列出。
2. 執行：

```bash
node "C:\Users\user\.claude\skills\source-truth-detector\bin\source-truth-detector.js" scan <使用者專案的掃描目錄> --entry <入口檔1> [--entry <入口檔2> ...]
```

3. 解讀輸出：
   - `USED files` — 確認被依賴鏈引用到的檔案
   - `UNREFERENCED files` — 列給使用者看，並提醒：可能是死碼、可能是漏掉的 entrypoint、也可能是動態載入（此工具只追蹤靜態 import/require）
   - `POSSIBLE_SOURCE_OF_TRUTH files` — 列給使用者看，標註「這些檔案被很多地方依賴，修改前要特別小心」
   - `SHADOW_SOURCE files` — 列給使用者看，標註「這個檔案可能是某個來源檔的過時複本，建議比對後確認是否該刪除或同步」
   - `Scan Summary` 的 Coverage — 給使用者一個整體概況

4. **不要**根據 `UNREFERENCED` 結果自動刪除或修改任何檔案，除非使用者明確要求並再次確認。

## 已知限制

- 僅支援 `.js` / `.jsx`（不支援 `.ts` / `.tsx`）
- 僅追蹤相對路徑 `import`/`require`（`./` 或 `../`），不分析 `node_modules` 套件或 bare specifier
- 自動排除 `node_modules`、`.git`、`dist`、`build`、`coverage`

## 開發 / 跑測試

```bash
cd "C:\Users\user\.claude\skills\source-truth-detector"
npm test
```

完整說明、起源故事、FAQ 請見 [README.md](./README.md) 或專案首頁：
https://github.com/TSY3991/source-truth-detector

---

## License

MIT — 保留此標註即可修改、使用、商用。

## 致謝

如果這個工具幫到你，歡迎來信或私訊交流：[Facebook](https://www.facebook.com/profile.php?id=61590545304079)

**⭐ 覺得有用的話，歡迎到 GitHub Star / Fork。**
