// Draws scripts/sky/sky.svg, the picture of the sky colours in README 2.5, from assets/js/sky.js.
// Run after changing BG_STOPS, SKY_STOPS, TEXT or colours in sky.js: node scripts/sky/draw.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const ctx = { window: {}, document: { documentElement: { style: {} } } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/sky.js'), 'utf8'), ctx);
const sky = ctx.window.siteSky;
const stops = vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/sky.js'), 'utf8').match(/BG_STOPS = (\[.*?\]);/)[1]);

const W = 960, L = 32, R = 32, PW = W - L - R, out = [];
const rgb = h => h.match(/\w\w/g).map(v => parseInt(v, 16));
const shown = alt => sky.colours(sky.bgFor(alt));
const text = (x, y, s, o = {}) => out.push(`<text x="${x}" y="${y}" font-size="${o.size || 12}" fill="${o.fill || '#55504a'}" text-anchor="${o.anchor || 'start'}"${o.mono ? ' font-family="ui-monospace,Menlo,monospace"' : ''}${o.bold ? ' font-weight="700"' : ''}>${s}</text>`);
// a strip of 1px-wide rects, merged where the colour does not change
function strip(x0, y, w, h, colourAt) {
  let start = 0, cur = colourAt(0);
  for (let x = 1; x <= w; x++) {
    const c = x < w ? colourAt(x) : null;
    if (c !== cur) { out.push(`<rect x="${x0 + start}" y="${y}" width="${x - start}" height="${h}" fill="${cur}"/>`); start = x; cur = c; }
  }
}

let y = 28;
text(L, y, '天色跟著太陽高度變（assets/js/sky.js）', { size: 16, bold: true });
y += 20;
text(L, y, '上：畫面上的底色。下：上面的內文顏色。刻度：BG_STOPS 的位置。天色變亮的地方，文字同時從淺換成深。');
// 1. by the sun's height
y += 18;
const A0 = -20, A1 = 30, ax = a => L + (a - A0) / (A1 - A0) * PW;
strip(L, y, PW, 64, x => shown(A0 + (A1 - A0) * (x + .5) / PW).bg);
strip(L, y + 64, PW, 14, x => shown(A0 + (A1 - A0) * (x + .5) / PW).ink);
out.push(`<rect x="${L}" y="${y}" width="${PW}" height="78" fill="none" stroke="#00000022"/>`);
for (const [a, c] of stops) {
  const x = ax(Math.max(A0, a));
  out.push(`<line x1="${x}" y1="${y + 78}" x2="${x}" y2="${y + 86}" stroke="#55504a"/>`);
}
y += 100;
for (let a = A0; a <= A1; a += 5) text(ax(a), y, (a > 0 ? '+' : '') + a + '°', { anchor: 'middle', mono: true, size: 11 });
y += 26;
// the stops, as swatches: the colour set in BG_STOPS, and what is shown after colours() moves it for the text
const names = { '-18': '深夜', '-9': '夜藍', '-4': '黃昏紫', '0': '日出日落', '5': '晨光', '14': '白天', '28': '正午' };
const sw = PW / stops.length;
stops.forEach(([a, c], k) => {
  const x = L + k * sw, set = sky.hex(c), s = shown(a);
  out.push(`<rect x="${x}" y="${y}" width="${sw - 8}" height="34" fill="${s.bg}" stroke="#00000022"/>`);
  out.push(`<text x="${x + 8}" y="${y + 22}" font-size="13" fill="${s.ink}" font-weight="700">Aa 文字</text>`);
  text(x, y + 50, `${a}° ${names[a] || ''}`, { size: 11, bold: true });
  text(x, y + 65, set === s.bg ? set : `${set} → ${s.bg}`, { size: 10.5, mono: true });
});
y += 100;

// 2. through a day in Taipei, three days of the year
text(L, y, '一天裡的天色（' + sky.CITY.name + ' 當地時間）', { size: 14, bold: true });
y += 14;
const CITY = sky.CITY;
for (const [label, md] of [['夏至', [5, 21]], ['春分', [2, 20]], ['冬至', [11, 21]]]) {
  const t0 = Date.UTC(2026, md[0], md[1]) - CITY.tz * 3600e3;
  text(L, y + 25, label, { size: 11, mono: true });
  strip(L + 56, y + 8, PW - 56, 28, x => shown(sky.sunAt(t0 + (x + .5) / (PW - 56) * 864e5).alt).bg);
  out.push(`<rect x="${L + 56}" y="${y + 8}" width="${PW - 56}" height="28" fill="none" stroke="#00000022"/>`);
  y += 34;
}
for (let h = 0; h <= 24; h += 3) text(L + 56 + h / 24 * (PW - 56), y + 16, String(h).padStart(2, '0') + ':00', { anchor: 'middle', mono: true, size: 11 });
y += 30;

// 3. the home page's sky through the same days: the zenith (top of the page, as shown, after colours()), the horizon
// behind the building, and the ground (the page colour above). Morning and afternoon have their own stops (SKY_STOPS).
y += 14;
text(L, y, '首頁的天空（SKY_STOPS）：天頂、地平線、地面', { size: 14, bold: true });
y += 18;
text(L, y, '同樣高度的太陽，早上（東）和下午（西）用不同的顏色。天頂用 colours() 調過，日期卡片的字放在它上面也讀得清楚。');
y += 8;
for (const [label, md] of [['夏至', [5, 21]], ['春分', [2, 20]], ['冬至', [11, 21]]]) {
  const t0 = Date.UTC(2026, md[0], md[1]) - CITY.tz * 3600e3, at = x => sky.sunAt(t0 + (x + .5) / (PW - 56) * 864e5);
  const sk = x => { const s = at(x); return sky.skyFor(s.alt, s.az); };
  text(L, y + 33, label, { size: 11, mono: true });
  strip(L + 56, y + 8, PW - 56, 14, x => sky.colours(sk(x).top).bg);
  strip(L + 56, y + 22, PW - 56, 14, x => sky.hex(sk(x).horizon));
  strip(L + 56, y + 36, PW - 56, 14, x => shown(at(x).alt).bg);
  out.push(`<rect x="${L + 56}" y="${y + 8}" width="${PW - 56}" height="42" fill="none" stroke="#00000022"/>`);
  y += 48;
}
for (let h = 0; h <= 24; h += 3) text(L + 56 + h / 24 * (PW - 56), y + 16, String(h).padStart(2, '0') + ':00', { anchor: 'middle', mono: true, size: 11 });
y += 30;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}" font-family="-apple-system,'Segoe UI','Noto Sans TC',sans-serif">
<rect width="${W}" height="${y}" fill="#fbfaf7"/>
${out.join('\n')}
</svg>
`;
fs.writeFileSync(path.join(__dirname, 'sky.svg'), svg);
console.log('wrote scripts/sky/sky.svg');
