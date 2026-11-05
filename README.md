# laiyenju.github.io

Yen Lai 的個人網站：<https://laiyenju.github.io>

- 純 Jekyll，由 GitHub Pages 建置（`main` 分支、根目錄）。沒有主題，沒有外掛，沒有 `Gemfile`。
- 只有兩個自動流程：**GitHub Pages 建置網站**、**GitHub Action 畫分享卡片**。
- 只有一個手動步驟：改了 pixel 引擎（`assets/vendor/pixel-plays/engine.js`）或 `scripts/pixel-engine/build.js` 之後，要重新產生 `assets/js/pixel-engine.js`（見 3.3）。

---

## 1. 資料夾結構

| 資料夾／檔案 | 處理什麼 |
|---|---|
| `published/` | 已發布的文章。放進這裡就是發布 |
| `index.md`、`_layouts/home.html` | 首頁：每天一棟 pixel 建築、Timeline、下方的 terminal（notes、works 都在 terminal 裡）。`home.html` 把文章清單和 `_data/` 的資料寫成 JSON 放進頁面，畫面全部由 `assets/js/day.js` 畫出來 |
| `_layouts/default.html` | 文章頁 |
| `_includes/` | 每頁共用的 `<head>`、SEO 標籤、日夜主題與介面語言的初始設定 |
| `_data/works.yml` | 作品集（terminal 的 `ls works`，每件作品一頁 `#work-<slug>`） |
| `_data/days.yml` | 去過的地方：首頁的往年今日建築、Timeline 的每一天 |
| `_data/little.yml` | 小事（例如散步遇到柴犬），在今天的建築旁出現一週 |
| `_config.yml` | 網站資訊、哪些檔案要建置 |
| `assets/css/`、`assets/js/` | 首頁：`day.css`、`day.js`（建築模型 `SCENES`、Timeline、terminal、依太陽變色）、`pixel-engine.js`（產生的檔案）。文章頁：`site.css`、`theme.js`（日夜切換）、`post.js`。Markdown 樣式在 `site.css` 的 `.post-prose`；文章圖片排版和點開放大在 `assets/js/post.js`（`buildFigures`、`buildLightbox`）和 `site.css` 的 `.post-fig`、`.post-gallery`、`.lb` |
| `assets/vendor/pixel-plays/`、`scripts/pixel-engine/` | Pixel Plays 引擎原檔（MIT，作者 AmirMushich，`LICENSE` 在同一個資料夾）和把它轉成 `assets/js/pixel-engine.js` 的程式 |
| `assets/og/`、`scripts/og/`、`.github/workflows/og.yml` | 分享卡片：圖檔、產生程式、自動執行的 Action |
| `assets/icons/`、`assets/fonts/`、`assets/images/` | favicon、文章字型、文章圖片 |
| `notes/`、`works/` | `/notes/`、`/works/` 網址轉到首頁的 `?view=notes`、`?view=works`，首頁會捲到 terminal 並執行 `ls notes`／`ls works`。文章頁的 `cd ..` 不經過這裡：從 notes 清單點進來的文章用瀏覽器的「上一頁」回去，其他情況直接連到 `/?view=notes`（`assets/js/post.js` 的 `backToNotes`） |
| `sitemap.xml`、`robots.txt` | 給搜尋引擎的檔案 |
| `CLAUDE.md` | 給 Claude 的工作規則（例如：改檔案時要同時更新 README） |

### 注意事項

| 項目 | 說明 |
|---|---|
| `assets/js/pixel-engine.js` | 產生的檔案，不要直接改。改 `assets/vendor/pixel-plays/engine.js` 或 `scripts/pixel-engine/build.js` 後重新產生（見 3.3） |
| 首頁網址 | `#timeline`、`#day-YYYY-MM-DD`（Timeline 停在那天；同一天第二棟以後加 `-2`、`-3`）、`#past-YYYY-MM-DD`（以那天的建築為主的首頁）、`#work-<slug>`（一件作品）。分享這些網址會直接打開那個畫面 |
| `assets/og/` | Action 自動產生並 commit，不要手動改或刪 |
| 草稿 | repo 裡目前沒有草稿。要把草稿放進 repo，就放在根目錄，檔名結尾用 `.draft.md`，不會上線 |
| 不會上線的檔案 | 根目錄的 `*.draft.md`、`README.md`、`CLAUDE.md`、`scripts/`、`assets/vendor/`、`assets/og/manifest.json`（`_config.yml` 的 `exclude`） |
| 文章網址 | `published/2026-10-29-題目.md` → `/published/2026-10-29-題目.html`。改檔名會改網址，舊連結會失效 |

