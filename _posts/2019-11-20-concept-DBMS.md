---
layout: post
title: 資料庫管理系統 DBMS 的概念
slug: concept-DBMS
date: 2019-11-20
status: publish
author: Lai Yen Ju
categories: 
  - Database
tags:
  - SQL
  - Note
excerpt: MacOS系統的 Git 操作指令與方法
---


💡 此為政治大學黃瀚萱助理教授開設的「資料庫應用」課程內容筆記

<!--more-->

資料庫管理系統 DBMS，Database Management System，也是 Database System。
> Database Management Systems，指的是用來管理資料庫的軟體，**為的是讓使用者方便且有效率的儲存、搜尋資料**，具有以下功能
> - **Create** 建立資料庫
> - **Query** 搜尋
> - **Update** 更新，包含 刪除、插入、修改
> - **control** 控制

Q：資料庫管理系統（DBMS）與資料庫的差別是什麼？
> 資料庫是資料的集合，不是軟體；DBMS 是管理資料庫的軟體。


### DBMS 的關鍵特色
沒有一種資料庫管理系統同時具備三種關鍵特色（有一好沒兩好），因此要看使用的情境去選擇合適的資料庫。
#### Reliability 可信賴
目標：安全性 for safety
- Hardware faults
- Software faults
- Human errors
#### Scalability 可擴充
目標：處理龐大資料量與讀寫次數多 for large data and high traffic
- Load
- Performance
#### Maintainability 可維護
目標：update/debug/migration
- Operability
- Simplicity
- Evolvability

### DBMS 的發展趨勢
由關聯性資料庫的 SQL 朝向非關聯性的 NoSQL

|  |   SQL   | NoSQL |
| -------- | :-------- | :-------- |
| type    | relational DB   | Non relational DB     |
|query language   | SQL     | -     |
| complex query    | suitable     | not good    |
| scalability   | vertical/limited    | horizontal/scalable    |
| structure   | table-based     | key-value document-based    |
| schema   | static/predefined     | dynamic    |
| examples   | MsSQL, MySQL, Postgresql     | MongoDB, Redis    |

### Data Models
- Relational Models
    - 大部分的 SQL DBS 都屬於此種類型，利用各種表格來呈現資料內容與資料間的關係。
- Entity-relationship(E-R) Model
    - Knowledge Based
- Object-based data model
- Semistructured data model
    - XML
#### Database Languages
- Data-defintion language
    - 用來定義資料庫的 schema
- Data-manipulation language(DML) 
    - 用來操作資料庫的搜尋與更新
    - Procedural DMLs：使用者需要寫明資料的型態與取用方法。例如：C Pascal, C++, Java, Python, Ruby, PHP
    - Declarative DMLs or nonprocedural DMLs：使用者只需要寫明資料型態，不需寫明取用方法。例如：Murcury Haskell, Prolog, SQL
