---
layout: default
title: 首頁
---

# {{ site.title }}

已發布文章（依日期新到舊）：

{% assign published_posts = site.pages | where_exp: "p", "p.path contains 'published/'" | sort: "date" | reverse %}
{% if published_posts.size == 0 %}
<p>尚無已發布文章。把稿件移入 <code>published/</code> 後 push，這裡就會出現。</p>
{% else %}
<ul class="posts">
{% for post in published_posts %}
  <li>
    <a href="{{ post.url | relative_url }}">{{ post.title | default: post.name }}</a>
    {% if post.date %}<br><time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>{% endif %}
  </li>
{% endfor %}
</ul>
{% endif %}
