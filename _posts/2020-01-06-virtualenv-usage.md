---
layout: post
title: 虛擬環境操作手冊
slug: virtualenv-usage
date: 2020-01-06
status: publish
author: Lai Yen Ju
categories: 
  - Programing
tags:
  - Programing
excerpt: virtualenv 與 anaconda 操作虛擬環境的常用指令。
---


<!--more-->

很常見到網路上許多人建議開發 Python 專案前，要先建立一個「虛擬環境」。 身為 Python 新手的我們就想問：

- 什麼是虛擬環境？

- 為何要特別建立虛擬環境？

- 如何建立虛擬環境？

虛擬環境就像個隔離室，由於各種開發套件的版本各不相同，像 Mac 預設的 Python 版本是 2.7 ，但最新的 Python 版本都來到 3.8 了，若我們又另外安裝 Python 3.8 到電腦上，這樣電腦就有兩種版本的 Python，會分不清楚該使用哪種版本，必須另外下指令告訴電腦，但是這種複雜的環境設定流程，對初學者而言真的很痛苦。

為了避免因專案開發新安裝的套件，與電腦本機環境的套件互相干擾，因此才會有虛擬環境作為隔離室，當要進行一項新的專案開發，只要建立一個供該專案使用的虛擬環境，開發專案新安裝的套件只限於在該專案用，就不會干擾到電腦本機環境的其他套件，虛擬環境也保護開發的專案不受到干擾，彼此井水不犯河水。

Python 使用者較常使用的虛擬環境就是 Anaconda 與 Virtual Environment 兩種，以下是他們的建立方式與操作方法。


## 使用 Anaconda

- 建立新的 anaconda 虛擬環境

  在終端機輸入：`conda create --name <ENV_NAME>`

- 啟動環境

  在終端機輸入：`conda activate <ENV_NAME>`

- 退出環境

  在使用<ENV_NAME>的環境下，輸入：`conda deactivate`

- 查看已安裝的虛擬環境有哪些

  在終端機輸入：`conda info --en`

- 刪除虛擬環境

  在終端機輸入：`conda remove <ENV_NAME> --all`

  > 若執行 `conda remove <ENV_NAME> --all` 卻未清除乾淨（查看已安裝的環境，仍出現被刪除的虛擬環境），可使用 `conda env remove --name <ENV_NAME>` 指令刪除。


## 使用 Virtual Environment

- 安裝 virtual environment 套件

  在終端機輸入：`pip3 install virtualenv`

- 查看 pip3 安裝的套件

  在終端機輸入：`pip3 list`

- 建立虛擬環境

  以終端機進入專案資料夾內，輸入： `virtualenv <ENV_NAME>`

  > 若使用 VScode 編輯器建立虛擬環境會更方便，因為 VScode 會自動為此專案設定好虛擬環境的路徑，以後開這個專案資料夾就會固定開啟此虛擬環境。

- 啟用以建立好的虛擬環境

  確認終端機位於專案資料夾內，再輸入：`source./<ENV_NAME>/bin/activate`

- 離開虛擬環境

  在終端機輸入：`deactivate`

  > 要使用哪種方式，端看個人喜好。相較於操作有點複雜但功能強大的 Anaconda，我自己目前較喜歡操作單純的 Virtual Environment，只要熟悉使用 command line 就能上手，也不需要其他前置設定。但未來仍會再花時間理解 Anaconda 的虛擬環境。
