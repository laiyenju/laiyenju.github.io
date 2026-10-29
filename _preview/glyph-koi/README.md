# 字根錦鯉（glyph koi）原型

用倉頡字根取代 ASCII 字元畫錦鯉，並排比較三種樣式：

- **A · 現在的版本**：原本的 ASCII 字元和色塊（`ASCII` 主題，行為和正式網站相同）
- **B · 日間**：明體字根印在紙上，紅斑是朱砂印章格（`GLYPH_DAY`）
- **C · 夜間**：琥珀磷光終端機，點陣字根，紅斑改成反白（`GLYPH_NIGHT`）

正式網站的 `assets/vendor/ascii-sharks/` 和 `assets/js/ocean.js` 都沒有改動。
這裡的 `src/` 是複製出來的版本，多了 `themes.ts`，renderer 改成從主題讀字元、顏色和格子比例。

## 檔案

| 檔案 | 用途 |
|---|---|
| `src/themes.ts` | 三個主題：字元組、顏色、格子比例、字型 |
| `src/renderer.ts` | 從主題讀設定；字根模式不畫色塊，改畫淡墨暈 + 字 |
| `entry.ts` | 打包入口，輸出 `window.GlyphOcean`、`window.GlyphThemes` |
| `glyph-ocean.js` | 打包結果 |
| `page.html` | 對照頁內容；`index.html` 由它產生 |

## 重新打包

```bash
npx esbuild@0.24.0 entry.ts --bundle --format=iife --target=es2020 --outfile=glyph-ocean.js
```

## 本機預覽

`_preview/` 開頭是底線，Jekyll 不會建置它，所以直接開靜態伺服器：

```bash
npx http-server _preview/glyph-koi -p 8123
```
