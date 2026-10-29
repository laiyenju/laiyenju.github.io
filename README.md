# Yen 的寫作站（GitHub Pages）

極簡 Jekyll 站，沒有主題、沒有外掛。網站網址：<https://laiyenju.github.io>

## 工作流程

1. **iA Writer** 寫稿  
2. **Obsidian** 整理、改檔名、管理資料夾  
3. **git push** 到這個 repo（`laiyenju.github.io`）  
4. **GitHub Pages** 自動建置並發布

## 草稿 vs 發布

| 位置 | 意思 |
|------|------|
| repo **根目錄**，檔名 `*.draft.md` | 草稿；不會進網站 |
| **`published/`** 資料夾 | 已發布；Jekyll 只建置這裡的文章 |

Front matter 慣例：`title`、`date`、`status`（草稿預設 `draft`）。  
**發布訊號 = 把檔案移進 `published/`**（可改名成 `YYYY-MM-DD-題目.md`），不必再手動改 `status`。

## 本機預覽（可選）

```bash
jekyll serve
```

建置結果在 `_site/`（已列入 `.gitignore`）。

## 開啟 Pages

若網站還沒上線：Repo → **Settings** → **Pages** → Source 選 **Deploy from a branch** → Branch **`main`**、資料夾 **`/` (root)** → Save。

## 首頁錦鯉與 notes / works

- 錦鯉引擎的原始碼在 `assets/vendor/ascii-sharks/src/`，網站載入的是打包後的 `assets/js/ocean.js`。改了原始碼要重新打包：

  ```bash
  npx esbuild@0.24.0 assets/vendor/ascii-sharks/entry.ts --bundle --format=iife --target=es2019 --outfile=assets/js/ocean.js
  ```

- 字元和配色在 `src/themes.ts`：`GLYPH_DAY`（明體倉頡字根）、`GLYPH_NIGHT`（點陣字根、琥珀色），`ASCII` 是原本的樣子。首頁跟著系統的淺色／深色設定切換；文章頁固定用日間版。
- 首頁錦鯉圍著中間的文字繞圈；點 notes / works 後自由游動。文章頁讀的時候沒有錦鯉，捲到 `(END)` 時才有一條游過去一次（`World.startPass`、`OceanEngine.swimAcross`）。
- notes / works 是 terminal 風格（`assets/js/shell.js`），最後一行可以輸入指令，輸入 `help` 看有哪些。
- notes 的字數由 Jekyll 建置時粗略計算（扣掉 HTML 標籤和空白後的字元數），`total` 只算今年的文章。
- works 的狀態寫在 `_data/works.yml` 的 `status`：`in progress`（綠點）、`experiment`（橘點），其他值是灰點。
- 文章頁（`_layouts/default.html`、`assets/js/post.js`）也是 terminal 風格：上方 `$ cd ..`、`cat 檔名.md`，標題下方是日期和字數；Markdown 的清單、程式碼、表格、分隔線、註腳用 terminal 的寫法呈現，內文維持一般字型。文章結尾是 `(END)`、上一篇／下一篇，以及可以輸入指令的提示字元。文章頁也跟著系統切換日間和夜間。
- 從 notes 點文章時，提示字元打出 `cat 檔名.md`，文章就在指令下方一行一行印出來，整頁像 terminal 一樣往上捲，直到指令行到達文章頁的位置，再交給真正的文章頁（`assets/js/shell.js`）。因為兩邊畫面一樣，看不出換頁。按任何鍵、捲動或點擊會直接打開文章；系統設定「減少動態效果」時直接換頁。直接打開文章網址時，文章頁會自己把指令、標題和內文打出來。
- 文章頁的內文欄永遠置中；視窗 1088px 以上，註腳放在右側（160–200px 寬），以下放在文末。
- 日夜切換：每頁右上角的 `theme:` 按鈕，依序切換 `auto`（跟隨系統）、日間、夜間，選擇會記在瀏覽器裡（`assets/js/theme.js`）。notes／works／文章結尾的提示字元也可以輸入 `theme day`、`theme night`、`theme auto`。
