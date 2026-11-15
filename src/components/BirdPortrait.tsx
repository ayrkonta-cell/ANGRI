import React, { useEffect, useRef } from 'react';
import { drawBird, drawPig } from '../graphics/sprites';
import { BirdType, PigType } from '../types/game';

interface BirdPortraitProps {
  bird?: BirdType;
  pig?: PigType;
  size?: number;
  className?: string;
  state?: 'idle' | 'aim' | 'flying' | 'ability' | 'hurt';
}

export const BirdPortrait: React.FC<BirdPortraitProps> = ({
  bird,
  pig,
  size = 56,
  className = '',
  state = 'idle',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size * 0.56;
    const r = size * 0.28;

    if (bird) {
      drawBird(ctx, bird, cx, cy, r, 0, { state, time: 0.4 });
    } else if (pig) {
      drawPig(ctx, pig, cx, cy, r * 1.05, 0, { hpRatio: 1 });
    }
  }, [bird, pig, size, state]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`shrink-0 ${className}`}
    />
  );
};
