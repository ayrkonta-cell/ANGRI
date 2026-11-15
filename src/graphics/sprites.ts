import { BirdType, MaterialType, PigType } from '../types/game';

export interface BirdRenderOpts {
  state?: 'idle' | 'aim' | 'flying' | 'ability' | 'hurt';
  blink?: boolean;
  scale?: number;
  time?: number;
  facingLeft?: boolean;
}

export interface PigRenderOpts {
  hpRatio?: number;
  panicked?: boolean;
  blink?: boolean;
  time?: number;
}

const OUTLINE = '#1b130f';

function drawOval(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot = 0,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2);
}

function drawAngryEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  options: {
    blink?: boolean;
    hurt?: boolean;
    pupilOffsetX?: number;
    pupilOffsetY?: number;
    eyelash?: boolean;
    wide?: boolean;
  } = {},
) {
  const { blink, hurt, pupilOffsetX = 0.22, pupilOffsetY = 0, eyelash, wide } = options;

  if (blink) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.5, r * 0.28);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y);
    ctx.quadraticCurveTo(x, y + r * 0.4, x + r * 0.9, y);
    ctx.stroke();
    return;
  }

  if (hurt) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.8, r * 0.28);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.65, y - r * 0.65);
    ctx.lineTo(x + r * 0.65, y + r * 0.65);
    ctx.moveTo(x + r * 0.65, y - r * 0.65);
    ctx.lineTo(x - r * 0.65, y + r * 0.65);
    ctx.stroke();
    return;
  }

  // Eyelashes for Stella
  if (eyelash) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.4, r * 0.22);
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const a = -Math.PI * 0.5 + i * 0.35;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85);
      ctx.lineTo(x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 1.4);
      ctx.stroke();
    }
  }

  // Sclera
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.4, r * 0.22);
  ctx.beginPath();
  ctx.arc(x, y, wide ? r * 1.15 : r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupil
  const pr = wide ? r * 0.34 : r * 0.43;
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(x + r * pupilOffsetX, y + r * pupilOffsetY, pr, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + r * (pupilOffsetX - 0.14), y + r * (pupilOffsetY - 0.18), pr * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

function drawTailFeathers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color = '#1a1513',
  count = 3,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.3, r * 0.08);
  const angles = count === 3 ? [-0.42, 0, 0.42] : [-0.25, 0.25];
  for (const a of angles) {
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.08);
    ctx.lineTo(-r * 0.58, -r * 0.16);
    ctx.lineTo(-r * 0.54, r * 0.14);
    ctx.lineTo(0, r * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawBeak(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  open = false,
  upperColor = '#f7a51c',
  lowerColor = '#e37712',
) {
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.4, size * 0.14);
  ctx.lineJoin = 'round';

  if (open) {
    // Mouth interior
    ctx.fillStyle = '#6e1616';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.1, y);
    ctx.lineTo(x + size * 0.85, y - size * 0.26);
    ctx.lineTo(x + size * 0.58, y + size * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  // Upper beak
  ctx.fillStyle = upperColor;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.18, y + (open ? -size * 0.04 : 0));
  ctx.quadraticCurveTo(x + size * 0.45, y - size * 0.52, x + size * 1.0, y + (open ? -size * 0.16 : size * 0.04));
  ctx.lineTo(x - size * 0.1, y + (open ? -size * 0.02 : size * 0.08));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lower beak
  ctx.fillStyle = lowerColor;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.14, y + (open ? size * 0.08 : size * 0.05));
  ctx.lineTo(x + size * 0.72, y + (open ? size * 0.36 : size * 0.06));
  ctx.quadraticCurveTo(x + size * 0.3, y + (open ? size * 0.55 : size * 0.36), x - size * 0.14, y + (open ? size * 0.08 : size * 0.05));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawBird(
  ctx: CanvasRenderingContext2D,
  type: BirdType,
  x: number,
  y: number,
  baseRadius: number,
  angle: number,
  opts: BirdRenderOpts = {},
) {
  const { state = 'idle', blink = false, scale = 1, time = 0, facingLeft = false } = opts;
  const r = baseRadius * scale;
  const openMouth = state === 'flying' || state === 'ability';
  const isHurt = state === 'hurt';

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (facingLeft) {
    ctx.scale(-1, 1);
  }

  // Special Sardine Can / Mighty Eagle swoop rendering
  if (type === 'mighty_eagle') {
    if (state === 'ability') {
      // Draw the Mighty Eagle himself swooping!
      // Wings
      ctx.fillStyle = '#4e321a';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = Math.max(2, r * 0.1);
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.2);
      ctx.quadraticCurveTo(-r * 1.9, -r * 1.3, -r * 2.2, -r * 0.2);
      ctx.quadraticCurveTo(-r * 1.4, r * 0.4, -r * 0.2, r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Body
      ctx.fillStyle = '#5c3b21';
      drawOval(ctx, -r * 0.2, r * 0.1, r * 1.15, r * 0.85, -0.2);
      ctx.fill();
      ctx.stroke();

      // White Eagle Head
      ctx.fillStyle = '#faf8f2';
      ctx.beginPath();
      ctx.arc(r * 0.45, -r * 0.25, r * 0.68, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fierce brow & eye
      drawAngryEye(ctx, r * 0.65, -r * 0.32, r * 0.2, { hurt: isHurt });
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.moveTo(r * 0.3, -r * 0.56);
      ctx.lineTo(r * 0.96, -r * 0.42);
      ctx.lineTo(r * 0.92, -r * 0.32);
      ctx.lineTo(r * 0.3, -r * 0.45);
      ctx.closePath();
      ctx.fill();

      // Hooked golden eagle beak
      ctx.fillStyle = '#f5a618';
      ctx.beginPath();
      ctx.moveTo(r * 0.95, -r * 0.3);
      ctx.quadraticCurveTo(r * 1.65, -r * 0.2, r * 1.48, r * 0.24);
      ctx.quadraticCurveTo(r * 1.25, r * 0.05, r * 0.92, r * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
      return;
    }

    // Sardine can for slingshot / roster icon
    ctx.save();
    ctx.fillStyle = '#c8d2dc';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.8, r * 0.1);
    ctx.beginPath();
    ctx.roundRect(-r * 0.85, -r * 0.58, r * 1.7, r * 1.16, r * 0.28);
    ctx.fill();
    ctx.stroke();

    // Red label stripe
    ctx.fillStyle = '#d42c2c';
    ctx.fillRect(-r * 0.72, -r * 0.32, r * 1.44, r * 0.64);
    // Tiny fish icon on label
    ctx.fillStyle = '#fff5cc';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.42, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.38, 0);
    ctx.lineTo(-r * 0.6, -r * 0.16);
    ctx.lineTo(-r * 0.6, r * 0.16);
    ctx.closePath();
    ctx.fill();
    // Pull tab ring
    ctx.strokeStyle = '#6c7782';
    ctx.lineWidth = Math.max(1.5, r * 0.09);
    ctx.beginPath();
    ctx.arc(r * 0.65, -r * 0.58, r * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    return;
  }

  const lw = Math.max(1.8, r * 0.1);
  ctx.lineWidth = lw;
  ctx.strokeStyle = OUTLINE;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  switch (type) {
    case 'red': {
      drawTailFeathers(ctx, -r * 0.9, r * 0.05, r, '#1a1513', 3);

      // Crest feathers
      ctx.fillStyle = '#d92121';
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, -r * 1.12, r * 0.34, r * 0.15, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-r * 0.38, -r * 0.98, r * 0.24, r * 0.12, -0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Main crimson body
      const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.15, 0, 0, r * 1.05);
      grad.addColorStop(0, '#f23b3b');
      grad.addColorStop(0.75, '#d11c1c');
      grad.addColorStop(1, '#9e1111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Belly patch
      ctx.fillStyle = '#f2dec2';
      ctx.beginPath();
      ctx.ellipse(r * 0.1, r * 0.64, r * 0.68, r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Under-eye spots
      ctx.fillStyle = '#a31515';
      drawOval(ctx, -r * 0.12, r * 0.18, r * 0.14, r * 0.08, -0.2);
      ctx.fill();
      drawOval(ctx, r * 0.64, r * 0.16, r * 0.11, r * 0.07, 0.2);
      ctx.fill();

      // Eyes
      drawAngryEye(ctx, r * 0.08, -r * 0.08, r * 0.24, { blink, hurt: isHurt });
      drawAngryEye(ctx, r * 0.52, -r * 0.08, r * 0.22, { blink, hurt: isHurt });

      // Iconic thick angry eyebrows
      ctx.fillStyle = '#14110f';
      ctx.beginPath();
      ctx.moveTo(-r * 0.24, -r * 0.42);
      ctx.lineTo(r * 0.32, -r * 0.24);
      ctx.lineTo(r * 0.78, -r * 0.4);
      ctx.lineTo(r * 0.75, -r * 0.22);
      ctx.lineTo(r * 0.32, -r * 0.12);
      ctx.lineTo(-r * 0.2, -r * 0.24);
      ctx.closePath();
      ctx.fill();

      drawBeak(ctx, r * 0.3, r * 0.14, r * 0.56, openMouth);
      break;
    }

    case 'blues': {
      drawTailFeathers(ctx, -r * 0.88, r * 0.08, r * 0.95, '#194575', 2);

      // Top spiky tuft
      ctx.fillStyle = '#2d8be6';
      ctx.beginPath();
      ctx.moveTo(-r * 0.12, -r * 0.95);
      ctx.lineTo(-r * 0.35, -r * 1.38);
      ctx.lineTo(r * 0.05, -r * 1.05);
      ctx.lineTo(r * 0.12, -r * 1.32);
      ctx.lineTo(r * 0.24, -r * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Body
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#59b5ff');
      grad.addColorStop(0.7, '#2782de');
      grad.addColorStop(1, '#195ba8');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Light belly
      ctx.fillStyle = '#bce6ff';
      drawOval(ctx, r * 0.08, r * 0.62, r * 0.62, r * 0.34);
      ctx.fill();

      // Reddish eye circles (classic Blues look)
      ctx.fillStyle = '#b03c2a';
      drawOval(ctx, r * 0.08, -r * 0.06, r * 0.3, r * 0.28);
      ctx.fill();
      drawOval(ctx, r * 0.54, -r * 0.06, r * 0.28, r * 0.26);
      ctx.fill();

      drawAngryEye(ctx, r * 0.08, -r * 0.06, r * 0.24, { blink, hurt: isHurt });
      drawAngryEye(ctx, r * 0.54, -r * 0.06, r * 0.22, { blink, hurt: isHurt });

      // Mischievous brows
      ctx.strokeStyle = '#122947';
      ctx.lineWidth = Math.max(2, r * 0.16);
      ctx.beginPath();
      ctx.moveTo(-r * 0.12, -r * 0.34);
      ctx.lineTo(r * 0.28, -r * 0.24);
      ctx.moveTo(r * 0.36, -r * 0.24);
      ctx.lineTo(r * 0.72, -r * 0.34);
      ctx.stroke();

      drawBeak(ctx, r * 0.32, r * 0.14, r * 0.5, openMouth);
      break;
    }

    case 'chuck': {
      drawTailFeathers(ctx, -r * 0.92, r * 0.36, r, '#1a1513', 3);

      // Black tuft on top peak
      ctx.fillStyle = '#1a1513';
      ctx.beginPath();
      ctx.moveTo(-r * 0.18, -r * 0.96);
      ctx.lineTo(-r * 0.42, -r * 1.4);
      ctx.lineTo(0, -r * 1.08);
      ctx.lineTo(-r * 0.05, -r * 1.38);
      ctx.lineTo(r * 0.18, -r * 0.98);
      ctx.closePath();
      ctx.fill();

      // Triangular yellow body
      const grad = ctx.createRadialGradient(-r * 0.1, -r * 0.2, r * 0.1, 0, r * 0.1, r * 1.2);
      grad.addColorStop(0, '#ffe84d');
      grad.addColorStop(0.75, '#f2c111');
      grad.addColorStop(1, '#c99708');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.12);
      ctx.quadraticCurveTo(r * 0.92, -r * 0.1, r * 1.05, r * 0.65);
      ctx.quadraticCurveTo(r * 0.95, r * 0.95, 0, r * 0.95);
      ctx.quadraticCurveTo(-r * 0.98, r * 0.95, -r * 1.04, r * 0.65);
      ctx.quadraticCurveTo(-r * 0.9, -r * 0.1, 0, -r * 1.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // White belly
      ctx.fillStyle = '#fff9d6';
      drawOval(ctx, r * 0.08, r * 0.65, r * 0.72, r * 0.26);
      ctx.fill();

      // Turbo streaks when flying/ability
      if (state === 'ability') {
        ctx.strokeStyle = 'rgba(255, 244, 140, 0.85)';
        ctx.lineWidth = Math.max(2, r * 0.14);
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(-r * 1.1, i * r * 0.45);
          ctx.lineTo(-r * 2.1, i * r * 0.45);
          ctx.stroke();
        }
      }

      drawAngryEye(ctx, r * 0.05, r * 0.04, r * 0.23, { blink, hurt: isHurt });
      drawAngryEye(ctx, r * 0.54, r * 0.04, r * 0.21, { blink, hurt: isHurt });

      // Reddish-brown sharp eyebrows
      ctx.fillStyle = '#73290e';
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.28);
      ctx.lineTo(r * 0.3, -r * 0.12);
      ctx.lineTo(r * 0.78, -r * 0.26);
      ctx.lineTo(r * 0.74, -r * 0.12);
      ctx.lineTo(r * 0.3, -r * 0.01);
      ctx.lineTo(-r * 0.22, -r * 0.14);
      ctx.closePath();
      ctx.fill();

      drawBeak(ctx, r * 0.34, r * 0.25, r * 0.58, openMouth);
      break;
    }

    case 'bomb': {
      // Fuse with glowing orange tip
      ctx.fillStyle = '#25272b';
      ctx.beginPath();
      ctx.moveTo(-r * 0.08, -r * 0.96);
      ctx.quadraticCurveTo(r * 0.02, -r * 1.42, r * 0.25, -r * 1.46);
      ctx.quadraticCurveTo(r * 0.14, -r * 1.18, r * 0.12, -r * 0.96);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fuse spark
      const sparkR = state === 'flying' || state === 'ability' ? r * 0.24 : r * 0.15;
      ctx.fillStyle = Math.sin(time * 25) > 0 ? '#ff6a00' : '#ffd500';
      ctx.beginPath();
      ctx.arc(r * 0.27, -r * 1.47, sparkR, 0, Math.PI * 2);
      ctx.fill();

      // Heavy black body (pulsates red if ability triggered or about to detonate)
      const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.15, 0, 0, r * 1.05);
      grad.addColorStop(0, '#4d5059');
      grad.addColorStop(0.7, '#24262b');
      grad.addColorStop(1, '#121317');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Grey belly & forehead spot
      ctx.fillStyle = '#7b808a';
      drawOval(ctx, r * 0.12, r * 0.58, r * 0.62, r * 0.36);
      ctx.fill();
      drawOval(ctx, r * 0.32, -r * 0.42, r * 0.2, r * 0.14);
      ctx.fill();

      drawAngryEye(ctx, r * 0.08, -r * 0.06, r * 0.23, { blink, hurt: isHurt });
      drawAngryEye(ctx, r * 0.54, -r * 0.06, r * 0.21, { blink, hurt: isHurt });

      // Red-brown thick brows
      ctx.fillStyle = '#9e2b11';
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.36);
      ctx.lineTo(r * 0.32, -r * 0.18);
      ctx.lineTo(r * 0.78, -r * 0.34);
      ctx.lineTo(r * 0.74, -r * 0.2);
      ctx.lineTo(r * 0.32, -r * 0.08);
      ctx.lineTo(-r * 0.16, -r * 0.22);
      ctx.closePath();
      ctx.fill();

      drawBeak(ctx, r * 0.32, r * 0.16, r * 0.5, openMouth);
      break;
    }

    case 'matilda': {
      drawTailFeathers(ctx, -r * 0.85, r * 0.2, r * 0.9, '#3a3532', 3);

      // Top head tuft
      ctx.fillStyle = '#f7f3e6';
      ctx.beginPath();
      ctx.ellipse(-r * 0.1, -r * 1.15, r * 0.18, r * 0.32, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Egg-shaped white body
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.35, r * 0.15, 0, 0, r * 1.1);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.75, '#f2ece0');
      grad.addColorStop(1, '#d1c8b8');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.05, r * 0.92, r * 1.06, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rosy peach cheeks
      ctx.fillStyle = '#f59f95';
      drawOval(ctx, -r * 0.16, r * 0.18, r * 0.19, r * 0.13);
      ctx.fill();
      drawOval(ctx, r * 0.62, r * 0.18, r * 0.16, r * 0.12);
      ctx.fill();

      // Soft belly
      ctx.fillStyle = '#e3d8c3';
      drawOval(ctx, r * 0.08, r * 0.68, r * 0.62, r * 0.32);
      ctx.fill();

      drawAngryEye(ctx, r * 0.08, -r * 0.12, r * 0.21, { blink, hurt: isHurt });
      drawAngryEye(ctx, r * 0.52, -r * 0.12, r * 0.19, { blink, hurt: isHurt });

      // Thin arched brows
      ctx.strokeStyle = '#332822';
      ctx.lineWidth = Math.max(1.8, r * 0.13);
      ctx.beginPath();
      ctx.moveTo(-r * 0.14, -r * 0.42);
      ctx.quadraticCurveTo(r * 0.1, -r * 0.52, r * 0.26, -r * 0.34);
      ctx.moveTo(r * 0.34, -r * 0.34);
      ctx.quadraticCurveTo(r * 0.52, -r * 0.5, r * 0.72, -r * 0.4);
      ctx.stroke();

      drawBeak(ctx, r * 0.3, r * 0.12, r * 0.48, openMouth, '#f5b82e', '#d98a16');
      break;
    }

    case 'hal': {
      drawTailFeathers(ctx, -r * 0.9, r * 0.1, r, '#1a1513', 3);

      // Crest
      ctx.fillStyle = '#237320';
      ctx.beginPath();
      ctx.ellipse(-r * 0.18, -r * 1.05, r * 0.26, r * 0.14, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Emerald body
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#59d654');
      grad.addColorStop(0.75, '#2fa32b');
      grad.addColorStop(1, '#1c6e19');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Light lime belly
      ctx.fillStyle = '#d5f5b3';
      drawOval(ctx, r * 0.08, r * 0.62, r * 0.62, r * 0.34);
      ctx.fill();

      drawAngryEye(ctx, r * 0.02, -r * 0.12, r * 0.22, { blink, hurt: isHurt });
      drawAngryEye(ctx, r * 0.42, -r * 0.12, r * 0.2, { blink, hurt: isHurt });

      // Dark brows
      ctx.fillStyle = '#143b12';
      ctx.beginPath();
      ctx.moveTo(-r * 0.22, -r * 0.4);
      ctx.lineTo(r * 0.22, -r * 0.26);
      ctx.lineTo(r * 0.62, -r * 0.38);
      ctx.lineTo(r * 0.58, -r * 0.24);
      ctx.lineTo(r * 0.22, -r * 0.15);
      ctx.lineTo(-r * 0.18, -r * 0.26);
      ctx.closePath();
      ctx.fill();

      // Iconic giant curved Toucan beak!
      ctx.fillStyle = '#ffaa1d';
      ctx.beginPath();
      ctx.moveTo(r * 0.22, -r * 0.02);
      ctx.quadraticCurveTo(r * 1.45, -r * 0.36, r * 1.56, r * 0.42);
      ctx.quadraticCurveTo(r * 1.15, r * 0.22, r * 0.22, r * 0.24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Beak tip dark orange/black accent
      ctx.fillStyle = '#e05312';
      ctx.beginPath();
      ctx.arc(r * 1.44, r * 0.28, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'terence': {
      drawTailFeathers(ctx, -r * 0.92, r * 0.1, r * 0.95, '#1a1513', 3);

      // Crest
      ctx.fillStyle = '#9e171e';
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, -r * 1.06, r * 0.3, r * 0.15, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Massive maroon body
      const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.15, 0, 0, r * 1.05);
      grad.addColorStop(0, '#c92a32');
      grad.addColorStop(0.75, '#96151c');
      grad.addColorStop(1, '#610b10');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tan belly
      ctx.fillStyle = '#d9bea3';
      drawOval(ctx, r * 0.1, r * 0.65, r * 0.68, r * 0.32);
      ctx.fill();

      // Dark cheek spots
      ctx.fillStyle = '#6e0d12';
      drawOval(ctx, -r * 0.42, r * 0.1, r * 0.12, r * 0.08);
      ctx.fill();
      drawOval(ctx, -r * 0.22, r * 0.24, r * 0.09, r * 0.06);
      ctx.fill();

      // Heavy half-lidded eyes
      drawAngryEye(ctx, r * 0.08, -r * 0.05, r * 0.23, { blink, hurt: isHurt, pupilOffsetX: 0.15 });
      drawAngryEye(ctx, r * 0.54, -r * 0.05, r * 0.21, { blink, hurt: isHurt, pupilOffsetX: 0.15 });

      // Extra-thick grimace eyebrows
      ctx.fillStyle = '#140f0d';
      ctx.beginPath();
      ctx.moveTo(-r * 0.26, -r * 0.36);
      ctx.lineTo(r * 0.32, -r * 0.2);
      ctx.lineTo(r * 0.8, -r * 0.36);
      ctx.lineTo(r * 0.78, -r * 0.1);
      ctx.lineTo(r * 0.32, -r * 0.02);
      ctx.lineTo(-r * 0.22, -r * 0.14);
      ctx.closePath();
      ctx.fill();

      drawBeak(ctx, r * 0.3, r * 0.2, r * 0.56, openMouth, '#e8961c', '#bd650f');
      break;
    }

    case 'bubbles': {
      const inflated = state === 'ability';
      drawTailFeathers(ctx, -r * 0.9, r * 0.1, r, '#1a1513', 3);

      // Cute top tuft
      ctx.fillStyle = '#1a1513';
      ctx.beginPath();
      ctx.moveTo(-r * 0.08, -r * 0.95);
      ctx.lineTo(-r * 0.2, -r * 1.35);
      ctx.lineTo(r * 0.08, -r * 1.05);
      ctx.lineTo(r * 0.22, -r * 1.3);
      ctx.lineTo(r * 0.18, -r * 0.95);
      ctx.closePath();
      ctx.fill();

      // Orange body (spiky/balloon if inflated)
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r * 1.05);
      grad.addColorStop(0, '#ffa238');
      grad.addColorStop(0.75, '#f56e14');
      grad.addColorStop(1, '#c44b08');
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (inflated) {
        const spikes = 16;
        for (let i = 0; i < spikes; i++) {
          const a = (i / spikes) * Math.PI * 2;
          const aMid = ((i + 0.5) / spikes) * Math.PI * 2;
          const rSpike = r * 1.08;
          const rBase = r * 0.94;
          if (i === 0) ctx.moveTo(Math.cos(a) * rBase, Math.sin(a) * rBase);
          ctx.lineTo(Math.cos(aMid) * rSpike, Math.sin(aMid) * rSpike);
          const aNext = ((i + 1) / spikes) * Math.PI * 2;
          ctx.lineTo(Math.cos(aNext) * rBase, Math.sin(aNext) * rBase);
        }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();

      // Cream belly
      ctx.fillStyle = '#ffe6bd';
      drawOval(ctx, r * 0.08, r * 0.6, r * 0.62, r * 0.34);
      ctx.fill();

      // Dark eye rings (Bubbles has dark raccoon-like patches around huge eyes!)
      ctx.fillStyle = '#291c15';
      drawOval(ctx, r * 0.1, -r * 0.06, r * 0.28, r * 0.26);
      ctx.fill();
      drawOval(ctx, r * 0.54, -r * 0.06, r * 0.26, r * 0.24);
      ctx.fill();

      drawAngryEye(ctx, r * 0.1, -r * 0.06, r * 0.22, { blink, hurt: isHurt, wide: true });
      drawAngryEye(ctx, r * 0.54, -r * 0.06, r * 0.2, { blink, hurt: isHurt, wide: true });

      drawBeak(ctx, r * 0.34, r * 0.16, r * 0.42, openMouth);
      break;
    }

    case 'stella': {
      drawTailFeathers(ctx, -r * 0.88, r * 0.12, r * 0.95, '#d9488b', 3);

      // Iconic wispy pink cockatoo crest
      ctx.fillStyle = '#f569ab';
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.9);
      ctx.quadraticCurveTo(-r * 0.65, -r * 1.48, -r * 0.05, -r * 1.38);
      ctx.quadraticCurveTo(r * 0.1, -r * 1.56, r * 0.28, -r * 1.24);
      ctx.quadraticCurveTo(r * 0.18, -r * 1.0, r * 0.12, -r * 0.96);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rosy pink body
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.1, 0, 0, r * 1.05);
      grad.addColorStop(0, '#ff99c8');
      grad.addColorStop(0.75, '#f25ea2');
      grad.addColorStop(1, '#bd3172');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pale pink belly
      ctx.fillStyle = '#ffd9ea';
      drawOval(ctx, r * 0.08, r * 0.62, r * 0.64, r * 0.34);
      ctx.fill();

      // Big expressive eyes with eyelashes
      drawAngryEye(ctx, r * 0.08, -r * 0.08, r * 0.24, { blink, hurt: isHurt, eyelash: true });
      drawAngryEye(ctx, r * 0.54, -r * 0.08, r * 0.22, { blink, hurt: isHurt, eyelash: true });

      // Determined brows
      ctx.strokeStyle = '#6e1640';
      ctx.lineWidth = Math.max(1.8, r * 0.13);
      ctx.beginPath();
      ctx.moveTo(-r * 0.14, -r * 0.38);
      ctx.lineTo(r * 0.28, -r * 0.28);
      ctx.moveTo(r * 0.36, -r * 0.28);
      ctx.lineTo(r * 0.72, -r * 0.38);
      ctx.stroke();

      drawBeak(ctx, r * 0.32, r * 0.14, r * 0.46, openMouth);
      break;
    }
  }

  ctx.restore();
}

