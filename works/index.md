---
layout: default
title: Works
lang: en
permalink: /works/
---

<div class="list-page">
  <a class="back-link" href="{{ '/' | relative_url }}">←</a>
  <h1 class="list-title">Works</h1>
  <p class="list-lede">作品集 · portfolio stubs</p>
  <div class="amber-hairline" aria-hidden="true"></div>
  <ul class="list-index">
  {% for work in site.data.works %}
    <li>
      <a href="{% if work.url and work.url != '#' %}{{ work.url | relative_url }}{% else %}#{% endif %}">
        <span class="list-item-title{% if work.zh %} zh{% endif %}">{{ work.title }}</span>
        <span class="list-item-blurb">{{ work.one_liner }}</span>
      </a>
    </li>
  {% endfor %}
  </ul>
  <p class="list-foot">Stub list — individual works will land at <code>/works/&lt;slug&gt;</code>.</p>
</div>
