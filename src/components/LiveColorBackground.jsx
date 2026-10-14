import React, { useEffect, useRef } from 'react';

export default function LiveColorBackground({ preset = 'finance-liquid' }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    let width = (canvas.width = Math.floor(window.innerWidth * ratio));
    let height = (canvas.height = Math.floor(window.innerHeight * ratio));
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(ratio, ratio);

    const palettes = {
      'finance-liquid': {
        background: '#eefaf8',
        left: ['rgba(17, 95, 103, 0.48)', 'rgba(28, 188, 166, 0.42)', 'rgba(32, 157, 146, 0.36)'],
        right: ['rgba(65, 108, 139, 0.46)', 'rgba(33, 129, 176, 0.40)', 'rgba(56, 189, 148, 0.34)']
      }
    };

    const active = palettes[preset] || palettes['finance-liquid'];

    const handleResize = () => {
      const ratio2 = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = Math.floor(window.innerWidth * ratio2);
      height = canvas.height = Math.floor(window.innerHeight * ratio2);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio2, ratio2);
    };

    const handleMouseMove = (e) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const particles = Array.from({ length: 56 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.4 + 0.12,
      color: Math.random() > 0.5 ? '#115f67' : '#9bc5bb'
    }));

    let time = 0;

    const render = () => {
      time += 0.006;
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.045;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.045;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.fillStyle = active.background;
      ctx.fillRect(0, 0, width, height);

      const leftGlow = ctx.createRadialGradient(width * 0.30, height * 0.45, 20, width * 0.30, height * 0.45, width * 0.34);
      leftGlow.addColorStop(0, 'rgba(17, 95, 103, 0.45)');
      leftGlow.addColorStop(0.76, 'rgba(25, 177, 154, 0.11)');
      leftGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, width, height);

      const rightGlow = ctx.createRadialGradient(width * 0.70, height * 0.25, 20, width * 0.70, height * 0.25, width * 0.36);
      rightGlow.addColorStop(0, 'rgba(44, 140, 170, 0.35)');
      rightGlow.addColorStop(0.78, 'rgba(34, 144, 130, 0.08)');
      rightGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, width, height);

      const drawSoftRibbonSet = (side, colors, waveCount, baseOffset) => {
        const pointsCount = 40;
        const step = width / pointsCount;

        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          const color = colors[w % colors.length];
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2 + (w % 3) * 0.6;

          for (let i = 0; i <= pointsCount; i++) {
            const x = i * step;
            const normX = x / width;
            const freq1 = 0.002 + w * 0.0007;
            const freq2 = 0.006 + w * 0.0011;
            const speed = time * (0.65 + w * 0.08);
            const baseY = height * (side === 'left' ? 0.47 : 0.55) + Math.sin(time * 0.45 + w * 0.8) * 42;
            const sideFactor = side === 'left'
              ? Math.max(0, 1 - Math.pow(normX - 0.24, 2) * 4)
              : Math.max(0, 1 - Math.pow(normX - 0.76, 2) * 4);

            const waveY =
              Math.sin(x * freq1 + speed + baseOffset) * 88 * sideFactor +
              Math.cos(x * freq2 - speed * 0.7) * 32 * sideFactor;

            const distToMouse = Math.hypot(x - mx, (baseY + waveY) - my);
            let mouseInfluence = 0;
            if (distToMouse < 180) {
              mouseInfluence = (1 - distToMouse / 180) * 30 * Math.sin(time * 3);
            }

            const finalY = baseY + waveY + mouseInfluence;
            if (i === 0) ctx.moveTo(x, finalY);
            else ctx.lineTo(x, finalY);
          }
          ctx.stroke();
        }
      };

      drawSoftRibbonSet('left', active.left, 8, 0);
      drawSoftRibbonSet('right', active.right, 8, Math.PI * 0.9);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width;
        if (p.x > width + 10) p.x = 0;
        if (p.y < -10) p.y = height;
        if (p.y > height + 10) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#eefaf8'
      }}
    />
  );
}
