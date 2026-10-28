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
