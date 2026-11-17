// Checks every view a day in _data/days.yml appears in, on that day and on the day after (CLAUDE.md, README 3.6):
// today's building on the home page, the timeline (every place of the day, by name), and tapping each one.
// Build the site first, then run:
//   jekyll build && node scripts/check-days/check.js              the newest day in days.yml
//   node scripts/check-days/check.js 2026-11-16 2026-11-17         these days
//   node scripts/check-days/check.js --all                         every day in days.yml
// Needs Playwright (npm install playwright). Serves _site/ itself; exits with 1 if anything is wrong.

const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const SITE = path.join(ROOT, "_site");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };

// the dates in days.yml (the page reads the rest itself)
const ALL = [...new Set([...fs.readFileSync(path.join(ROOT, "_data/days.yml"), "utf8").matchAll(/^- date: "(\d{4}-\d{2}-\d{2})"/gm)].map((m) => m[1]))].sort();
const args = process.argv.slice(2);
const DATES = args.includes("--all") ? ALL : args.length ? args : ALL.slice(-1);
const nextDay = (iso) => new Date(Date.parse(iso + "T00:00:00Z") + 864e5).toISOString().slice(0, 10);

function serve() {
  const server = http.createServer((req, res) => {
    let file = path.join(SITE, decodeURIComponent(req.url.split(/[?#]/)[0]));
    if (!file.startsWith(SITE)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

const problems = [];
const fail = (when, what) => problems.push(`${when}: ${what}`);

// opens the home page at noon (UTC+8) on `day`, and gives back the page with what it logged
async function open(browser, base, day) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.logs = [];
  page.on("pageerror", (e) => page.logs.push("error: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error" || /^Memory /.test(m.text())) page.logs.push(m.type() + ": " + m.text());
  });
  await page.clock.install({ time: new Date(day + "T04:00:00Z") });
  await page.goto(base, { waitUntil: "load" });
  await page.clock.runFor(1500);
  return page;
}
const settle = (page) => page.clock.runFor(2500);
const tlCaption = (page) => page.evaluate(() => ({ name: document.getElementById("tlName").textContent, place: document.getElementById("tlPlace").textContent }));
const heroText = (page) => page.evaluate(() => document.querySelector(".hero, main").innerText);

// the places of `date` (as the page reads them), and in the timeline: every one of them, by name; tapping each one
async function checkTimeline(browser, base, day, date, when) {
  let page = await open(browser, base, day);
  const places = await page.evaluate((d) => MEMORIES.filter((m) => m.date === d).map((m) => ({ id: m.id, name: m.name, country: m.country || "Japan" })), date);
  await page.evaluate(() => openTimeline());
  await settle(page);
  const list = await page.evaluate(() => TL.list.map((x) => ({ id: x.id, today: !!x.today })));
  for (const p of places) {
    let k = list.findIndex((x) => x.id === p.id);
    if (k < 0) { fail(when, `${p.name} (${p.id}) is not in the timeline`); continue; }
    await page.evaluate((k) => showTlDay(k, false, 0, true), k);
    await settle(page);
    const cap = await tlCaption(page);
    if (!cap.name.startsWith(p.name)) fail(when, `the timeline shows "${cap.name}" for ${p.name} (${p.id})`);
    if (!cap.place.startsWith(p.country)) fail(when, `the timeline says "${cap.place}" under ${p.name}, not ${p.country}`);
    await page.evaluate(() => tapTl());
    await settle(page);
    const hash = await page.evaluate(() => location.hash), hero = await heroText(page);
    if (list[k].today) { if (hash && hash !== "#") fail(when, `tapping ${p.name}, today's building, went to ${hash}, not the home page`); }
    else if (hash !== "#past-" + p.id) fail(when, `tapping ${p.name} went to "${hash}", not #past-${p.id}`);
    if (!hero.includes(p.name)) fail(when, `tapping ${p.name} shows a page without its name`);
    // back to a fresh timeline for the next place
    for (const l of page.logs) fail(when, l);
    await page.close();
    page = await open(browser, base, day);
    await page.evaluate(() => openTimeline());
    await settle(page);
  }
  for (const l of page.logs) fail(when, l);
  await page.close();
  return places;
}

(async () => {
  if (!fs.existsSync(path.join(SITE, "index.html"))) { console.error("No _site/: run jekyll build first."); process.exit(2); }
  const server = await serve(), base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  for (const date of DATES) {
    const next = nextDay(date);
    // that day: today's building is its last place, named; then the timeline
    const page = await open(browser, base, date);
    const last = await page.evaluate((d) => { const t = MEMORIES.filter((m) => m.date === d); return t.length ? t[t.length - 1].name : null; }, date);
    if (!last) fail(date, "no place in days.yml on this day (a typo in the date, or a missing field: see the console)");
    else if (!(await heroText(page)).includes(last)) fail(date, `the home page's building is not ${last}`);
    await page.evaluate(() => openTimeline());
    await settle(page);
    const cap = await tlCaption(page);
    if (last && !cap.name.startsWith(last)) fail(date, `today in the timeline is "${cap.name}", not ${last}`);
    for (const l of page.logs) fail(date, l);
    await page.close();
    const places = await checkTimeline(browser, base, date, date, date);
    // the day after: the same places are all still there
    if (!ALL.includes(next)) await checkTimeline(browser, base, next, date, `${next} (the day after ${date})`);
    console.log(`${date}: ${places.map((p) => p.name).join(", ") || "-"}`);
  }
  await browser.close();
  server.close();
  if (problems.length) { console.log("\n" + problems.join("\n")); process.exit(1); }
  console.log("\nAll views are right.");
})();
