import { OceanEngine } from "./src/engine";

const root = typeof window !== "undefined" ? window : globalThis;
(root as unknown as { OceanEngine: typeof OceanEngine }).OceanEngine = OceanEngine;

export { OceanEngine };
