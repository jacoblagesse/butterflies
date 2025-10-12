
import React, { useEffect, useRef } from 'react';

export default function FlyingButterfly({ seed = 1, label = '', forceShow = false, containerRef }) {
  const elRef = useRef(null); // translates
  const svgRef = useRef(null); // rotates (wings flap via CSS)

  useEffect(() => {
    const el = elRef.current;
    const svgEl = svgRef.current;
    if (!el || !svgEl) return;

    const getW = () => containerRef?.current?.clientWidth ?? window.innerWidth;
    const getH = () => containerRef?.current?.clientHeight ?? window.innerHeight;

    const rand = (n) => Math.abs(Math.sin((seed + 1) * 9973 + n * 37));
    let x = 40 + rand(1) * (getW() * 0.6);
    let y = 140 + rand(2) * (getH() * 0.5);
    let angle = rand(3) * Math.PI * 2 - Math.PI;
    let speed = 20 + rand(4) * 20;
    let t0 = performance.now();
    const margin = 24;

    function loop(t) {
      const dt = Math.min(0.032, (t - t0) / 1000);
      t0 = t;

      // heading noise + lift
      const w = 0.9 * Math.sin(t * 0.0012 + seed) + 0.4 * Math.sin(t * 0.00073 + seed * 1.7);
      angle += w * 0.015;

      // soft edge steer towards center-ish
      const W = getW(),
        H = getH();
      const cx = W * 0.5,
        cy = H * 0.45;
      if (x < margin || x > W - margin || y < margin || y > H - margin) {
        const desired = Math.atan2(cy - y, cx - x);
        const diff = normalizeAngle(desired - angle);
        angle += diff * 0.08;
      }

      // speed pulse
      const pulse = 1 + 0.12 * Math.sin(t * 0.012 + seed);
      const vx = Math.cos(angle) * speed * pulse;
      const vy = Math.sin(angle) * speed * pulse - 4;

      x += vx * dt;
      y += vy * dt;

      // soft clamp
      if (x < margin) {
        x = margin;
        angle += 0.6;
      }
      if (x > W - margin) {
        x = W - margin;
        angle -= 0.6;
      }
      if (y < margin) {
        y = margin;
        angle += 0.6;
      }
      if (y > H - margin) {
        y = H - margin;
        angle -= 0.6;
      }

      const tilt = Math.sin(t * 0.008 + seed) * 8;

      // translate container (no rotation)
      el.style.transform = `translate(${x}px, ${y}px)`;
      // rotate only the svg (keeps text upright)
      svgEl.style.transform = `rotate(${(angle * 180) / Math.PI + tilt}deg)`;

      raf = requestAnimationFrame(loop);
    }

    let raf = requestAnimationFrame(loop);
    const onResize = () => {}; // sizes fetched each frame
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [seed, containerRef]);

  return (
    <div ref={elRef} className="bf" aria-hidden="true">
      <svg ref={svgRef} className="bf-svg" viewBox="0 0 48 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="20" r="2.4" fill="#2f3a4c" />
        <g className="wing-left">
          <path
            d="M24 8c-6 0-10 2-12 5s-2 7 2 9c4-1 7-3 10-6 2-2 3-5 0-8z"
            fill="#6ec3ff"
          />
        </g>
        <g className="wing-right">
          <path
            d="M24 8c6 0 10 2 12 5s2 7-2 9c-4-1-7-3-10-6-2-2-3-5 0-8z"
            fill="#6c62ff"
          />
        </g>
      </svg>
      {label && <div className={`bf-label ${forceShow ? 'force-show' : ''}`}>{label}</div>}
    </div>
  );
}

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}