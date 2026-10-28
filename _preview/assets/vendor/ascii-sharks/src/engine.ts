import { AsciiRenderer } from "./renderer";
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
  private prevSpeed = new Map<number, number>();
  private closePairs = new Set<string>();

  constructor(private canvas: HTMLCanvasElement, sharks?: SharkSpec[]) {
    // Few grey dashes as quiet field particles; the koi school is the subject.
    this.world = new World(sharks, 22);
    this.renderer = new AsciiRenderer(canvas);
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

    (canvas as HTMLCanvasElement & { __ocean?: OceanEngine }).__ocean = this;
    this.resize();
    // Canvas text can't trigger a webfont load; once the mono face is in, redraw.
    document.fonts?.load(`600 16px ${getComputedStyle(canvas).fontFamily}`).then(() => {
      if (!this.disposed && this.reducedMotion.matches) this.drawStill();
    });
    this.schedule();
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
    this.senseRipples();
    this.renderer.render(this.world, dt);
    this.raf = requestAnimationFrame(this.frame);
  };

  /** One quiet ring. Ignored when the reader prefers reduced motion. */
  ripple(x: number, y: number) {
    if (this.reducedMotion.matches) return;
    this.renderer.spawnRipple(x, y);
  }

  private senseRipples() {
    if (this.reducedMotion.matches) {
      this.renderer.clearRipples();
      this.prevSpeed.clear();
      this.closePairs.clear();
      return;
    }
    const sharks = this.world.sharks;
    for (const sh of sharks) {
      const prev = this.prevSpeed.get(sh.id);
      if (prev !== undefined && sh.speed - prev > 1.25) {
        this.renderer.spawnRipple(sh.nodes[0], sh.nodes[1]);
      }
      this.prevSpeed.set(sh.id, sh.speed);
    }
    const next = new Set<string>();
    for (let i = 0; i < sharks.length; i++) {
      for (let j = i + 1; j < sharks.length; j++) {
        const a = sharks[i];
        const b = sharks[j];
        const d = Math.hypot(a.nodes[0] - b.nodes[0], a.nodes[1] - b.nodes[1]);
        const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
        if (d < 128) {
          next.add(key);
          if (!this.closePairs.has(key)) {
            this.renderer.spawnRipple((a.nodes[0] + b.nodes[0]) / 2, (a.nodes[1] + b.nodes[1]) / 2);
          }
        }
      }
    }
    this.closePairs = next;
  }

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
