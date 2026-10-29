---
title: Markdown 樣式總覽
date: 2026-10-29
status: published
---

這篇文章用來檢視 Markdown 的渲染結果，會把常見的語法都放一次。段落之間是一般的空行。中文與 English 混排時，要看字距、行高與標點是否自然。

這是第二個段落，裡面有**粗體**、*斜體*、***粗斜體***、~~刪除線~~、`行內程式碼`，以及一個[文字連結](https://laiyenju.github.io)。也可以直接貼網址：<https://github.com/laiyenju>。

行尾加兩個空格可以強制換行，  
像這樣接在下一行。

## 二級標題

二級標題是文章裡最常用的分段。

### 三級標題

三級標題用在小節。

#### 四級標題

##### 五級標題

###### 六級標題

## 清單

無序清單：

- 第一項
- 第二項，文字比較長一些，用來檢查換行之後的縮排是否和第一行對齊，以及項目符號的位置。
- 第三項
  - 巢狀第二層
  - 巢狀第二層
    - 巢狀第三層

有序清單：

1. 準備
2. 寫作
3. 修改
   1. 刪掉多餘的字
   2. 重讀一次
4. 發布

待辦清單：

- [x] 選好題目
- [x] 寫完初稿
- [ ] 檢查樣式

## 引言

> 好的工具會消失在工作裡。
>
> 引言可以有好幾段，也可以包含 **粗體** 與 `程式碼`。
>
> > 這是巢狀的引言。

## 程式碼

```js
// 有標註語言的程式碼區塊
const koi = new OceanEngine(canvas, [{ kind: "koi", size: 0.62 }], 0);
koi.setCalm(true);
```

```python
def slow_down(thought: str) -> str:
    """寫作是把想法放慢的方法。"""
    return thought.strip()
```

```
沒有標註語言的程式碼區塊，以及一行很長很長很長的內容，用來檢查橫向捲動：const veryLongVariableName = someFunction(argumentOne, argumentTwo, argumentThree);
```

## 表格

| 語法 | 用途 | 數量 |
| :--- | :---: | ---: |
| `**粗體**` | 強調 | 12 |
| `*斜體*` | 語氣 | 8 |
| `[連結](url)` | 參照 | 104 |

## 圖片

![範例圖片的替代文字](/assets/images/markdown-sample.svg)

圖片下方可以接一段說明文字。

## 註腳

Markdown 的註腳寫在句子後面，[^note] 內容放在文章最後。[^long]

## 其他

分隔線：

---

定義清單：

ascii-sharks
: 一個用 ASCII 字元畫海洋生物的動畫引擎。

錦鯉
: 這個網站首頁游動的魚。

HTML 標籤：按 <kbd>Cmd</kbd> + <kbd>K</kbd> 插入連結；<mark>螢光標記</mark>；H<sub>2</sub>O；E = mc<sup>2</sup>。

<details>
<summary>可展開的區塊</summary>

展開之後才看得到的內容。

</details>

跳脫字元：\*這不是斜體\*、\# 這不是標題。

一個很長的網址，用來檢查換行：https://example.com/a/very/long/path/that/keeps/going/and/going/without/any/spaces/to/break/on

[^note]: 這是一個短註腳。
[^long]: 這是一個比較長的註腳，裡面也可以有 **粗體**、`程式碼` 和 [連結](https://example.com)，用來檢查註腳欄的換行與行高。
