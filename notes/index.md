---
layout: default
title: Notes
lang: en
permalink: /notes/
---

<div class="list-page">
  <a class="back-link" href="{{ '/' | relative_url }}">←</a>
  <h1 class="list-title">Notes</h1>
  <p class="list-lede">日常寫作紀錄 · everyday writing</p>
  <div class="amber-hairline" aria-hidden="true"></div>
  <ul class="list-index">
  {% assign notes = site.pages | where_exp: "p", "p.path contains 'published/'" | sort: "date" | reverse %}
  {% for note in notes %}
    {% if note.status == 'published' or note.layout == 'article' %}
    <li>
      <a href="{{ note.url | relative_url }}">
        <span class="list-item-title">{{ note.title }}</span>
        {% if note.date %}<time datetime="{{ note.date | date_to_xmlschema }}">{{ note.date | date: "%Y-%m-%d" }}</time>{% endif %}
      </a>
    </li>
    {% endif %}
  {% endfor %}
  </ul>
  <p class="list-foot">Individual notes still live under <code>/published/&lt;slug&gt;/</code> for now; IA target is <code>/notes/&lt;slug&gt;</code>.</p>
</div>