export function drawPig(
  ctx: CanvasRenderingContext2D,
  type: PigType,
  x: number,
  y: number,
  r: number,
  angle: number,
  opts: PigRenderOpts = {},
) {
  const { hpRatio = 1, panicked = false, blink = false } = opts;
  const injured = hpRatio < 0.68;
  const critical = hpRatio < 0.35;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.8, r * 0.09);
  ctx.lineJoin = 'round';

  // Ears
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#73c92e';
    ctx.beginPath();
    ctx.arc(side * r * 0.68, -r * 0.74, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3d7a14';
    ctx.beginPath();
    ctx.arc(side * r * 0.68, -r * 0.74, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }

  // Round green body
  const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.15, 0, 0, r * 1.05);
  grad.addColorStop(0, '#9be84d');
  grad.addColorStop(0.72, '#73c92e');
  grad.addColorStop(1, '#4b8f19');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bruise marks when injured
  if (injured) {
    ctx.fillStyle = 'rgba(72, 48, 110, 0.45)';
    drawOval(ctx, -r * 0.52, -r * 0.05, r * 0.24, r * 0.2);
    ctx.fill();
  }
  if (critical) {
    // Adhesive bandage strip
    ctx.save();
    ctx.translate(r * 0.45, r * 0.45);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#f5dbb8';
    ctx.strokeStyle = '#6e4e2e';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-r * 0.24, -r * 0.09, r * 0.48, r * 0.18);
    ctx.strokeRect(-r * 0.24, -r * 0.09, r * 0.48, r * 0.18);
    ctx.restore();
  }

  // Wide-set pig eyes
  const eyeY = -r * 0.12;
  const eyeLeftX = -r * 0.48;
  const eyeRightX = r * 0.48;
  const eyeR = r * 0.21;

  for (const ex of [eyeLeftX, eyeRightX]) {
    if (blink) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.beginPath();
      ctx.moveTo(ex - eyeR * 0.8, eyeY);
      ctx.lineTo(ex + eyeR * 0.8, eyeY);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = Math.max(1.3, r * 0.06);
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(ex + (panicked ? 0 : r * 0.03), eyeY, panicked ? eyeR * 0.3 : eyeR * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Prominent lighter-green snout
  ctx.fillStyle = '#a8f05b';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  drawOval(ctx, 0, r * 0.04, r * 0.38, r * 0.3);
  ctx.fill();
  ctx.stroke();

  // Asymmetric nostrils
  ctx.fillStyle = '#1b3d07';
  drawOval(ctx, -r * 0.15, r * 0.03, r * 0.09, r * 0.13, -0.15);
  ctx.fill();
  drawOval(ctx, r * 0.14, r * 0.04, r * 0.075, r * 0.11, 0.15);
  ctx.fill();

  // Mouth (smug grin normally, O-shaped panic when bird is near!)
  if (panicked || critical) {
    ctx.fillStyle = '#401010';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.3, r * 0.06);
    ctx.beginPath();
    ctx.arc(0, r * 0.56, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.5, r * 0.07);
    ctx.beginPath();
    ctx.arc(0, r * 0.42, r * 0.26, 0.25, Math.PI - 0.25);
    ctx.stroke();
  }

  // Sweat drop when panicked
  if (panicked) {
    ctx.fillStyle = '#6be0ff';
    ctx.strokeStyle = '#1b5f80';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(r * 0.78, -r * 0.45);
    ctx.quadraticCurveTo(r * 0.94, -r * 0.2, r * 0.78, -r * 0.12);
    ctx.quadraticCurveTo(r * 0.62, -r * 0.2, r * 0.78, -r * 0.45);
    ctx.fill();
    ctx.stroke();
  }

  // Rank accessories!
  if (type === 'corporal') {
    // Steel army helmet
    const hGrad = ctx.createLinearGradient(0, -r * 1.15, 0, -r * 0.25);
    hGrad.addColorStop(0, '#96a7b8');
    hGrad.addColorStop(1, '#586775');
    ctx.fillStyle = hGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.8, r * 0.09);
    ctx.beginPath();
    ctx.arc(0, -r * 0.18, r * 1.05, Math.PI * 1.04, Math.PI * -0.04);
    ctx.quadraticCurveTo(0, -r * 0.42, -r * 1.04, -r * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Helmet rim highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.beginPath();
    ctx.arc(0, -r * 0.22, r * 0.88, Math.PI * 1.15, Math.PI * 1.65);
    ctx.stroke();
  } else if (type === 'foreman') {
    // Bushy orange eyebrows
    ctx.fillStyle = '#e06716';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.2, r * 0.05);
    drawOval(ctx, -r * 0.48, -r * 0.42, r * 0.25, r * 0.1, -0.2);
    ctx.fill();
    ctx.stroke();
    drawOval(ctx, r * 0.48, -r * 0.42, r * 0.25, r * 0.1, 0.2);
    ctx.fill();
    ctx.stroke();

    // Big ginger handlebar mustache under snout!
    ctx.fillStyle = '#e06716';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.26);
    ctx.quadraticCurveTo(-r * 0.35, r * 0.12, -r * 0.72, r * 0.48);
    ctx.quadraticCurveTo(-r * 0.4, r * 0.62, 0, r * 0.38);
    ctx.quadraticCurveTo(r * 0.4, r * 0.62, r * 0.72, r * 0.48);
    ctx.quadraticCurveTo(r * 0.35, r * 0.12, 0, r * 0.26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'king') {
    // Jeweled Gold Crown!
    ctx.fillStyle = '#ffd11a';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(-r * 0.64, -r * 0.78);
    ctx.lineTo(-r * 0.78, -r * 1.38);
    ctx.lineTo(-r * 0.32, -r * 1.1);
    ctx.lineTo(0, -r * 1.52);
    ctx.lineTo(r * 0.32, -r * 1.1);
    ctx.lineTo(r * 0.78, -r * 1.38);
    ctx.lineTo(r * 0.64, -r * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crown jewels
    const jewels = [
      { cx: 0, cy: -r * 1.02, c: '#e62222' },
      { cx: -r * 0.42, cy: -r * 0.96, c: '#2980f2' },
      { cx: r * 0.42, cy: -r * 0.96, c: '#2980f2' },
    ];
    for (const j of jewels) {
      ctx.fillStyle = j.c;
      ctx.beginPath();
      ctx.arc(j.cx, j.cy, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawBlock(
  ctx: CanvasRenderingContext2D,
  material: MaterialType,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  hpRatio: number,
  shape: 'rect' | 'circle' | 'triangle' = 'rect',
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  if (material === 'boulder' || shape === 'circle') {
    const r = w / 2;
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#b5bcc4');
    grad.addColorStop(0.75, '#7e868f');
    grad.addColorStop(1, '#585f66');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stone speckles
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.2, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.2, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
    drawCracks(ctx, r * 1.4, r * 1.4, hpRatio);
    ctx.restore();
    return;
  }

  if (material === 'golden_egg') {
    const grad = ctx.createRadialGradient(-w * 0.18, -h * 0.2, w * 0.05, 0, 0, h * 0.6);
    grad.addColorStop(0, '#fff7ad');
    grad.addColorStop(0.5, '#ffd024');
    grad.addColorStop(1, '#c78c0a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (shape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(w / 2, h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.closePath();
    if (material === 'ice') {
      ctx.fillStyle = 'rgba(145, 228, 255, 0.8)';
    } else if (material === 'stone') {
      ctx.fillStyle = '#8b959e';
    } else {
      ctx.fillStyle = '#c87e34';
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  const hw = w / 2;
  const hh = h / 2;

  if (material === 'wood') {
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#dba053');
    grad.addColorStop(0.5, '#c27930');
    grad.addColorStop(1, '#9e5a1d');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, w, h, 3);
    ctx.fill();
    ctx.stroke();

    // Inner bevel & wood grain lines
    ctx.strokeStyle = 'rgba(78, 38, 8, 0.35)';
    ctx.lineWidth = 1.2;
    if (w >= h) {
      ctx.beginPath();
      ctx.moveTo(-hw + 4, -hh * 0.35);
      ctx.lineTo(hw - 4, -hh * 0.35);
      ctx.moveTo(-hw + 6, hh * 0.35);
      ctx.lineTo(hw - 6, hh * 0.35);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.35, -hh + 4);
      ctx.lineTo(-hw * 0.35, hh - 4);
      ctx.moveTo(hw * 0.35, -hh + 6);
      ctx.lineTo(hw * 0.35, hh - 6);
      ctx.stroke();
    }
  } else if (material === 'ice') {
    ctx.fillStyle = 'rgba(138, 224, 252, 0.78)';
    ctx.strokeStyle = '#337ca3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, w, h, 3);
    ctx.fill();
    ctx.stroke();

    // Specular ice sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(-hw + 3, -hh + 3);
    ctx.lineTo(-hw + Math.min(w * 0.45, 22), -hh + 3);
    ctx.lineTo(-hw + 3, -hh + Math.min(h * 0.55, 22));
    ctx.closePath();
    ctx.fill();
  } else if (material === 'stone') {
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#adb6bf');
    grad.addColorStop(0.55, '#869099');
    grad.addColorStop(1, '#616a73');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, w, h, 2);
    ctx.fill();
    ctx.stroke();

    // Chiseled inner edge
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-hw + 2.5, -hh + 2.5, Math.max(1, w - 5), Math.max(1, h - 5));
  } else if (material === 'tnt') {
    // Classic Red & Wood TNT Crate
    ctx.fillStyle = '#c94c24';
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, w, h, 4);
    ctx.fill();
    ctx.stroke();

    // Wood frame slats
    ctx.fillStyle = '#d49046';
    ctx.fillRect(-hw + 2, -hh + 2, w - 4, 6);
    ctx.fillRect(-hw + 2, hh - 8, w - 4, 6);

    // Cream band & bold TNT label
    ctx.fillStyle = '#fff3d1';
    ctx.fillRect(-hw + 3, -hh * 0.4, w - 6, hh * 0.8);
    ctx.fillStyle = '#b81a1a';
    ctx.font = `900 ${Math.max(11, Math.min(w * 0.34, 17))}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 0, 1);
  }

  drawCracks(ctx, w, h, hpRatio, material === 'ice' ? '#ffffff' : '#26180f');
  ctx.restore();
}

function drawCracks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hpRatio: number,
  color = '#26180f',
) {
  if (hpRatio >= 0.78) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.15, -h * 0.25);
  ctx.lineTo(0, -h * 0.04);
  ctx.lineTo(w * 0.18, h * 0.14);
  if (hpRatio < 0.45) {
    ctx.moveTo(0, -h * 0.04);
    ctx.lineTo(-w * 0.24, h * 0.24);
    ctx.moveTo(w * 0.12, -h * 0.32);
    ctx.lineTo(w * 0.04, h * 0.05);
  }
  ctx.stroke();
}

export function drawSlingshotBack(
  ctx: CanvasRenderingContext2D,
  anchorX: number,
  anchorY: number,
  groundY: number,
  birdX: number,
  birdY: number,
  isAiming: boolean,
) {
  ctx.save();
  // Back rubber band (goes to back fork)
  const backForkX = anchorX + 14;
  const backForkY = anchorY - 4;

  ctx.strokeStyle = '#2d1c12';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(backForkX, backForkY);
  if (isAiming) {
    ctx.lineTo(birdX - 8, birdY + 4);
  } else {
    ctx.lineTo(anchorX, anchorY);
  }
  ctx.stroke();

  // Back wooden Y-fork prong
  ctx.fillStyle = '#5c3419';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(anchorX - 5, anchorY + 48);
  ctx.quadraticCurveTo(anchorX + 10, anchorY + 20, backForkX + 4, backForkY - 10);
  ctx.arc(backForkX - 1, backForkY - 8, 6, 0, Math.PI, true);
  ctx.quadraticCurveTo(anchorX + 2, anchorY + 20, anchorX - 10, anchorY + 48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Slingshot trunk base
  ctx.fillStyle = '#734220';
  ctx.beginPath();
  ctx.roundRect(anchorX - 10, anchorY + 38, 20, groundY - (anchorY + 38) + 4, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawSlingshotFront(
  ctx: CanvasRenderingContext2D,
  anchorX: number,
  anchorY: number,
  birdX: number,
  birdY: number,
  isAiming: boolean,
) {
  ctx.save();
  const frontForkX = anchorX - 14;
  const frontForkY = anchorY + 2;

  // Front wooden prong
  ctx.fillStyle = '#8a5027';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(anchorX - 8, anchorY + 48);
  ctx.quadraticCurveTo(anchorX - 18, anchorY + 22, frontForkX - 4, frontForkY - 10);
  ctx.arc(frontForkX + 1, frontForkY - 8, 6, Math.PI, 0, false);
  ctx.quadraticCurveTo(anchorX - 6, anchorY + 20, anchorX + 6, anchorY + 48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Leather pouch
  if (isAiming) {
    const angle = Math.atan2(anchorY - birdY, anchorX - birdX);
    ctx.save();
    ctx.translate(birdX, birdY);
    ctx.rotate(angle);
    ctx.fillStyle = '#3b2113';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-16, 0, 8, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Front rubber band
  ctx.strokeStyle = '#3d2417';
  ctx.lineWidth = 7.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(frontForkX, frontForkY);
  if (isAiming) {
    ctx.lineTo(birdX - 10, birdY + 4);
  } else {
    ctx.lineTo(anchorX, anchorY);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawWorldBackground(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  camX: number,
  groundY: number,
  skyTop: string,
  skyBottom: string,
  hillBack: string,
  hillFront: string,
  time: number,
) {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewW, viewH);

  // Soft sun glow
  ctx.fillStyle = 'rgba(255, 250, 210, 0.35)';
  ctx.beginPath();
  ctx.arc(viewW * 0.78 - camX * 0.04, 110, 72, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 252, 230, 0.75)';
  ctx.beginPath();
  ctx.arc(viewW * 0.78 - camX * 0.04, 110, 40, 0, Math.PI * 2);
  ctx.fill();

  // Drifting fluffy cartoon clouds (parallax 0.15)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  const clouds = [
    { x: 140, y: 95, s: 1.05 },
    { x: 520, y: 68, s: 0.85 },
    { x: 880, y: 120, s: 1.2 },
    { x: 1320, y: 80, s: 0.95 },
    { x: 1720, y: 112, s: 1.1 },
  ];
  for (const c of clouds) {
    const cx = ((c.x + time * 8 - camX * 0.14) % 2100 + 2100) % 2100 - 200;
    const cy = c.y;
    const s = c.s;
    ctx.beginPath();
    ctx.arc(cx, cy, 26 * s, 0, Math.PI * 2);
    ctx.arc(cx + 28 * s, cy - 10 * s, 32 * s, 0, Math.PI * 2);
    ctx.arc(cx + 60 * s, cy - 2 * s, 26 * s, 0, Math.PI * 2);
    ctx.arc(cx + 32 * s, cy + 8 * s, 26 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far rolling hills (parallax 0.28)
  ctx.fillStyle = hillBack;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let px = -100; px <= viewW + 150; px += 40) {
    const wx = px + camX * 0.28;
    const h = Math.sin(wx * 0.0032) * 58 + Math.cos(wx * 0.0068) * 26 + 98;
    ctx.lineTo(px, groundY - h);
  }
  ctx.lineTo(viewW + 150, groundY);
  ctx.closePath();
  ctx.fill();

  // Midground lush hills & tree silhouettes (parallax 0.5)
  ctx.fillStyle = hillFront;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let px = -100; px <= viewW + 150; px += 32) {
    const wx = px + camX * 0.5;
    const h = Math.sin(wx * 0.0055 + 1.4) * 32 + Math.cos(wx * 0.011) * 14 + 48;
    ctx.lineTo(px, groundY - h);
  }
  ctx.lineTo(viewW + 150, groundY);
  ctx.closePath();
  ctx.fill();
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  worldStartX: number,
  worldEndX: number,
  groundY: number,
  bottomY: number,
) {
  // Rich earth layer
  const dirtGrad = ctx.createLinearGradient(0, groundY, 0, bottomY);
  dirtGrad.addColorStop(0, '#78461f');
  dirtGrad.addColorStop(0.3, '#5c3314');
  dirtGrad.addColorStop(1, '#3d200b');
  ctx.fillStyle = dirtGrad;
  ctx.fillRect(worldStartX, groundY, worldEndX - worldStartX, bottomY - groundY);

  // Decorative underground stones
  ctx.fillStyle = 'rgba(40, 20, 6, 0.35)';
  for (let gx = worldStartX; gx < worldEndX; gx += 110) {
    ctx.beginPath();
    ctx.ellipse(gx + 34, groundY + 34, 16, 9, 0.2, 0, Math.PI * 2);
    ctx.ellipse(gx + 82, groundY + 58, 12, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top grass turf strip
  ctx.fillStyle = '#5bb828';
  ctx.fillRect(worldStartX, groundY - 4, worldEndX - worldStartX, 16);

  // Grass top highlight & scalloped grass tufts
  ctx.fillStyle = '#7be03f';
  ctx.fillRect(worldStartX, groundY - 4, worldEndX - worldStartX, 5);

  ctx.strokeStyle = '#1b130f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(worldStartX, groundY - 4);
  ctx.lineTo(worldEndX, groundY - 4);
  ctx.stroke();

  // Bottom shadow edge of grass
  ctx.fillStyle = '#3f8719';
  ctx.fillRect(worldStartX, groundY + 10, worldEndX - worldStartX, 4);
}
