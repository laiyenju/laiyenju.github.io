/**
 * Glyph themes: which characters and colours the renderer draws with.
 *
 * ASCII is the original look (shaded blocks under dense ASCII glyphs).
 * The two 字根 themes draw the koi with Cangjie radicals instead: sparse
 * radicals where the light falls, dense ones in shadow, single brush strokes
 * on the edges, and the kohaku patches as cut seal-stamp cells.
 */
export type RGB = [number, number, number];

export interface GlyphTheme {
  /** Body ramp, light → shadow. */
  skin: string;
  fin: string;
  ridge: string;
  edgeHeavy: string;
  edgeLight: string;
  wisp: string;
  mark: string;
  eye: string;
  fish: string;
  /** Heat glyphs after a bite: hot, fading. */
  heat: [string, string];

  /** Cell height / width. 1 = square, which full-width hanzi need. */
  aspect: number;
  /** Cell width = canvas width / cellDiv, clamped to [cellMin, cellMax]. */
  cellDiv: number;
  cellMin: number;
  cellMax: number;
  /** Canvas font stack; null = the canvas element's CSS font. */
  font: string | null;
  weight: number;
  /** Glyph size as a fraction of the cell height. */
  glyphScale: number;

  /** true: the original shaded block behind every body glyph. false: glyphs only, ink on the page. */
  blocks: boolean;
  /** Glyph-only mode: body colour in full shadow and in full light. */
  shadow: RGB;
  lit: RGB;
  ridgeColor: string;
  eyeColor: string;
  /** Glyph-only mode: a faint wash behind body cells (ink bleeding into paper) so the silhouette holds. */
  wash: RGB;
  washAlpha: number;
  /** Kohaku patch: the cell fill and the glyph cut into it. */
  patchFill: RGB;
  patchGlyph: string;
  patchGlint: string;

  accents: string[];
  /** Share of glyphs that flash an accent colour on each shimmer tick. */
  accentRate: number;
  grid: string;
  wake: RGB;
  fishInk: RGB;
  heatHot: RGB;
  heatWarm: RGB;
}

export const ASCII: GlyphTheme = {
  skin: ":;t%SX8#@",
  fin: "%;tS:",
  ridge: "@8%",
  edgeHeavy: ":;",
  edgeLight: ".',`",
  wisp: "~-=:~'",
  mark: "#%@",
  eye: "o",
  fish: "-",
  heat: ["*", "·"],
  aspect: 1.45,
  cellDiv: 124,
  cellMin: 8,
  cellMax: 13,
  font: null,
  weight: 600,
  glyphScale: 0.74,
  blocks: true,
  shadow: [0, 0, 0],
  lit: [0, 0, 0],
  ridgeColor: "#0e0f13",
  eyeColor: "#9aa0ad",
  wash: [0, 0, 0],
  washAlpha: 0,
  patchFill: [206, 88, 56],
  patchGlyph: "#3a1a10",
  patchGlint: "#fff5eb",
  accents: ["#e0892c", "#e03a32", "#b44ae0", "#33c8cc", "#3cb54a", "#3150e8", "#d9c14a"],
  accentRate: 0.09,
  grid: "rgba(42,36,32,0.08)",
  wake: [110, 230, 255],
  fishInk: [26, 28, 32],
  heatHot: [255, 120, 60],
  heatWarm: [220, 40, 40],
};

// Cangjie radicals ordered by ink density. Edges and fin tips thin out into
// single strokes (丶丿乀), the way a brush lifts off the paper.
const RADICALS = {
  skin: "一卜人十大口日田金",
  fin: "心水手火月",
  ridge: "山土弓",
  edgeHeavy: "人卜",
  edgeLight: "丶丿乀一",
  wisp: "乀丿丶乙",
  mark: "竹戈女",
  eye: "目",
  fish: "ㄅㄆㄇㄈㄉㄊ",
  heat: ["米", "。"] as [string, string],
};

/** Day: movable type on paper. Mincho radicals in ink, patches as vermilion seal cells. */
export const GLYPH_DAY: GlyphTheme = {
  ...RADICALS,
  aspect: 1,
  cellDiv: 92,
  cellMin: 12,
  cellMax: 17,
  font: '"Noto Serif TC", "Songti TC", serif',
  weight: 600,
  glyphScale: 0.86,
  blocks: false,
  shadow: [29, 24, 19],
  lit: [150, 138, 124],
  ridgeColor: "#1d1813",
  eyeColor: "#1d1813",
  wash: [96, 78, 60],
  washAlpha: 0.16,
  patchFill: [184, 51, 42],
  patchGlyph: "#f6efe4",
  patchGlint: "#ffd9c8",
  accents: ["#b8332a"],
  accentRate: 0.03,
  grid: "rgba(42,36,32,0.06)",
  wake: [212, 160, 88],
  fishInk: [60, 52, 44],
  heatHot: [184, 51, 42],
  heatWarm: [212, 160, 88],
};

/** Night: an amber phosphor terminal. Dot-matrix radicals, patches in reverse video. */
export const GLYPH_NIGHT: GlyphTheme = {
  ...RADICALS,
  aspect: 1,
  cellDiv: 92,
  cellMin: 12,
  cellMax: 17,
  font: '"DotGothic16", "Noto Serif TC", monospace',
  weight: 400,
  glyphScale: 0.9,
  blocks: false,
  shadow: [120, 80, 30],
  lit: [255, 206, 122],
  ridgeColor: "#ffe2a8",
  eyeColor: "#ffe2a8",
  wash: [242, 176, 80],
  washAlpha: 0.13,
  patchFill: [232, 168, 82],
  patchGlyph: "#17130e",
  patchGlint: "#3a2a14",
  accents: ["#fff3d6"],
  accentRate: 0.04,
  grid: "rgba(255,190,100,0.05)",
  wake: [212, 150, 70],
  fishInk: [230, 180, 100],
  heatHot: [255, 214, 140],
  heatWarm: [212, 150, 70],
};
