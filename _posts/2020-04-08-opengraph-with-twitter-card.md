---
layout: post
title: Open Graph 搭配 Twitter Cards 實現部落格的社群平台顯圖效果
slug: opengraph-with-twitter-card
date: 2020-04-08
status: publish
author: Lai Yen Ju
feature_image: images/twittercard.png
tags:
  - Programing
excerpt: 很多人使用 Open Graph 結合 Twitter Card，讓自己的文章被分享到社群平台時，能出現顯圖。我也嘗試使用這個方式，將學到的觀念記錄下來。
---

## 寫在動手之前

我的部落格是用 Jekyll + GitHub 打造的，要加入顯圖的話，就需要在每個網頁都引用到的 default.html 預設模板內動手新增程式碼。

```
# 我的 Jekyll 網站結構

-- _layouts #網頁模版資料夾
    -- default.html  #要新增程式碼的檔案
    -- page.html
    -- post.html
    -- tags.html
    
-- _posts  #文稿資料夾
    -- article1.md
    --article2.md

-- images  #圖片資料夾（顯圖與網站 logo 放這裡）
    -- favicon.png
    -- feature_image1
    -- feature_image2

-- _assets
-- data    
-- _config.yml  # 網站設定檔，設置顯圖要參照這個檔案的設定
-- index.html   # index.html 是首頁, tags.md, about.md 是網站的子頁面 
-- tags.md
-- about.md
```

新增的程式碼都是 metadata，要寫在 default.html 的 `<head>` `</head>` 區塊內。

## Twitter Cards 與 Open Graph 的關係




| Twitter Cards        | Note                                                                          | Open Graph     | Note             |
| -------------------- | ----------------------------------------------------------------------------- | -------------- | ---------------- |
| twitter: card        | 必填。代表 twitter card 的樣式，<br> 定為summary_large_image 才會有顯圖。     |                |                  |
| twitter: site        | 必填。代表部落格或網站的 twitter 帳號，<br> 沒有的話就寫自己的 twitter 帳號。 | og:site_name   | 部落格或網站名稱 |
| twitter: creator     | 文章有共同作者，可使用此參數                                                  |                |                  |
| twitter: title       | 必填。文章標題                                                                |                |                  |
| twitter: description | 文章摘要                                                                      | og:description | 文章摘要         |
| twitter: image       | 顯圖                                                                          | og:image       | 顯圖             |
|                      |                                                                               | og:url         | 文章網頁連結     |


從上表可知，twitter 與 Open Graph 的「文章摘要」、「顯圖」有重疊功能，這樣我們就不用寫過多的 metadata，整合後的程式碼就會如下：

1. 每篇文章的文檔 front matter 要設定 feature_image，作為顯圖。
2. 不論 jekyll 模板是否有 page 或 post 區別，只要是文稿，參數都是 page。

```
# 這是 markdown 文稿內的 front matter 寫法
---
title: 文章標題
category: 文章類別
tags: 文章標籤
feature_image: images/image1
---

# 以下是文章內容
```

完整的網站 metadeta 寫法 👇

<script src="https://gist.github.com/laiyenju/8fa4aaad9364085070160fa4da733a5c.js"></script>

### 成功！👏👏👏

<blockquote class="twitter-tweet"><p lang="zh" dir="ltr">做設計研究很花時間，想辦法讓網站文章有 twitter cards 也滿花時間的😅 <a href="https://t.co/X4yF0T1wa9">https://t.co/X4yF0T1wa9</a></p>&mdash; Yen👩🏼‍🚀 口試準備中 (@theYenLai) <a href="https://twitter.com/theYenLai/status/1247810860656910338?ref_src=twsrc%5Etfw">April 8, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

---

## 可能會不小心掉進去的幾種坑

### 有些文章沒有圖，顯圖要用什麼？

可以使用條件式決定顯圖方式，寫法如下

<script src="https://gist.github.com/laiyenju/cb883472b4e825bbde5db88f00f293fa.js"></script>

使用 `{% if page.feature_image %} ..{% endif %}` 條件式處理文章內有圖與沒圖的顯圖效果。當文章沒設定 feature_image 時，顯圖可以用網站的 favicon。

設定圖片連結時，要特別注意圖片連結的位置。由於我的 feature_image 與 favicon 都是相對位置
- feature_image 寫在文稿的 front matter 內：`feature_image:images/image1`
- favicon 寫在 _congif.yml 內：`favicon: images/favicon.png`

因此feature_image 依附在 page 裡，favicon 依附在 site，但 meta data 的顯圖必須是完整網址，以我的網站為例，顯圖網址要寫成 `https://laiyenju.github.io/images/image1`，是由「網站首頁位置」加上「存放顯圖的位置」組合而成，所以 metadata 會寫成`<meta property="og:image" content="{{ site.url }}/{{ page.feature_image }}">`，favicon 的 metadata 寫法也是以此原理類推。


### twitter:site 與 og:site_name 不同

這部分常讓人搞混，乍看會以為 twitter:site 跟 og:site_mame 都是網站名稱的欄位，但只有 og:site_name 能顯示網站名稱，twitter:site 則是網站在 twitter 上的官方帳號。

---

## 實測結果

關於 Open Graph 搭配 Twitter Card 達成網頁分享顯圖的效果，因為我主要是以 Twitter 作為分享管道，花較多心力在調整 Twitter Card 的視覺呈現，測試後確定在 Twitter 與 Facebook 分享的呈現效果最好，但無法保證在每個平台都奏效。若希望自己的部落格文章的顯圖效果能普遍適用於其他平台，就需要再多了解 [Open Graph 協定](https://ogp.me)的細節。

#### 成功的管道

- Twitter，私訊跟公開貼文都成功
- Facebook，私訊跟公開貼文都成功
- LINE

#### 失敗的管道

- Telegram，只會有網站名稱、文章標題與摘要，沒有顯圖。
- iMessage，只有文章標題與網站 logo。


## 參考資料

- [讓網頁在 Twitter 推文時顯示圖片 - 在 github pages 中加上 Twitter Cards 與 Open Graph 標籤](http://rocksaying.tw/archives/2016/讓網頁在Twitter推文時顯示圖片-在github-pages中加上Twitter-Cards.html)
- 因為網站架設方式會略有不同，若遇到問題，或想使用其他種類的 twitter cards，可以翻找 [Twitter Cards 官方說明文檔](https://developer.twitter.com/en/docs/tweets/optimize-with-cards/overview/summary-card-with-large-image)
- 想了解更多 Open Graph 與 Twitter Cards 的關係，請看官方文檔 [Optimize Tweets with Cards](https://developer.twitter.com/en/docs/tweets/optimize-with-cards/guides/getting-started#opengraph)
- 想知道文章的顯圖是否成功，可將文章連結貼到 [Twitter Card 預覽器](https://cards-dev.twitter.com/validator)測試。