---

## 2. 可以調整的設定

只列出要自己動手改的設定。字數、sitemap、分享卡片這些會自動產生，不用管。

### 2.1 網站資訊：`_config.yml`

| 設定 | 預設 | 說明 |
|---|---|---|
| `title` | `Yen Lai` | 文章頁標題的後半段（「標題 · Yen Lai」） |
| `description` | 一句英文 + 一句中文 | 首頁的搜尋摘要 |
| `url` | `https://laiyenju.github.io` | 換網域時要改 |
| `author.name` | `Yen Lai` | 結構化資料的作者 |
| `author.twitter` | `theYenLai` | X 分享卡片的帳號 |
| `og_image` | `/assets/og/home.jpg` | 文章的卡片還沒產生時，先用這張 |
| `lang` | `zh-Hant` | 頁面語言。單一頁面可以在 front matter 用 `lang` 覆蓋（`index.md` 設成 `en`） |

### 2.2 文章：front matter

| 欄位 | 必填 | 預設 | 說明 |
|---|---|---|---|
| `title` | 是 | — | 標題 |
| `subtitle` | 否 | 無 | 副標題，置中顯示在標題下方。不填就沒有這一行 |
| `date` | 是 | — | 格式 `YYYY-MM-DD`。決定排序和顯示的日期（不是看檔名的日期）；`total` 字數只算今年的文章 |
| `description` | 否 | 內文前 120 字 | 搜尋摘要，也是分享卡片上的摘要 |
| `lang` | 否 | `zh-Hant` | 英文文章填 `en`，會改 `<html lang>` 和 `og:locale`。結構化資料的語言固定是 `zh-Hant`（`_includes/seo.html`） |

### 2.3 作品集：`_data/works.yml`

一件作品一筆，terminal 的 `ls works` 依檔案順序列出，點了打開那件作品的頁面（`#work-<slug>`）：

```yaml
- slug: design-lint          # 網址用，英文小寫和 -
  year: "2026"               # 文字，可以寫 "2024–25"
  title: Design Lint
  sub: 一句話說明
  role: Design and build
  problem: 當時的問題
  did: Yen 做了什麼
  result: 結果
  url: https://…             # 選填；只放公開的頁面，私人 repo 不要放
  url_label: open the presentation   # 選填，連結文字，預設 open the portfolio
```

全部用英文寫（網站介面一律英文，只有文章可以是中文）。

### 2.3.1 去過的地方：`_data/days.yml`

一筆是一天、一棟建築。建築底下的句子由同一條規則組出來：`{幾年前}, {prep} {place}, Yen {did}[ with {with}].[ {extra}]`

| 欄位 | 必填 | 說明 |
|---|---|---|
| `date` | 是 | `"YYYY-MM-DD"`，要加引號。同一天可以有好幾筆（好幾棟建築），網址會依順序變成 `#day-2019-01-26`、`#day-2019-01-26-2`… |
| `scene` | 是 | 建築模型的名字，要先在 `assets/js/day.js` 的 `SCENES` 裡有這個模型。目前有：`studio`（工作地點：富邦遼寧大樓）、`home`（家）、`itsukushima`、`naoshima`、`grandcentral`、`unitednations`、`google`、`highline`、`whitney`、`nyt`、`capitol`、`whitehouse`、`washington`、`lincoln`、`mbc`、`hongik` |
| `name` | 是 | 英文名稱 |
| `zh` | 是 | 中文名稱。不要中文時改寫 `no_zh: true` |
| `place` | 是 | 城市或地區，例如 `Sangam, Seoul`，會變成 Google Maps 連結 |
| `did` | 是 | Yen 做了什麼，小寫開頭、不加句號 |
| `prep` | 否 | `in`（預設）或 `on`（島） |
| `with` | 否 | 同行者，一個人或一串 `[Mei, Ken]` |
| `extra` | 否 | 補充一句 |
| `map` | 否 | Google Maps 搜尋文字，預設用 `name, place` |
| `country` | 否 | 預設 `Japan`。Timeline 的國家數由它算 |

