# Yen Lai 的網站（GitHub Pages）

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
- works 寫在 `_data/works.yml`（目前是空的 `[]`）。`status` 用形狀區分：`in progress` 是 ●（強調色）、`experiment` 是 ◐，其他值是 ○。
- 文章頁（`_layouts/default.html`、`assets/js/post.js`）也是 terminal 風格：最上方是獨立一列的 `$ cd ..`，文字靠右（和結尾的上一個／下一個一樣整列反白），接著是標題，下方是日期和字數（打開文章的 `cat` 指令不會留在文章頁上）；Markdown 的清單、程式碼、表格、分隔線、註腳用 terminal 的寫法呈現，內文維持一般字型。文章結尾是 `(END)`、上一篇／下一篇，以及可以輸入指令的提示字元。文章頁也跟著系統切換日間和夜間。
- 從 notes 點文章時，提示字元打出 `cat 檔名.md`，文章就在指令下方一行一行印出來，整頁像 terminal 一樣往上捲，指令捲出畫面上緣，直到文章的開頭到達文章頁的位置，再交給真正的文章頁（`assets/js/shell.js`）。因為兩邊畫面一樣，看不出換頁。按任何鍵、捲動或點擊會直接打開文章；系統設定「減少動態效果」時直接換頁。直接打開文章網址時，文章頁會自己把標題和內文打出來。
- 文章頁的內文欄永遠置中；視窗 1088px 以上，註腳放在右側（160–200px 寬），以下放在文末。
- 日夜切換：首頁右上角的分段開關 `auto｜day｜night`，正在用的那一格是實心的；選擇會記在瀏覽器裡（`assets/js/theme.js`），文章頁也會跟著。文章頁不放開關，以免打擾閱讀；文章結尾的提示字元仍然可以輸入 `theme day`、`theme night`、`theme auto`。notes／works／文章結尾的提示字元也可以輸入 `theme day`、`theme night`、`theme auto`。

## 分享卡片與 SEO

- 每頁的 `<head>` 都會載入 `_includes/seo.html`，內容包括 canonical 網址、description、Open Graph／Twitter card、結構化資料（首頁是 Person，文章是 BlogPosting）和 favicon。文章的 description 預設取內文前 120 字；想自己寫的話，在 front matter 加 `description:`。
- 每篇文章有自己的分享卡片 `assets/og/<檔名>.jpg`（1200 × 630），首頁是 `home.jpg`。卡片上有 `cat 檔名.md` 指令列（`yen@taiwan` 用主題色）、標題、摘要（和 description 同一段文字）、日期，右下角一條用倉頡字根組成的小錦鯉（依標題決定形狀，同一篇永遠一樣）。
- 卡片由 `scripts/og/build.js` 依 `scripts/og/card.html` 畫出來。push 到 `main` 時，GitHub Action（`.github/workflows/og.yml`）會自動畫好新的或改過的卡片並 commit 回來，所以平常不用做任何事。新文章的卡片產生之前，會先用首頁那張。
- 想在本機畫：`npm install --no-save playwright && npx playwright install chromium && node scripts/og/build.js`
- `favicon.svg`、`favicon-32.png`、`apple-touch-icon.png` 放在 `assets/icons/`，圖案是朱色印章。
- `sitemap.xml` 只列首頁和 `published/` 的文章（`/notes/`、`/works/` 只是轉址）；`robots.txt` 指向它。

## 顏色的意思

每個顏色在每一頁、日夜兩種模式都只代表一件事（`assets/css/site.css` 開頭的 `--accent` 註解）：

| 顏色 | 意思 | 例子 |
|------|------|------|
| 墨 | 要讀的東西 | 標題、清單列、內文、內文裡的連結（加虛線） |
| 強調色（日間朱 `#b5531e`／夜間琥珀 `#f5b942`） | 站內可以操作的地方，或正在進行的事。只當記號，字本身維持墨色 | notes/ works/、last note、view all 的文字（不加底線；打開的分頁才有底線）、內文連結的虛線、可以輸入的那一行提示字元、註腳編號、`+`／`−`、in progress 的 ● |
| 灰 | 說明，或離開 | 日期、字數、提示、`cd ~`、`theme:`、外部連結（加上 `↗`） |

游標指到、鍵盤聚焦或手指按住時：

- 一般連結：只有顏色變深一點：灰色變成墨色，主題色變成更深的朱色（夜間是更亮的琥珀）。用鍵盤聚焦時另外加一條底線。
- terminal 的列（notes／works 清單、`$ cd ~`、文章上方的 `$ cd ..`、文章結尾的上一個／下一個）：整列反白。
- 文章內文的連結：平常是墨色字加虛線，指到時變成實線（鍵盤聚焦時是較粗的實線）。

實心（反白）永遠代表「目前選中」：terminal 選中的那一列、正在用的 theme。

## 提示字元

- 可以輸入的那一行是完整的 `yen@taiwan:~/notes$`，提示字元用強調色，後面有一個淡淡閃爍的方塊游標，點了就能打字。
- 已經執行過的指令（`ls -lt`、指令紀錄）只留簡短的灰色提示：`~/notes ❯ ls -lt`，像 terminal 的 transient prompt。從 notes 點開文章時，`cat` 打在完整提示上，隨著文章印出來而捲出畫面。
- 觸控螢幕不顯示輸入框，改成一排指令按鈕（notes／works：`help` `whoami` `theme` `cd ~`；文章：`help` `top` `cd ..` `theme`），所以不會跳出鍵盤。`theme` 按鈕會切到下一個設定；`help` 在觸控螢幕上只列出這些按鈕。

## 介面語言

操作說明（按鍵提示、`help`、指令回應、輸入框和日夜開關的說明文字）只顯示一種語言：瀏覽器或手機的第一語言是中文，就顯示中文，其他一律英文。不提供切換，文章內容維持原本的語言。判斷寫在 `_includes/theme-boot.html`，在畫面出現前就決定，所以不會閃。

- HTML 裡的文字：兩種語言各包一個 `<span class="i-en">`／`<span class="i-zh">`，CSS 只顯示一種。
- JS 裡的文字：`t("English", "中文")`。
- 輸入框和日夜開關的 `aria-label`／`title` 預設英文，中文寫在 `data-label-zh`／`data-title-zh`。

## 文章的標題

文章頁像 `cat` 印出一個檔案：標題和內文的各級標題（`#` 到 `######`）都和內文同樣大小，只用粗體。層次靠留白：標題上方留大空間，下方緊貼它的內文。
