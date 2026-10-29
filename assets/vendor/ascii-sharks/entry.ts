import { OceanEngine } from "./src/engine";
import { ASCII, GLYPH_DAY, GLYPH_NIGHT } from "./src/themes";

const root = typeof window !== "undefined" ? window : globalThis;
Object.assign(root, { OceanEngine, OceanThemes: { ASCII, GLYPH_DAY, GLYPH_NIGHT } });

export { OceanEngine };