缺必填欄位、沒有中文名、或模型不存在時，那一筆不會出現，瀏覽器的 console 會列出缺了什麼。

### 2.3.2 小事：`_data/little.yml`

```yaml
- date: "2026-11-02"
  kind: shiba               # 模型畫得出來的：shiba
  text: Yen met a Shiba Inu on a walk this week.
```

從 `date` 起七天內，今天的建築旁會出現這個角色，句子接在自我介紹後面。

### 2.4 首頁內容

| 設定 | 位置 | 預設 | 注意 |
|---|---|---|---|
| 自我介紹 | `assets/js/day.js` 的 `BIO` | `Product manager in Taipei. Writes about how products get decided.` | 今天的建築底下和 terminal 的 `whoami` 都用它。一起改：文章頁 `whoami`（`assets/js/post.js`）、首頁分享卡片文字（`scripts/og/build.js`）、職稱（`_includes/seo.html` 的 `jobTitle`） |
| 社群連結 | `assets/js/day.js` 的 `whoami` | github、linkedin、x | 首頁不直接放連結，要執行 `whoami` 才看得到。一起改：`_includes/seo.html` 的 `sameAs`；X 帳號另有 `_config.yml` 的 `author.twitter` |
| 平日／假日 | `assets/js/day.js` 的 `HOLIDAYS` | 週六日和固定日期的國定假日（元旦、228、兒童節、勞動節、國慶）是「家」，其他是「工作室」 | 農曆假日（春節、清明、端午、中秋）每年日期不同，要每年補進 `HOLIDAYS` |
| 所在城市 | `assets/js/day.js` 的 `CITY` | 台北（緯度、經度、時區 +8） | 決定頂部時間、背景顏色和影子方向。出國時改這裡 |
| 「Where is Yen now」的作息 | `assets/js/day.js` 的 `WEEKDAY`、`RESTDAY` | 平日：00–07 asleep、07–09 on the way to the office、09–12 at the office、12–13:30 lunch、13:30–18:30 at the office、18:30–19:30 on the way home、之後 at home；假日另一張表 | `CHECKIN` 之後會接自動打卡（見第 4 節） |
| terminal 按鈕 | `assets/js/day.js` 的 `CHIPS` | About Yen、Notes、Work、Where is Yen now、Clear | 在 terminal 裡面。按鈕寫白話，點了 terminal 會打出真正的指令。可輸入的指令在 `COMMANDS` |
| 首頁的指令按鈕 | `assets/js/day.js` 的 `QUICK`；樣式在 `assets/css/day.css` 的 `.quick` | `$`、whoami、ls notes、ls works、whereis yen | 按鈕直接寫指令，讓人知道下面有 terminal。點了會捲到 terminal 並執行；點 `$` 跳到輸入框。寬螢幕（≥ 900px）放在今天的說明下面，只在今天的建築出現；手機固定在畫面底部，看得到 terminal 的按鈕、正在輸入、打開 Timeline／作品頁、或在往年今日時會隱藏 |
| 瀏覽器分頁標題 | `index.md` 的 `title` | `hey, I'm Yen` | |

### 2.5 外觀

