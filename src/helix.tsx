import { useEffect, useRef } from "react";

export const strands = [
  { id: "circadian", name: "Circadian", color: "#243e66" },
  { id: "fuel", name: "Fuel", color: "#c4a574" },
  { id: "neurogenesis", name: "Neurogenesis", color: "#7eb0be" },
  { id: "affect", name: "Affect", color: "#8d6a86" },
  { id: "plasticity", name: "Plasticity", color: "#3d756e" },
  { id: "capture", name: "Capture", color: "#8b97a6" },
] as const;

type Props = {
  levels: number[];
  spinning?: boolean;
};

export function Helix({ levels, spinning = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drag = useRef({ on: false, x: 0, angle: 0.4 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let alive = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      if (!alive) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (spinning && !reduce && !drag.current.on) drag.current.angle += 0.006;

      const cx = w * 0.5;
      const top = h * 0.06;
      const amp = Math.min(w, h) * 0.22;
      const turns = 4.2;
      const steps = 150;
      const angle = drag.current.angle;

      const pts: { x1: number; x2: number; y: number; z1: number; i: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2 * turns;
        const y = top + (i / steps) * (h * 0.88);
        const z1 = Math.sin(t + angle);
        const z2 = Math.sin(t + angle + Math.PI);
        pts.push({
          x1: cx + Math.cos(t + angle) * amp,
          x2: cx + Math.cos(t + angle + Math.PI) * amp,
          y,
          z1,
          i,
        });
      }

      const back = pts.filter((p) => p.z1 < 0);
      const front = pts.filter((p) => p.z1 >= 0);

      const rung = (p: (typeof pts)[number], alpha: number) => {
        const strand = strands[p.i % strands.length];
        const level = levels[p.i % strands.length] ?? 0.6;
        ctx.strokeStyle = strand.color;
        ctx.globalAlpha = alpha * (0.35 + level * 0.65);
        ctx.lineWidth = 3.2 + level * 3.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y);
        ctx.lineTo(p.x2, p.y);
        ctx.stroke();
        for (const x of [p.x1, p.x2]) {
          ctx.fillStyle = "#f7f4ee";
          ctx.beginPath();
          ctx.arc(x, p.y, 4.2 + level, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = strand.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(x, p.y, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      ctx.lineWidth = 5;
      const spine = (group: typeof pts, alpha: number) => {
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#d9e2ea";
        ctx.beginPath();
        group.forEach((p, idx) => (idx ? ctx.lineTo(p.x1, p.y) : ctx.moveTo(p.x1, p.y)));
        ctx.stroke();
        ctx.strokeStyle = "#cbb89a";
        ctx.beginPath();
        group.forEach((p, idx) => (idx ? ctx.lineTo(p.x2, p.y) : ctx.moveTo(p.x2, p.y)));
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      spine(back, 0.35);
      back.forEach((p, idx) => {
        if (idx % 6 === 0) rung(p, 0.28);
      });
      spine(front, 0.95);
      front.forEach((p, idx) => {
        if (idx % 6 === 0) rung(p, 1);
      });

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [levels, spinning]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const down = (e: PointerEvent) => {
      drag.current.on = true;
      drag.current.x = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.current.on) return;
      drag.current.angle += (e.clientX - drag.current.x) * 0.01;
      drag.current.x = e.clientX;
    };
    const up = () => {
      drag.current.on = false;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
    };
  }, []);

  return <canvas ref={ref} className="helix" aria-label="Cognitive DNA helix. Drag to turn it." />;
}
