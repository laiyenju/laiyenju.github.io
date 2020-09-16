---
layout: post
title: 什麼是盒模型（Box Model）
slug: what-is-box-model
date: 2020-09-17
status: publish
author: Lai Yen Ju
tags:
  - Programing
excerpt: 了解 CSS 盒模型的概念
---

從 CSS 的視角來看網頁物件的話，所有網頁上的物件都像是一個一個被盒子裝起來後，擺放在頁面上。

![](https://i.imgur.com/56qc2j7.png)

這些盒子就是 Box Ｍodel，由物件內到外，依序的組成元素包含：

- content 物件本身的內容
- padding 內容外，border 內的空間
- border 包覆內容的框線。
- margin 最外層的空間，包覆著 content、padding、border

![](https://mdn.mozillademos.org/files/16558/box-model.png)

Box Model 之所以重要，是因為不同的 Box Model 模式會影響到 CSS 採用的排版方式。一是 Box Model 與計算物件尺寸的方式有關，二是 Box Model 有兩種不同模式：block box 跟 inline box。

## Box Model 的兩種尺寸模式

在不同的 Box Model 尺寸模式下，一個物件採用相同的 CSS 樣式設定，會有不同的外觀尺寸。

```css
.box {
  width: 350px;
  height: 150px;
  margin: 10px;
  padding: 25px;
  border: 5px solid black;
}
```

**Box Model 尺寸模式一：standard box-model**

在 standard box-model 模式下，margin、padding 跟 border 是在 width、height 的基礎上，往外擴張，因此物件的實際寬度與高度，會大於 CSS 樣式表內設定的 width 跟 height。

- 物件的總寬度（total width）= width + padding + margin + boarder，
- 物件的總高度（total height）= height + padding + margin + border。

圖中的長方形，寬度（width）是 350px、高度（height）是 150px，但整個物件的實際寬度是 410px (350 + 25 + 25 + 5 + 5)、實際高度是 210px (150 + 25 + 25 + 5 + 5)。

![](https://mdn.mozillademos.org/files/16559/standard-box-model.png)

**Box Model 尺寸模式二：alternative box-model**

在 alternative box-model 模式下，物件的實際寬度與高度是將 padding 跟 border 納入 CSS 樣式表中的 width 跟 height 一起計算，所以實際寬度與高度會跟 CSS 樣式表中的 width 跟 height 設定一致。

只要在 CSS 樣式表中設定 `box-sizing: border-box;`，效果就會如圖中的長方形，寬度（width）是 350px、高度（height）是 150px，會根據設定的 width 跟 height 自動將 border 納入範圍內，不會超過設定值。這樣做的好處就是「設定的數值即是所見」。

![](https://mdn.mozillademos.org/files/16557/alternate-box-model.png)

## Box Model 的兩種排版模式：block box vs. inline box

**Box Model 排版模式一：block box 的特性**

每個 box 會獨立成一行，並填滿該行空間，寬度與高度能透過調整 padding、margin 達成。  
具備 block box 特性的物件有`<h1>`類型的標題、`<div>`、`<p>`。

**Box Model 排版模式二：inline box 的特性**

box 們會自動排成一列，且無法調整高度，只有寬度能透過 padding、margin 達成。  
具備 inline box 特性的物件有`<a>`、`<span>`、`<em>`、`<strong>`。

這些 HTML 標籤的物件都有預設的 Box Model 特性，為了讓排版時能更自由操作，我們能透過設定 CSS 樣式表的 `display` 的參數，替換預設值，由我們自己決定要讓物件在排版中採用哪種特性。

- `display: inline;` 設定物件是 inline box 特性
- `display: box;` 設定物件是 block box 特性
- `display: inline-box;` 設定物件同時具備 inline box 與 block box 的特性，讓物件們能並排成一列，同時也能透過 padding、margin 等調整寬度與高度，跳脫預設特性的限制
- `display: flex;` 設定物件是 flex box 的特性

## 參考資料

- [學習 CSS 版面配置：關於 position 屬性](https://zh-tw.learnlayout.com/position.html)
- [MDN: The box model](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model#What_is_the_CSS_box_model)
- [MDN: box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing)
- [MDN: HTML elements reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- [金魚都能懂的網頁設計入門 - 金魚都能懂了你還怕學不會嗎](https://ithelp.ithome.com.tw/users/20112550/ironman/2072)