| 設定 | 位置 | 預設 | 其他選項／注意 |
|---|---|---|---|
| 首頁顏色 | `assets/js/day.js` 的 `BG_STOPS`、`lightFor` | 跟著 `CITY` 的真實太陽高度變：白天接近白、黃昏暖色、夜晚深藍；晚上窗戶亮燈 | 首頁沒有日夜切換按鈕 |
| 首頁字級 | `assets/css/day.css` 的 `.caption .name`、`.caption .note`、`.when b` | 今天的標題 21px、說明 17px；頂部日期首頁 14px、Timeline 19px | |
| 建築大小 | `assets/js/day.js` 的 `sizeStage`、`fitCanvas`（`* .86`）、`fitTl`（`* .86`） | 手機上建築約佔畫面 46% 高 | |
| Timeline 的動畫 | `assets/js/day.js` 的 `buildUp`（一磚一磚，磚塊 4×3 像素）、`dissolve`、`MOVE` | 蓋起來 0.9 秒、溶解 0.2 秒、首頁和 Timeline 之間移動 0.48 秒 | 系統設定「減少動態效果」時都直接跳到結果 |
| Timeline 的尺標 | `assets/js/day.js` 的 `renderRuler`；樣式在 `assets/css/day.css` 的 `.ruler-track` | 每棟建築一格、等距排列（同一天的建築間距減半），最舊的在左邊；不標年份（頂部日期已經有） | 點一格跳過去；手指按住左右滑可以快速切換（滑動時不播動畫，放開就停在那棟）；鍵盤可用左右方向鍵 |
| 文章頁日夜主題 | 讀者自己選（文章頁） | `auto`（跟隨系統） | `day`、`night`。存在讀者的瀏覽器裡 |
| 強調色 | `assets/css/site.css`：日間 `:root` 的 `--accent`，夜間 `body.theme-night` 的 `--accent` | 日間 `#b5531e`（朱）、夜間 `#f5b942`（琥珀） | 文章頁另有 `--shu`（`.post-prose`，內文標題也用這個顏色），分享卡片在 `scripts/og/card.html`，要一起改 |
| 文章頁底色 | `assets/css/site.css` | 日間 `#fafaf7`、夜間 `#0d0f12` | 兩個顏色都直接寫在很多條規則裡，要全文搜尋取代。`_includes/seo.html` 的 `theme-color`、`notes/index.html`、`works/index.html`、`scripts/og/card.html`（只有日間）也有 |
| 網頁字型 | 文章頁 `_includes/head.html`、首頁 `_layouts/home.html`（Google Fonts） | JetBrains Mono、Noto Sans TC | 文章內文是 iA Writer Quattro（`assets/fonts/quattro/`，在 `site.css` 開頭載入） |
| 文章圖片排版 | `assets/css/site.css` 的 `.post-fig`、`.post-gallery` | 單張和內文同寬；直式圖片（高 > 寬 × 1.1）寬度 `80%`；同一段有兩張以上時並排，總寬 `960px`，間距 `20px`；手機（≤ 640px）上下排列 | 並排的圖片會伸到側欄，`post.js` 會把側欄註腳往下推，避開圖片 |
| 圖片放大檢視 | `assets/css/site.css` 的 `.lb`（`assets/js/post.js` 的 `buildLightbox`） | 寬螢幕：左欄 `320px` 放關閉、圖說、上一張／張數／下一張，細線隔開右邊的圖片；窄螢幕（≤ 767px）：上面關閉和箭頭，下面張數和圖說 | 鍵盤：Esc 關閉、左右鍵切換；手機左右滑動切換；點圖片關閉。一篇文章的圖片會依序循環 |
| 註腳放側欄的最小寬度 | `assets/js/post.js` 的 `RAIL_MIN` | `1088`（px） | 較窄時放文末。要和 `site.css` 的文章欄寬（680px）一起算 |

### 2.6 介面語言

首頁全部是英文，只有文章標題和地點的中文名（`zh`）是中文。文章頁沒有設定可以改：瀏覽器第一語言是中文就顯示中文，其他顯示英文。文章頁新增介面文字時，兩種語言都要寫：

| 位置 | 寫法 |
|---|---|
| HTML | `<span class="i-en">…</span><span class="i-zh">…</span>` |
| JS | `t("English", "中文")` |
| `aria-label`／`title` | 預設寫英文，中文寫在 `data-label-zh`／`data-title-zh` |

---

## 3. 流程

### 3.1 寫作與發布

```mermaid
flowchart LR
  A["iA Writer 寫稿"] --> B["Obsidian 整理"]
  B --> C["移到 published/<br/>改名 YYYY-MM-DD-題目.md"]
  C --> D["git push main"]
  D --> E["GitHub Pages 建置上線"]
  D --> F["og.yml 畫分享卡片<br/>commit 回 main"]
  F --> E
```

1. 草稿可以不放進 repo；要放的話見第 1 節的「草稿」。
2. 發布 = 把檔案移進 `published/`，檔名用 `YYYY-MM-DD-題目.md`。
3. 寫好 front matter（見 2.2）。
4. `git push` 到 `main`，其他都是自動的。

