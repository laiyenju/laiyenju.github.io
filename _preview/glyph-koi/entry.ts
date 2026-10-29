import { ASCII, GLYPH_DAY, GLYPH_NIGHT, OceanEngine } from "./src";

const root = typeof window !== "undefined" ? window : globalThis;
Object.assign(root, { GlyphOcean: OceanEngine, GlyphThemes: { ASCII, GLYPH_DAY, GLYPH_NIGHT } });

export { OceanEngine };
