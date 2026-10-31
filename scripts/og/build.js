// Share cards: one image per published note plus one for home, written to
// assets/og/ (note: <file name without .md>.jpg, home: home.jpg).
// The GitHub Action in .github/workflows/og.yml runs this after a push;
// to run it by hand: npm install playwright && node scripts/og/build.js
// A card is redrawn only when its text or the card design changed
// (assets/og/manifest.json keeps a hash of each).

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "assets/og");
const CARD = path.join(__dirname, "card.html");
const MANIFEST = path.join(OUT, "manifest.json");

// Same text as the page's description (_includes/seo.html): the front
// matter's description, else the opening of the note, 120 characters.
function plain(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\[\^[^\]]+\]:.*$/gm, " ")      // footnote bodies
    .replace(/\[\^[^\]]+\]/g, "")              // footnote marks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")     // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")   // links → their text
    .replace(/<[^>]+>/g, "")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\\(.)/g, "$1")
    .replace(/\s+/g, " ")
    // A line break between two Chinese characters is not a space.
    .replace(/([\u3000-\u9fff\uff00-\uffef]) (?=[\u3000-\u9fff\uff00-\uffef])/g, "$1")
    .trim();
}
function truncate(text, n) {
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}
function frontMatter(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const data = {};
  if (!m) return { data, body: raw };
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return { data, body: m[2] };
}

function cards() {
  const list = [];
  const home = frontMatter(path.join(ROOT, "index.md")).data;
  list.push({
    out: "home.jpg",
    path: "~",
    cmd: "whoami",
    title: home.title || "hey, I'm Yen",
    summary: "Product manager @Taiwan. I write about how products get decided. 關於產品決策的中文筆記。",
    meta: "notes/ · works/",
  });
  const dir = path.join(ROOT, "published");
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
    const { data, body } = frontMatter(path.join(dir, name));
    const parts = name.split("-");
    const file = parts.length > 3 && parts[0].length === 4 ? parts.slice(3).join("-") : name;
    const text = plain(body);
    list.push({
      out: name.replace(/\.md$/, ".jpg"),
      path: "~/notes",
      cmd: "cat " + file,
      title: data.title || file,
      summary: data.description || truncate(text, 120),
      meta: [data.date ? String(data.date).slice(0, 10) : null, "~/notes"].filter(Boolean).join(" · "),
    });
  }
  return list;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const design = crypto.createHash("sha1").update(fs.readFileSync(CARD)).digest("hex");
  let manifest = {};
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8")); } catch (e) {}
  const todo = cards();
  const next = {};
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto("file://" + CARD);
  let drawn = 0;
  for (const card of todo) {
    const key = crypto.createHash("sha1").update(design + JSON.stringify(card)).digest("hex");
    next[card.out] = key;
    const target = path.join(OUT, card.out);
    if (manifest[card.out] === key && fs.existsSync(target)) continue;
    await page.reload();
    await page.evaluate((data) => window.render(data), card);
    await page.screenshot({ path: target, type: "jpeg", quality: 88 });
    drawn++;
    console.log("drew", card.out);
  }
  await browser.close();
  // Cards for notes that are gone go too.
  for (const old of Object.keys(manifest)) {
    if (!next[old]) { fs.rmSync(path.join(OUT, old), { force: true }); console.log("removed", old); }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(next, null, 2) + "\n");
  console.log(drawn + " drawn, " + (todo.length - drawn) + " unchanged");
})();