內文標題（`##` 到 `######`）後面接一般段落時，會併進那一段的開頭，用強調色顯示（`assets/js/post.js` 的 `runInHeadings`）；後面接清單、表格、圖片或另一個標題時，自己一行。標題不要寫得太長，讀起來才像段落的開頭。

圖片的寫法：`![替代文字](/assets/images/檔名.jpg "圖說")`。引號裡的文字是圖說，不寫就沒有圖說。一張圖自己一段；要並排就把兩張以上的圖片放在同一段（連續幾行，中間不空行）。

notes 清單顯示的是 `title`；從清單點開文章時，`cat` 指令和分享卡片上的檔名會去掉日期（`markdown-styles.md`）。

### 3.2 分享卡片（自動）

```mermaid
flowchart TD
  P["push 到 main<br/>改到 published/**、index.md 或 scripts/og/**"] --> W["og.yml"]
  W --> N["安裝 Node 20 + Playwright 1.48.2 + Chromium"]
  N --> B["node scripts/og/build.js"]
  B --> H{"hash（card.html + 卡片文字）<br/>和 manifest.json 一樣？"}
  H -- 一樣 --> S["跳過"]
  H -- 不一樣 --> R["用 card.html 截圖<br/>寫入 assets/og/檔名.jpg"]
  B --> X["刪掉已不存在文章的卡片"]
  R --> M["更新 manifest.json"]
  M --> C["有變動就 commit<br/>「Update share cards」並 push 到 main"]
```

- 改了 `card.html`，所有卡片都會重畫。新文章的卡片產生前，先用 `home.jpg`。
- 目前的三張卡片是手動產生後 commit 的，Action 還沒有自己 commit 過卡片。第一篇新文章 push 後，到 GitHub → Actions 確認它有執行成功。
- 也可以在 GitHub → Actions → Share cards → **Run workflow** 手動執行。
- 本機執行：

  ```bash
  npm install --no-save playwright && npx playwright install chromium && node scripts/og/build.js
  ```

### 3.3 pixel 引擎（手動產生）

```mermaid
flowchart LR
  V["assets/vendor/pixel-plays/engine.js<br/>（原檔，不改）"] --> B["scripts/pixel-engine/build.js"]
  B -- "node（手動）" --> O["assets/js/pixel-engine.js"]
  O --> H["home.html（先載入）"]
  D["assets/js/day.js"] --> H
```

`build.js` 把原本只畫一個場景的引擎包成 `createPixelEngine(canvas, SCENE)`，讓首頁可以同時有好幾個場景，並加上每個場景的畫布大小、比例和平面旋轉。改了原檔或 `build.js` 之後執行，再把 `pixel-engine.js` 一起 commit：

```bash
node scripts/pixel-engine/build.js
```

新增建築模型不用重新產生：模型寫在 `assets/js/day.js` 的 `SCENES`。

### 3.4 本機預覽

```bash
jekyll serve
```

首頁的資料是 Jekyll 寫進頁面的，所以要用 `jekyll serve` 看，不能直接打開 HTML 檔。

輸出在 `_site/`（已在 `.gitignore`）。

---

## 4. 待處理

| # | 項目 | 狀況 | 建議 |
|---|------|------|------|
| 1 | `published/2026-03-08-hello.md` | 範例文章，已公開上線、在 sitemap 裡 | 第一篇正式文章上線後刪除 |
| 2 | `published/2026-10-29-markdown-styles.md` + `assets/images/markdown-sample*.svg`（三張） | 樣式測試頁，也公開上線 | 想保留當測試頁，可移到根目錄改成 `.draft.md`（但本機預覽就看不到）；或加 front matter `sitemap: false`，並在 `sitemap.xml`、首頁 notes 清單加條件排除 |
| 3 | 「Where is Yen now」的自動打卡 | 目前只用作息表推算（`day.js` 的 `CHECKIN` 是 `null`） | 網站穩定後再設定 iPhone 捷徑：抵達或離開時更新一個只有文字標籤的檔案 |
| 4 | 農曆國定假日 | `HOLIDAYS` 只有固定日期的假日 | 每年補一次 |
