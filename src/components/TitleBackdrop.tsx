import React, { useEffect, useRef } from 'react';
import {
  drawBird,
  drawBlock,
  drawGround,
  drawPig,
  drawWorldBackground,
} from '../graphics/sprites';
import { BirdType } from '../types/game';

export const TitleBackdrop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animId = 0;
    let time = 0;
    let last = performance.now();

    const flock: { type: BirdType; xFrac: number; yOffset: number; r: number; phase: number; speed: number }[] = [
      { type: 'terence', xFrac: 0.1, yOffset: 30, r: 30, phase: 0.2, speed: 2.2 },
      { type: 'bomb', xFrac: 0.17, yOffset: 24, r: 24, phase: 1.1, speed: 2.8 },
      { type: 'matilda', xFrac: 0.24, yOffset: 22, r: 22, phase: 2.0, speed: 3.0 },
      { type: 'red', xFrac: 0.31, yOffset: 21, r: 21, phase: 0.7, speed: 3.4 },
      { type: 'chuck', xFrac: 0.37, yOffset: 19, r: 19, phase: 1.6, speed: 4.1 },
      { type: 'blues', xFrac: 0.42, yOffset: 14, r: 14, phase: 2.5, speed: 4.5 },
      { type: 'hal', xFrac: 0.47, yOffset: 20, r: 20, phase: 0.9, speed: 3.2 },
      { type: 'bubbles', xFrac: 0.52, yOffset: 15, r: 15, phase: 1.9, speed: 3.8 },
      { type: 'stella', xFrac: 0.57, yOffset: 17, r: 17, phase: 2.9, speed: 3.6 },
    ];

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (rect.width === 0 || rect.height === 0) return;
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const groundY = h - 76;

      drawWorldBackground(
        ctx,
        w,
        h,
        time * 18,
        groundY,
        '#3ea8eb',
        '#bcebff',
        '#7fd18b',
        '#53b848',
        time,
      );
      drawGround(ctx, 0, w, groundY, h);

      // Decorative pig tower on the right
      const tx = Math.max(w * 0.78, w - 220);
      drawBlock(ctx, 'wood', tx - 42, groundY - 38, 16, 76, 0, 1);
      drawBlock(ctx, 'wood', tx + 42, groundY - 38, 16, 76, 0, 1);
      drawBlock(ctx, 'wood', tx, groundY - 84, 110, 16, 0, 1);
      drawBlock(ctx, 'ice', tx - 28, groundY - 118, 14, 52, 0, 1);
      drawBlock(ctx, 'ice', tx + 28, groundY - 118, 14, 52, 0, 1);
      drawBlock(ctx, 'wood', tx, groundY - 152, 82, 16, 0, 1);

      drawPig(ctx, 'king', tx, groundY - 32, 30, 0, {
        hpRatio: 1,
        blink: Math.sin(time * 2.2) > 0.96,
      });
      drawPig(ctx, 'corporal', tx, groundY - 112, 19, 0, {
        hpRatio: 1,
        blink: Math.sin(time * 3.1) > 0.96,
      });
      drawPig(ctx, 'minion', tx - 78, groundY - 17, 16, 0, { hpRatio: 1 });

      // Hopping flock across the lawn
      for (const b of flock) {
        const hop = Math.abs(Math.sin(time * b.speed + b.phase)) * 14;
        const bx = w * b.xFrac;
        const by = groundY - b.yOffset - hop - 2;
        drawBird(ctx, b.type, bx, by, b.r, 0, {
          state: 'idle',
          blink: Math.sin(time * 2.4 + b.phase) > 0.96,
          time,
        });
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};
