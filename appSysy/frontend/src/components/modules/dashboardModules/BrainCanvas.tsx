import React, { useEffect, useRef } from 'react';

// ponytail: núcleo IA 3D en canvas 2D (sin deps). Genérico: recibe el color de
// acento por prop, así se reutiliza tal cual en cualquier rama/branding.

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const n = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h.padEnd(6, '0');
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
};
const mix = (rgb: [number, number, number], t: number): [number, number, number] =>
  rgb.map(c => Math.round(c + (255 - c) * t)) as [number, number, number];

export const BrainCanvas: React.FC<{ accent: string; height?: number; nodes?: number }> = ({ accent, height = 140, nodes = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const spinRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const base = hexToRgb(accent);
    const C = base.join(',');
    const CL = mix(base, 0.4).join(',');   // claro
    const CD = mix(base, -0.25).map(x => Math.max(0, x)).join(','); // oscuro (clamp)

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      w = parent.clientWidth; h = parent.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const N = nodes;
    const pts: { x: number; y: number; z: number }[] = [];
    const gr = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = gr * i;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
    }

    const rings = [
      { a: 1.20, b: 0.5, sp: 0.7, ph: 0.0 },
      { a: 0.55, b: 1.20, sp: -0.5, ph: 0.5 },
      { a: 1.14, b: 0.88, sp: 0.4, ph: 1.2 },
    ];

    const draw = () => {
      const t = tRef.current + 0.006 + spinRef.current;
      tRef.current = t;
      spinRef.current *= 0.94;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) * 0.44;
      const fov = R * 3.2;

      // Halo exterior
      const halo = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.7);
      halo.addColorStop(0, `rgba(${C},0.10)`);
      halo.addColorStop(1, `rgba(${C},0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      // Anillos orbitales + electrones
      for (const rg of rings) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * rg.sp + rg.ph);
        ctx.beginPath();
        ctx.ellipse(0, 0, R * rg.a, R * rg.b, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${C},0.32)`;
        ctx.lineWidth = 1.3;
        ctx.shadowColor = `rgba(${C},0.6)`;
        ctx.shadowBlur = 7;
        ctx.stroke();
        const ex = Math.cos(t * 2 + rg.ph) * R * rg.a;
        const ey = Math.sin(t * 2 + rg.ph) * R * rg.b;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${CL},0.95)`;
        ctx.shadowColor = `rgba(${C},1)`;
        ctx.shadowBlur = 12;
        ctx.arc(ex, ey, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.shadowBlur = 0;

      // Esfera de partículas (rotación 3D)
      const cosY = Math.cos(t), sinY = Math.sin(t);
      const tilt = 0.5, cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const proj = pts.map(p => {
        const x = p.x * cosY + p.z * sinY;
        const z = -p.x * sinY + p.z * cosY;
        const y2 = p.y * cosT - z * sinT;
        const z2 = p.y * sinT + z * cosT;
        const s = fov / (fov + z2 * R);
        return { sx: cx + x * R * s, sy: cy + y2 * R * s, z: z2 };
      }).sort((a, b) => a.z - b.z);

      for (const q of proj) {
        const depth = (q.z + 1) / 2;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${CD},${0.12 + depth * 0.78})`;
        ctx.shadowColor = `rgba(${C},0.9)`;
        ctx.shadowBlur = depth * 9;
        ctx.arc(q.sx, q.sy, 0.9 + depth * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Núcleo — halo + orbe + destello rotatorio + rim
      const cr = R * 0.27 * (1 + Math.sin(t * 3) * 0.13);
      const halo2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 2.4);
      halo2.addColorStop(0, `rgba(${C},0.30)`);
      halo2.addColorStop(1, `rgba(${C},0)`);
      ctx.fillStyle = halo2;
      ctx.beginPath(); ctx.arc(cx, cy, cr * 2.4, 0, Math.PI * 2); ctx.fill();

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      g.addColorStop(0, 'rgba(255,255,255,0.98)');
      g.addColorStop(0.28, `rgba(${CL},0.95)`);
      g.addColorStop(0.6, `rgba(${C},0.82)`);
      g.addColorStop(1, `rgba(${CD},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();

      const hx = cx + Math.cos(t * 1.4) * cr * 0.32;
      const hy = cy + Math.sin(t * 1.4) * cr * 0.32;
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, cr * 0.6);
      hg.addColorStop(0, 'rgba(255,255,255,0.9)');
      hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(hx, hy, cr * 0.6, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(${C},0.45)`;
      ctx.lineWidth = 1.3;
      ctx.shadowColor = `rgba(${C},0.8)`;
      ctx.shadowBlur = 10;
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [accent, nodes]);

  return (
    <div style={{ position: 'relative', width: '100%', height, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
};

