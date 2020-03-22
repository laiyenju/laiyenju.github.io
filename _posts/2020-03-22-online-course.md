---
layout: post
title: 週末在家，但不想寫論文的時候
slug: online-course
date: 2020-03-22
status: publish
author: Lai Yen Ju
tags:
  - Programing
excerpt: 就去看數據分析、資料視覺化的免費線上課程
---

> 就去看數據分析、資料視覺化的免費線上課程啊

我最近很常尋找各種免費線上資源，最喜歡週末宅在家，不出門社交的生活。作為這麼宅，但偏偏又不想寫論文的研究生，此時的學習能量反而大爆發。

## 紐時首席數據科學家解密心法

Christopher Wiggins 是《紐約時報》數據分析團隊首領，我前幾天正好見到 Towards Data Science 的 YouTube 發布新影片，點進去才發現是 CW 在 Toronto Machine Learning Summit 的演講。影片主要分享《紐時》應用機器學習的方法論，雖然說是方法論，但 CW 的講解平易近人，即使是對機器學習沒什麼概念的人，也能理解數據分析在機器學習能扮演的功能。或許這跟 CW 本身也在哥倫比亞大學任教，為沒有任何數據基礎的同學開設數據分析課有關吧？

> 👉 [Data Science at The New York Times](https://www.slideshare.net/chrishwiggins/data-science-at-the-new-york-times-152727126)：這場演講的完整簡報。一直沒找到最新版，但這份是 2019 年 1 月上傳的，所以內容差異不大。
> 
> 👉 [data: past, present and future](https://data-ppf.github.io)：CW 在哥大開的數據分析課，2020 年的講義與程式碼練習題都放在線上，自由取用。我決定這學期要將他的課看完
> 
> 👉 [@chrishwiggins](https://twitter.com/chrishwiggins)：CW 的推特帳號，雖然都沒更新，但抱著朝聖心態仍要追起來～
> 
> 👉 [chrishwiggins](https://github.com/chrishwiggins)：CW 的 GitHub 帳號，更新的非常勤快（因為哥大教材就放在 GitHub 上）

<iframe width="560" height="315" src="https://www.youtube.com/embed/ffwYAqqGaj8" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

#### 隨手 takeaway

1. 《紐時》的數據視覺化團隊是門面，數據分析團隊是基石。Chirs Wiggins 帶領的數據分析團隊負責為商業運營、訂閱制等商業模式提供解答。
2. 通常數據分析團隊的解讀方式有三個：客觀模式（descriptive modeling）、預測模式（predictive modeling）、指示模式（prescriptive modeling）
3. descriptive modeling 的目的在於挖掘、綜觀現況，[NYT Reader Scope](https://www.erincoughlin.com/nyt-readerscope) 就是 descriptive modeling 的應用服務，從讀者喜好、停留的位置等，為《紐時》了解讀者的面貌。
4. predictive modeling 則能延續 descriptive modeling 的功能，從中學習、測試，讓數據模型有預測能力。例如：[Project Feels](https://open.nytimes.com/how-does-this-article-make-you-feel-4684e5e9c47) 計畫是《紐時》以機器學習模型分析讀者閱讀情緒，透過搜集、分析情緒資料後，推薦適合讀者的文章。
5. prescriptive modeling 在演講中被形容的很神，能為未來的目標制定相應的執行方案，類似 predictive modeling 的延伸功能。因此我猜測培養讀者的閱讀喜好，是可能的應用方式之一。

## 數據視覺化：難的 vs 簡單的

#### 拯救徒手繪圖障礙者的 Processing

先講簡單的。丹麥數位藝術家 Tim Rodenbröker 因應大家都宅在家防疫，所以開設免費線上課程，教大家從零開始學習 Processing。Processing 是以 Java 為主的視覺化工具，因為易學、好上手，所以是許多藝術家、互動設計師愛用的工具，熟悉的話，能在短時間內製作複雜的視覺動畫。目前課程仍在陸續更新中，不過大部分都已有教學影片了，我自己花半天的時間就能透過教學影片熟悉 Processing，相信有寫程式經驗的人肯定更快上手。（看著自己親手做出來的動畫，超有成就感！）

> 👉 [Creative Coding Essentials](https://timrodenbroeker.de/courses)：Tim 的 Processing 教學影片，共 27 堂課，依我之前看的內容，大概只缺少 5 堂而已。
> 
> 👉 [tim rodenbröker creative coding](https://www.youtube.com/channel/UCPwg5nDMQWzkAfb56_GvGpA)：Tim 的 YouTube 頻道，真的是對教學很有熱忱的人，且不愧是藝術家＋設計師，影片精美程度技壓其他程式教學影片。
> 
> 👉 [@timrodenbroeker](https://twitter.com/timrodenbroeker)：Tim 的推特帳號，這麼多產的藝術設計師，當然是要來觀摩視覺化作品。
> 
> 👉 [Processing.py 語法參考](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=2ahUKEwj5uYeGq67oAhX3yosBHeovDBkQFjAAegQIBhAC&url=https%3A%2F%2Fpy.processing.org%2F&usg=AOvVaw0DwzoYf-g62WSSRuoUzHUX)：跟我一樣習慣寫 Python 的話，推薦 Processing.py，在 Processing 內下載 Python 套件，在編輯頁更改成 Python 模式，就能少打很多 { } 

#### 重新認識 D3.js

再來是難的。只要是接觸資料視覺化的人，大概多少都要碰點以 JavaScript 為基礎的 D3.js 。由於我不小心看了 [The Hitchhiker’s Guide to d3.js](https://medium.com/@enjalot/the-hitchhikers-guide-to-d3-js-a8552174733a) 這篇經典文章，內容將 D3.js 學習路徑與目標說明的很清楚，讓我重燃提升 D3.js 技能的動力。因為內容提供了眾多資源，我一時之間也無法全部消化完，所以決定從最經濟實惠的路徑著手：FreeCodeCamp。互動式的程式教學，且完成後能獲得資料視覺化證書，嗯，非常完美。我在週日的凌晨一口氣上完，剩最後的專案實作囉。

> 👉 [FreeCodeCamp Data Visualization](https://www.freecodecamp.org/learn)：就是這門課程，共分為三大部分，第一部分是基本語法，再來是 JSON 與 API 的操作，最後一部分就要自己實作各種圖表。
> 
> 👉 [@mbostock](https://twitter.com/mbostock)：Mike Bostock 是 D3.js 的爸爸，這位生父對資料視覺化的狂熱，讓他後來生出了 Observable 這款 JavaScript 版本的 Jupyter Notebook。
> 
> 👉 [List of Graphics People in Newsrooms](https://github.com/OpenNewsLabs/news-graphics-team)與[Awesome Interactive Journalism](https://github.com/wbkd/awesome-interactive-journalism)：這兩個清單分別是各個資料視覺化記者的 twitter 帳號與數據新聞作品，大部分都是以 D3.js 呈現，看看就知道 D3.js 的強大。

***

在學 Processing 跟 D3.js 途中還分心看了[愷開寫程式 / Kalan Coding](https://www.youtube.com/channel/UClRBL3rMRZ-THDYxH4rqVWA)，教大家使用 Sonic Pi 以程式碼寫音樂的[教學影片](https://www.youtube.com/watch?v=aTA5wWhvKAQ&t=3s)，最後愷開用 Sonic Pi 寫一小段 Why Not 的無法度按捺，帶我認識了這個復古台味樂團。

<iframe src="https://open.spotify.com/embed/track/5gm0rhCcCDHmW904wG36sC" width="300" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>

好，下週末的計畫是邊聽歌邊用 Sonic Pi 寫個小 demo。
