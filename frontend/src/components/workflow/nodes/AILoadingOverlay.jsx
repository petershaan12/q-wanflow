import React, { useEffect, useRef } from 'react';
import useThemeStore from '../../../stores/themeStore';

const AILoadingOverlay = ({
  type = 'image',
  status = 'initial',
  message = '',
  size = ''
}) => {
  const { darkMode } = useThemeStore();
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const S = 320;
    canvas.width = S;
    canvas.height = S;
    const cx = S / 2, cy = S / 2;
    let t = 0;

    const getR = (angle, time) => {
      const base = S * 0.22;
      return (
        base
        + Math.sin(angle * 2 + time * 0.50) * S * 0.035
        + Math.sin(angle * 3 - time * 0.35) * S * 0.018
        + Math.sin(angle * 5 + time * 0.68) * S * 0.009
        + Math.sin(angle * 7 - time * 0.27) * S * 0.004
      );
    };

    const STEPS = 360;

    const passes = [
      { lw: 12, alpha: 0.015 },
      { lw: 6, alpha: 0.035 },
      { lw: 3, alpha: 0.090 },
      { lw: 1.5, alpha: 0.250 },
      { lw: 1, alpha: 0.400 },
    ];

    const frame = () => {
      ctx.clearRect(0, 0, S, S);
      t += 0.020;

      // Build ring points
      const pts = [];
      for (let i = 0; i <= STEPS; i++) {
        const a = (i / STEPS) * Math.PI * 2;
        const r = getR(a, t);
        pts.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          norm: i / STEPS,
        });
      }

      // Draw glow passes
      passes.forEach(({ lw, alpha }) => {
        for (let i = 0; i < STEPS; i++) {
          const p0 = pts[i];
          const p1 = pts[i + 1];
          const n = (p0.norm + t * 0.03) % 1;
          // Hue: Qwen purple/pink gradient (260-320)
          const hue = 260 + Math.sin(n * Math.PI * 2) * 30 + 15;
          const lit = 65 + 15 * Math.sin(n * Math.PI * 3 + t * 0.9);
          const sat = 85 + 10 * Math.sin(n * Math.PI * 1.5 + t * 0.5);

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.strokeStyle = `hsla(${hue},${sat}%,${lit}%,${alpha})`;
          ctx.lineWidth = lw;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      });

      // Faint inner glow - Qwen purple/pink
      const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.21);
      ig.addColorStop(0, `rgba(180,120,255,${0.02 + 0.01 * Math.sin(t)})`);
      ig.addColorStop(0.6, 'rgba(150,90,255,0.008)');
      ig.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ig;
      ctx.fillRect(0, 0, S, S);

      animRef.current = requestAnimationFrame(frame);
    };

    frame();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []); // run once on mount — canvas is always in DOM

  void type;
  void message;

  const isVisible = status === 'enhancing' || status === 'generating';
  const label = status === 'enhancing' ? 'Enhancing...' : 'Generating...';

  // Always render — show/hide via CSS so canvasRef is always mounted
  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center ${size === 'small' ? 'flex-row gap-3' : 'flex-col gap-5'} ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      <style>{`
        @keyframes orbIn {
          from { opacity: 0; transform: scale(0.78); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes labelDrift {
          0%,100% { opacity: 0.40; letter-spacing: 0.20em; }
          50%     { opacity: 0.85; letter-spacing: 0.27em; }
        }
      `}</style>

      {/* Ring orb */}
      <div
        style={{
          width: size === 'small' ? 50 : 120,
          height: size === 'small' ? 50 : 120,
          position: 'relative',
          animation: isVisible ? 'orbIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            display: 'block',
          }}
        />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.20em',
          color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
          fontFamily: 'monospace',
          animation: isVisible ? 'labelDrift 2.4s ease-in-out infinite' : 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default AILoadingOverlay;