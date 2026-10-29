# 字根錦鯉（glyph koi）首頁原型

正式首頁的複製版，文字、字體、版面都沿用 `assets/css/site.css` 和 `assets/js/home.js`，只換掉錦鯉：

- **日間**：明體倉頡字根，紅斑是朱砂印章格（`GLYPH_DAY`）
- **夜間**：點陣字根，琥珀磷光配色，紅斑改成反白（`GLYPH_NIGHT`）；文字只換顏色
- **原版字元**：原本的 ASCII 字元和色塊（`ASCII`）

預設跟著系統的淺色／深色設定，右下角可以切換。

## 錦鯉的游法

- **首頁**：錦鯉頭尾相接，圍著中間的 nav 和文字繞圈，彼此會調整速度保持等距（`World.setRing`）。
- **notes / works**：點下去錦鯉從點擊處散開，接著自由游動；游到清單上會加速通過。回到首頁會重新圍成一圈。
- 手機畫面太窄時，圈會拉成直立橢圓。

## notes / works 版面

- **notes**：一段 shell 對話。提示字元打出 `ls -lt`，每列照 `ls -l` 的欄位排：權限、字數、日期、標題。滑鼠移上去或用 ↑↓ 選到的那一列會反白，⏎ 開啟，esc 返回。手機上隱藏權限欄。
- **works**：每件作品一張規格卡，左邊是代表字印章（日間朱砂紅、夜間琥珀反白），標題右邊是狀態。
- 原型裡的字數是粗估；代表字和狀態是範例，正式版會從 `_data/works.yml` 讀取。

正式網站的 `assets/vendor/ascii-sharks/` 和 `assets/js/ocean.js` 都沒有改動。

## 檔案

| 檔案 | 用途 |
|---|---|
| `src/themes.ts` | 三個主題：字元組、顏色、格子大小、字型 |
| `src/renderer.ts` | 從主題讀設定；字根模式畫淡墨暈 + 字，不畫色塊 |
| `src/world.ts` | 新增環繞模式（`ring`、`free`、`setRing`） |
| `src/engine.ts` | 新增 `setRing(rect)` |
| `home-page.html` | 頁面內容；`index.html` 由 `build.py` 產生 |
| `glyph-ocean.js` | 打包結果 |

## 重新產生

```bash
npx esbuild@0.24.0 entry.ts --bundle --format=iife --target=es2020 --outfile=glyph-ocean.js
```

```bash
python3 build.py
```

## 本機預覽

`_preview/` 開頭是底線，Jekyll 不會建置它。從 repo 根目錄開靜態伺服器：

```bash
npx http-server . -p 8124
```

再打開 <http://127.0.0.1:8124/_preview/glyph-koi/index.html>。
