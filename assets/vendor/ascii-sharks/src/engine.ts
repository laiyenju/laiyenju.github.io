import { AsciiRenderer } from "./renderer";
import { ASCII, type GlyphTheme } from "./themes";
import { World, type SharkSpec } from "./world";

const STEP = 1 / 60;
const MAX_STEPS = 4;

/**
 * Wires World + AsciiRenderer to a canvas: fixed-timestep loop, resize,
 * pointer input, pausing off-screen, and prefers-reduced-motion.
 */
export class OceanEngine {
  private world: World;
  private renderer: AsciiRenderer;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private visible = true;
  private reducedMotion: MediaQueryList;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement, sharks?: SharkSpec[], fishCount?: number, theme: GlyphTheme = ASCII) {
    this.world = new World(sharks, fishCount);
    this.renderer = new AsciiRenderer(canvas, theme);
    this.renderer.setFontFamily(getComputedStyle(canvas).fontFamily);
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });
    this.intersectionObserver.observe(canvas);

    this.reducedMotion.addEventListener("change", this.onMotionPreference);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);

    this.resize();
    (canvas as HTMLCanvasElement & { __ocean?: OceanEngine }).__ocean = this;
    // Canvas text can't trigger a webfont load; once the mono face is in, redraw.
    const family = theme.font ?? getComputedStyle(canvas).fontFamily;
    const sample = theme.skin + theme.fin + theme.ridge + theme.edgeLight + theme.wisp + theme.eye + theme.fish;
    document.fonts?.load(`${theme.weight} 16px ${family}`, sample).then(() => {
      if (!this.disposed && this.reducedMotion.matches) this.drawStill();
    });
    this.schedule();
  }

  /**
   * List views: the koi scatter from the click at (clientX, clientY) and
   * one small koi stays; off brings the rest back in.
   */
  setCalm(calm: boolean, instant = false, clientX?: number, clientY?: number) {
    const still = this.reducedMotion.matches;
    const rect = this.canvas.getBoundingClientRect();
    const ox = clientX === undefined ? rect.width / 2 : clientX - rect.left;
    const oy = clientY === undefined ? rect.height / 2 : clientY - rect.top;
    this.world.setCalm(calm, instant || still, ox, oy);
    if (still) this.renderer.render(this.world, STEP);
  }

  /**
   * Home: the koi circle this element (a box in client px), nose to tail.
   * List views (setCalm(true)) break the circle and they roam.
   */
  setRing(rect: DOMRect | null) {
    if (!rect) {
      this.world.ring = null;
      return;
    }
    const c = this.canvas.getBoundingClientRect();
    this.world.setRing(rect.left - c.left + rect.width / 2, rect.top - c.top + rect.height / 2, rect.width / 2, rect.height / 2);
  }

  /**
   * Article pages, at the end: one koi swims across once at clientY, heading
   * right (1) or left (-1). When it is out, the engine stops and clears.
   */
  swimAcross(clientY: number, dir: 1 | -1) {
    const rect = this.canvas.getBoundingClientRect();
    this.world.textRects = null;
    this.world.startPass(clientY - rect.top, dir);
  }

  /** Article pages: text boxes in canvas px (x0, y0, x1, y1, ...); the koi hurry across them. */
  setTextRects(rects: Float32Array | null) {
    this.world.textRects = rects;
  }

  /** Article pages draw on plain paper, without the cell grid. */
  setGrid(show: boolean) {
    this.renderer.setGrid(show);
    if (this.reducedMotion.matches) this.drawStill();
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.resize(rect.width, rect.height, dpr);
    this.world.resize(rect.width, rect.height, this.renderer.cellWidth, this.renderer.cellHeight);
    if (this.reducedMotion.matches) this.drawStill();
  }

  private schedule() {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible || this.reducedMotion.matches) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.world.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    this.renderer.render(this.world, dt);
    if (this.world.passDone) {
      // The pass is over: wipe the water and stop.
      this.canvas.getContext("2d")?.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.destroy();
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  /** Reduced motion: let the ecosystem settle, then show a single frame. */
  private drawStill() {
    if (this.world.time < 4) {
      for (let i = 0; i < 240; i++) this.world.step(STEP);
    }
    this.renderer.render(this.world, STEP);
  }

  private onMotionPreference = () => {
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
      this.drawStill();
    } else {
      this.schedule();
    }
  };

  private toLocal(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    return { x, y, inside };
  }

  private onPointerMove = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    const p = this.world.pointer;
    p.x = x;
    p.y = y;
    p.active = inside && e.pointerType !== "touch";
  };

  private onPointerDown = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    if (inside && !this.reducedMotion.matches) this.world.splash(x, y);
  };

  private onPointerLeave = () => {
    this.world.pointer.active = false;
  };
}
