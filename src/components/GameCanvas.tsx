import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { CHARACTERS, PIGS } from '../data/characters';
import { soundEngine } from '../audio/soundEngine';
import {
  drawBird,
  drawBlock,
  drawGround,
  drawPig,
  drawSlingshotBack,
  drawSlingshotFront,
  drawWorldBackground,
} from '../graphics/sprites';
import {
  BirdType,
  LevelDef,
  MaterialType,
  PigType,
  RoundState,
} from '../types/game';

interface GameCanvasProps {
  level: LevelDef;
  isPaused: boolean;
  allBirdsUnlocked: boolean;
  activeBirdOverride: BirdType | null;
  onConsumeOverride: () => void;
  onScoreChange: (score: number) => void;
  onQueueChange: (queue: BirdType[], activeBird: BirdType | null) => void;
  onRoundStateChange: (state: RoundState) => void;
  onLevelComplete: (finalScore: number, stars: number, unusedBirds: number) => void;
  onLevelFailed: (finalScore: number) => void;
  triggerNextTurnSignal: number;
  triggerEagleSignal: number;
  cameraPresetSignal: { mode: 'auto' | 'sling' | 'target'; seq: number };
}

interface BlockEntity {
  id: number;
  body: Matter.Body;
  w: number;
  h: number;
  material: MaterialType;
  shape: 'rect' | 'circle' | 'triangle';
  hp: number;
  maxHp: number;
  bubbledUntil: number;
}

interface PigEntity {
  id: number;
  body: Matter.Body;
  type: PigType;
  radius: number;
  hp: number;
  maxHp: number;
  bubbledUntil: number;
}

interface ActiveBirdEntity {
  body: Matter.Body;
  type: BirdType;
  radius: number;
  abilityUsed: boolean;
  isClone?: boolean;
  isEgg?: boolean;
  isEagleProjectile?: boolean;
  scale: number;
  hurtUntil: number;
  launchedAt: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rot: number;
  vRot: number;
  kind: 'splinter' | 'shard' | 'smoke' | 'spark' | 'feather' | 'bubble' | 'ring';
}

interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface EagleSweep {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  active: boolean;
  hitIds: Set<number>;
}

const WORLD_GROUND_Y = 560;
const SLING_X = 240;
const SLING_Y = 445;
const MAX_PULL = 112;
const LAUNCH_POWER = 0.235;

function getMaterialStats(material: MaterialType) {
  switch (material) {
    case 'ice':
      return { hp: 24, density: 0.0018, friction: 0.25, restitution: 0.15, score: 500 };
    case 'wood':
      return { hp: 50, density: 0.0024, friction: 0.65, restitution: 0.12, score: 500 };
    case 'stone':
      return { hp: 112, density: 0.0044, friction: 0.78, restitution: 0.08, score: 700 };
    case 'boulder':
      return { hp: 155, density: 0.0058, friction: 0.6, restitution: 0.2, score: 900 };
    case 'tnt':
      return { hp: 14, density: 0.0022, friction: 0.7, restitution: 0.1, score: 1500 };
    case 'golden_egg':
      return { hp: 16, density: 0.002, friction: 0.5, restitution: 0.25, score: 5000 };
  }
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  isPaused,
  activeBirdOverride,
  onConsumeOverride,
  onScoreChange,
  onQueueChange,
  onRoundStateChange,
  onLevelComplete,
  onLevelFailed,
  triggerNextTurnSignal,
  triggerEagleSignal,
  cameraPresetSignal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [abilityHint, setAbilityHint] = useState<string | null>(null);

  // Mutable simulation ref so RAF loop runs cleanly at 60fps
  const simRef = useRef<{
    engine: Matter.Engine;
    blocks: Map<number, BlockEntity>;
    pigs: Map<number, PigEntity>;
    activeBirds: ActiveBirdEntity[];
    queue: BirdType[];
    loadedBird: BirdType | null;
    roundState: RoundState;
    score: number;
    graceTicks: number;
    dragStart: { x: number; y: number } | null;
    pullPos: { x: number; y: number };
    panDragStart: { clientX: number; camX: number } | null;
    camX: number;
    targetCamX: number;
    manualCam: boolean;
    shake: number;
    particles: Particle[];
    trailPoints: { x: number; y: number; r: number }[];
    floatingScores: FloatingScore[];
    eagleSweep: EagleSweep | null;
    settleFrames: number;
    endHandled: boolean;
    time: number;
    viewScale: number;
    viewW: number;
    viewH: number;
    lastStretchSound: number;
  } | null>(null);

  const callbacksRef = useRef({
    onScoreChange,
    onQueueChange,
    onRoundStateChange,
    onLevelComplete,
    onLevelFailed,
    onConsumeOverride,
  });
  callbacksRef.current = {
    onScoreChange,
    onQueueChange,
    onRoundStateChange,
    onLevelComplete,
    onLevelFailed,
    onConsumeOverride,
  };

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Handle bird override (from Free Bird mode or Mighty Eagle button)
  useEffect(() => {
    const sim = simRef.current;
    if (!sim || !activeBirdOverride) return;
    if (sim.roundState === 'READY' || sim.roundState === 'AIMING') {
      sim.loadedBird = activeBirdOverride;
      sim.pullPos = { x: SLING_X, y: SLING_Y };
      callbacksRef.current.onQueueChange([...sim.queue], sim.loadedBird);
      callbacksRef.current.onConsumeOverride();
    }
  }, [activeBirdOverride]);

  // Handle manual Mighty Eagle activation
  useEffect(() => {
    if (triggerEagleSignal === 0) return;
    const sim = simRef.current;
    if (!sim) return;
    if (sim.roundState === 'READY' || sim.roundState === 'AIMING') {
      sim.loadedBird = 'mighty_eagle';
      sim.pullPos = { x: SLING_X, y: SLING_Y };
      callbacksRef.current.onQueueChange([...sim.queue], sim.loadedBird);
    }
  }, [triggerEagleSignal]);

  // Handle camera preset toggle
  useEffect(() => {
    const sim = simRef.current;
    if (!sim || cameraPresetSignal.seq === 0) return;
    if (cameraPresetSignal.mode === 'sling') {
      sim.manualCam = true;
      sim.targetCamX = 0;
    } else if (cameraPresetSignal.mode === 'target') {
      sim.manualCam = true;
      sim.targetCamX = Math.max(0, level.structureOriginX - 520);
    } else {
      sim.manualCam = false;
    }
  }, [cameraPresetSignal, level.structureOriginX]);

  // Handle manual "Next Bird / Skip Turn" button
  useEffect(() => {
    if (triggerNextTurnSignal === 0) return;
    const sim = simRef.current;
    if (!sim) return;
    if (sim.roundState === 'FLYING' || sim.roundState === 'SETTLING') {
      sim.settleFrames = 999;
    }
  }, [triggerNextTurnSignal]);

  // Initialize Physics World when level changes
  useEffect(() => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.0, scale: 0.001 },
      positionIterations: 8,
      velocityIterations: 6,
    });

    const ground = Matter.Bodies.rectangle(1100, WORLD_GROUND_Y + 60, 4000, 120, {
      isStatic: true,
      friction: 0.9,
      restitution: 0.15,
      label: 'ground',
    });
    Matter.Composite.add(engine.world, ground);

    const blocks = new Map<number, BlockEntity>();
    const pigs = new Map<number, PigEntity>();

    for (const bDef of level.blocks) {
      const stats = getMaterialStats(bDef.material);
      const wx = level.structureOriginX + bDef.x;
      const wy = WORLD_GROUND_Y - bDef.y;

      let body: Matter.Body;
      const shape = bDef.shape || 'rect';
      if (shape === 'circle' || bDef.material === 'boulder') {
        body = Matter.Bodies.circle(wx, wy, bDef.w / 2, {
          density: stats.density,
          friction: stats.friction,
          restitution: stats.restitution,
          label: `block:${bDef.material}`,
        });
      } else if (shape === 'triangle') {
        const verts = [
          { x: 0, y: -bDef.h / 2 },
          { x: bDef.w / 2, y: bDef.h / 2 },
          { x: -bDef.w / 2, y: bDef.h / 2 },
        ];
        body = Matter.Bodies.fromVertices(wx, wy, [verts], {
          density: stats.density,
          friction: stats.friction,
          restitution: stats.restitution,
          label: `block:${bDef.material}`,
        });
      } else {
        body = Matter.Bodies.rectangle(wx, wy, bDef.w, bDef.h, {
          density: stats.density,
          friction: stats.friction,
          restitution: stats.restitution,
          angle: bDef.angle || 0,
          label: `block:${bDef.material}`,
        });
      }

      Matter.Composite.add(engine.world, body);
      blocks.set(body.id, {
        id: body.id,
        body,
        w: bDef.w,
        h: bDef.h,
        material: bDef.material,
        shape,
        hp: stats.hp,
        maxHp: stats.hp,
        bubbledUntil: 0,
      });
    }

    for (const pDef of level.pigs) {
      const meta = PIGS[pDef.type];
      const wx = level.structureOriginX + pDef.x;
      const wy = WORLD_GROUND_Y - pDef.y;
      const body = Matter.Bodies.circle(wx, wy, meta.radius, {
        density: 0.0022,
        friction: 0.6,
        restitution: 0.25,
        label: `pig:${pDef.type}`,
      });
      Matter.Composite.add(engine.world, body);
      pigs.set(body.id, {
        id: body.id,
        body,
        type: pDef.type,
        radius: meta.radius,
        hp: meta.hp,
        maxHp: meta.hp,
        bubbledUntil: 0,
      });
    }

    const queue = [...level.birds];
    const loadedBird = queue.shift() ?? null;

    simRef.current = {
      engine,
      blocks,
      pigs,
      activeBirds: [],
      queue,
      loadedBird,
      roundState: 'READY',
      score: 0,
      graceTicks: 38,
      dragStart: null,
      pullPos: { x: SLING_X, y: SLING_Y },
      panDragStart: null,
      camX: 0,
      targetCamX: 0,
      manualCam: false,
      shake: 0,
      particles: [],
      trailPoints: [],
      floatingScores: [],
      eagleSweep: null,
      settleFrames: 0,
      endHandled: false,
      time: 0,
      viewScale: 1,
      viewW: 1280,
      viewH: 700,
      lastStretchSound: 0,
    };

    callbacksRef.current.onScoreChange(0);
    callbacksRef.current.onQueueChange([...queue], loadedBird);
    callbacksRef.current.onRoundStateChange('READY');
    setAbilityHint(null);

    const addScore = (pts: number, x: number, y: number, color = '#fff266') => {
      const sim = simRef.current;
      if (!sim || pts <= 0) return;
      sim.score += pts;
      callbacksRef.current.onScoreChange(sim.score);
      sim.floatingScores.push({
        x,
        y,
        text: `+${pts}`,
        color,
        life: 0,
        maxLife: 58,
      });
    };

    const spawnParticles = (
      x: number,
      y: number,
      kind: Particle['kind'],
      color: string,
      count: number,
      speed = 5,
    ) => {
      const sim = simRef.current;
      if (!sim) return;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (0.3 + Math.random() * 0.9) * speed;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - (kind === 'smoke' ? 1 : 2),
          size:
            kind === 'smoke'
              ? 12 + Math.random() * 14
              : kind === 'feather'
                ? 5 + Math.random() * 4
                : 4 + Math.random() * 6,
          color,
          alpha: 1,
          life: 0,
          maxLife: kind === 'smoke' ? 38 + Math.random() * 15 : 28 + Math.random() * 20,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          kind,
        });
      }
    };

    const triggerExplosion = (cx: number, cy: number, radius: number, power: number, stoneBonus = 1) => {
      const sim = simRef.current;
      if (!sim) return;
      soundEngine.playExplosion();
      sim.shake = Math.max(sim.shake, 16);
      spawnParticles(cx, cy, 'smoke', '#545454', 18, 6.5);
      spawnParticles(cx, cy, 'spark', '#ff7b00', 22, 9);
      spawnParticles(cx, cy, 'spark', '#ffe600', 14, 7);
      sim.particles.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        size: radius,
        color: '#ff9500',
        alpha: 0.9,
        life: 0,
        maxLife: 18,
        rot: 0,
        vRot: 0,
        kind: 'ring',
      });

      const toDestroyBlocks: BlockEntity[] = [];
      for (const b of sim.blocks.values()) {
        const dx = b.body.position.x - cx;
        const dy = b.body.position.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < radius) {
          const falloff = 1 - dist / radius;
          const dirX = dist > 1 ? dx / dist : 0;
          const dirY = dist > 1 ? dy / dist : -1;
          Matter.Body.applyForce(b.body, b.body.position, {
            x: dirX * power * falloff * 0.0022,
            y: (dirY - 0.35) * power * falloff * 0.0022,
          });
          const mult = b.material === 'stone' ? stoneBonus : 1;
          b.hp -= falloff * power * 1.45 * mult;
          if (b.hp <= 0) {
            toDestroyBlocks.push(b);
          }
        }
      }

      const toDestroyPigs: PigEntity[] = [];
      for (const p of sim.pigs.values()) {
        const dx = p.body.position.x - cx;
        const dy = p.body.position.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < radius) {
          const falloff = 1 - dist / radius;
          const dirX = dist > 1 ? dx / dist : 0;
          const dirY = dist > 1 ? dy / dist : -1;
          Matter.Body.applyForce(p.body, p.body.position, {
            x: dirX * power * falloff * 0.0018,
            y: (dirY - 0.3) * power * falloff * 0.0018,
          });
          p.hp -= falloff * power * 1.6;
          if (p.hp <= 0) {
            toDestroyPigs.push(p);
          }
        }
      }

      for (const b of toDestroyBlocks) destroyBlock(b);
      for (const p of toDestroyPigs) destroyPig(p);
    };

    const destroyBlock = (b: BlockEntity) => {
      const sim = simRef.current;
      if (!sim || !sim.blocks.has(b.id)) return;
      sim.blocks.delete(b.id);
      Matter.Composite.remove(sim.engine.world, b.body);

      const { x, y } = b.body.position;
      const stats = getMaterialStats(b.material);
      addScore(stats.score, x, y, b.material === 'golden_egg' ? '#ffe44d' : '#ffffff');
      soundEngine.playBreak(b.material);

      if (b.material === 'tnt') {
        triggerExplosion(x, y, 175, 115, 1.4);
      } else if (b.material === 'ice') {
        spawnParticles(x, y, 'shard', '#a6ebff', 10, 5.5);
      } else if (b.material === 'stone' || b.material === 'boulder') {
        spawnParticles(x, y, 'splinter', '#8d969e', 9, 4.5);
      } else if (b.material === 'golden_egg') {
        spawnParticles(x, y, 'spark', '#ffd92e', 18, 6);
      } else {
        spawnParticles(x, y, 'splinter', '#c77f34', 10, 5);
      }
    };

    const destroyPig = (p: PigEntity) => {
      const sim = simRef.current;
      if (!sim || !sim.pigs.has(p.id)) return;
      sim.pigs.delete(p.id);
      Matter.Composite.remove(sim.engine.world, p.body);

      const { x, y } = p.body.position;
      soundEngine.playPigPop();
      spawnParticles(x, y, 'smoke', '#ffffff', 11, 4.2);
      spawnParticles(x, y, 'spark', '#8de342', 8, 4.5);
      addScore(PIGS[p.type].score, x, y - 10, '#a8ff57');
    };

    // Collision damage handler
    Matter.Events.on(engine, 'collisionStart', (event) => {
      const sim = simRef.current;
      if (!sim || sim.graceTicks > 0) return;

      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        const rvx = bodyA.velocity.x - bodyB.velocity.x;
        const rvy = bodyA.velocity.y - bodyB.velocity.y;
        const relSpeed = Math.hypot(rvx, rvy);
        if (relSpeed < 1.65) continue;

        const birdA = sim.activeBirds.find((ab) => ab.body.id === bodyA.id);
        const birdB = sim.activeBirds.find((ab) => ab.body.id === bodyB.id);
        const blockA = sim.blocks.get(bodyA.id);
        const blockB = sim.blocks.get(bodyB.id);
        const pigA = sim.pigs.get(bodyA.id);
        const pigB = sim.pigs.get(bodyB.id);

        // Egg Bomb detonates on first impact!
        if (birdA?.isEgg || birdB?.isEgg) {
          const egg = birdA?.isEgg ? birdA : birdB!;
          if (!egg.abilityUsed) {
            egg.abilityUsed = true;
            triggerExplosion(egg.body.position.x, egg.body.position.y, 145, 95, 1.3);
            Matter.Composite.remove(sim.engine.world, egg.body);
            sim.activeBirds = sim.activeBirds.filter((ab) => ab.body.id !== egg.body.id);
          }
          continue;
        }

        // Sardine Can triggers Mighty Eagle dive!
        if (birdA?.isEagleProjectile || birdB?.isEagleProjectile) {
          const can = birdA?.isEagleProjectile ? birdA : birdB!;
          if (!can.abilityUsed) {
            can.abilityUsed = true;
            const tx = can.body.position.x;
            Matter.Composite.remove(sim.engine.world, can.body);
            sim.activeBirds = sim.activeBirds.filter((ab) => ab.body.id !== can.body.id);
            soundEngine.playBirdVoice('mighty_eagle');
            sim.eagleSweep = {
              x: tx - 560,
              y: -120,
              vx: 26,
              vy: 14,
              targetX: tx + 420,
              active: true,
              hitIds: new Set(),
            };
          }
          continue;
        }

        const applyDamageToBlock = (block: BlockEntity, other: Matter.Body, bird?: ActiveBirdEntity) => {
          const otherMass = other.isStatic ? 6 : Math.min(other.mass, 16);
          let mult = 1;
          if (bird) {
            bird.hurtUntil = sim.time + 0.5;
            if (bird.type === 'blues' && block.material === 'ice') mult = 2.4;
            if (bird.type === 'chuck' && block.material === 'wood') mult = 2.3;
            if (bird.type === 'hal' && block.material === 'wood') mult = 2.0;
            if (bird.type === 'bomb' && block.material === 'stone') mult = 2.4;
            if (bird.type === 'terence') mult = 1.9;
            spawnParticles(
              bird.body.position.x,
              bird.body.position.y,
              'feather',
              CHARACTERS[bird.type].primaryColor,
              4,
              3.5,
            );
          }
          const dmg = relSpeed * Math.sqrt(otherMass) * 2.5 * mult;
          if (dmg > 4) {
            block.hp -= dmg;
            soundEngine.playImpact(block.material, relSpeed);
            if (block.hp <= 0) {
              destroyBlock(block);
            }
          }
        };

        const applyDamageToPig = (pigEnt: PigEntity, other: Matter.Body, bird?: ActiveBirdEntity) => {
          const otherMass = other.isStatic ? 4.5 : Math.min(other.mass, 14);
          const birdMult = bird ? 1.65 : 1.0;
          const dmg = relSpeed * Math.sqrt(otherMass) * 3.1 * birdMult;
          if (dmg > 3.5) {
            pigEnt.hp -= dmg;
            if (pigEnt.hp <= 0) {
              destroyPig(pigEnt);
            }
          }
        };

        if (blockA) applyDamageToBlock(blockA, bodyB, birdB);
        if (blockB) applyDamageToBlock(blockB, bodyA, birdA);
        if (pigA) applyDamageToPig(pigA, bodyB, birdB);
        if (pigB) applyDamageToPig(pigB, bodyA, birdA);
      }
    });

    // Main 60fps loop
    let animId = 0;
    let lastTs = performance.now();

    const stepLoop = (ts: number) => {
      animId = requestAnimationFrame(stepLoop);
      const dtMs = Math.min(32, ts - lastTs);
      lastTs = ts;
      const sim = simRef.current;
      const canvas = canvasRef.current;
      if (!sim || !canvas) return;

      // Resize canvas cleanly to container
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (rect.width > 0 && rect.height > 0) {
        if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
          canvas.width = Math.round(rect.width * dpr);
          canvas.height = Math.round(rect.height * dpr);
        }
        sim.viewW = rect.width;
        sim.viewH = rect.height;
        sim.viewScale = Math.min(rect.width / 1360, rect.height / 660);
        if (sim.viewScale < 0.55) sim.viewScale = 0.55;
        if (sim.viewScale > 1.25) sim.viewScale = 1.25;
      }

      if (!isPausedRef.current && sim.roundState !== 'VICTORY' && sim.roundState !== 'DEFEAT') {
        sim.time += dtMs / 1000;
        if (sim.graceTicks > 0) sim.graceTicks--;

        // Anti-gravity for Stella's bubbled entities
        const nowTime = sim.time;
        for (const b of sim.blocks.values()) {
          if (b.bubbledUntil > nowTime) {
            Matter.Body.applyForce(b.body, b.body.position, {
              x: 0,
              y: -b.body.mass * 0.00145,
            });
          }
        }
        for (const p of sim.pigs.values()) {
          if (p.bubbledUntil > nowTime) {
            Matter.Body.applyForce(p.body, p.body.position, {
              x: 0,
              y: -p.body.mass * 0.00145,
            });
          }
        }

        // Step physics at steady fixed 1000/60
        Matter.Engine.update(sim.engine, 1000 / 60);

        // Mighty Eagle giant dive sweep!
        if (sim.eagleSweep && sim.eagleSweep.active) {
          const es = sim.eagleSweep;
          es.x += es.vx;
          es.y += es.vy;
          if (es.y >= WORLD_GROUND_Y - 70) {
            es.vy = -8;
            sim.shake = 22;
            soundEngine.playExplosion();
          }
          // Obliterate blocks & pigs near Mighty Eagle
          for (const b of [...sim.blocks.values()]) {
            if (Math.hypot(b.body.position.x - es.x, b.body.position.y - es.y) < 115) {
              destroyBlock(b);
            }
          }
          for (const p of [...sim.pigs.values()]) {
            if (Math.hypot(p.body.position.x - es.x, p.body.position.y - es.y) < 125) {
              destroyPig(p);
            }
          }
          if (es.x > es.targetX && es.y < -150) {
            sim.eagleSweep = null;
          }
        }

        // Remove out-of-bounds blocks & pigs
        for (const b of [...sim.blocks.values()]) {
          if (b.body.position.x > 2100 || b.body.position.x < -300 || b.body.position.y > WORLD_GROUND_Y + 90) {
            destroyBlock(b);
          }
        }
        for (const p of [...sim.pigs.values()]) {
          if (p.body.position.x > 2100 || p.body.position.x < -300 || p.body.position.y > WORLD_GROUND_Y + 90) {
            destroyPig(p);
          }
        }

        // Trail dots behind flying primary bird
        if (sim.roundState === 'FLYING' && sim.activeBirds.length > 0) {
          const lead = sim.activeBirds[0];
          const spd = Math.hypot(lead.body.velocity.x, lead.body.velocity.y);
          if (spd > 2.2 && Math.floor(sim.time * 60) % 3 === 0) {
            sim.trailPoints.push({
              x: lead.body.position.x,
              y: lead.body.position.y,
              r: lead.abilityUsed ? 4.5 : 3.2,
            });
            if (sim.trailPoints.length > 45) sim.trailPoints.shift();
          }
        }

        // Check turn settling when birds are flying
        if (sim.roundState === 'FLYING' || sim.roundState === 'SETTLING') {
          let moving = false;
          for (const ab of sim.activeBirds) {
            const spd = Math.hypot(ab.body.velocity.x, ab.body.velocity.y);
            if (
              spd > 0.35 &&
              ab.body.position.x < 1900 &&
              ab.body.position.x > -200 &&
              sim.time - ab.launchedAt < 6.5
            ) {
              moving = true;
            }
          }
          for (const b of sim.blocks.values()) {
            if (Math.hypot(b.body.velocity.x, b.body.velocity.y) > 0.45) moving = true;
          }
          for (const p of sim.pigs.values()) {
            if (Math.hypot(p.body.velocity.x, p.body.velocity.y) > 0.45) moving = true;
          }
          if (sim.eagleSweep?.active) moving = true;

          if (!moving) {
            sim.settleFrames++;
          } else {
            sim.settleFrames = Math.max(0, sim.settleFrames - 2);
          }

          // Check Victory first!
          if (sim.pigs.size === 0 && sim.settleFrames > 32 && !sim.endHandled) {
            sim.endHandled = true;
            sim.roundState = 'VICTORY';
            callbacksRef.current.onRoundStateChange('VICTORY');

            // Unused bird bonus (+10,000 each!)
            const unusedCount = sim.queue.length + (sim.loadedBird ? 1 : 0);
            const bonus = unusedCount * 10000;
            if (bonus > 0) {
              sim.score += bonus;
              callbacksRef.current.onScoreChange(sim.score);
              sim.floatingScores.push({
                x: SLING_X + 60,
                y: SLING_Y - 80,
                text: `בונוס ציפורים +${bonus}`,
                color: '#ffe64d',
                life: 0,
                maxLife: 85,
              });
            }

            const [s1, s2, s3] = level.starThresholds;
            const stars = sim.score >= s3 ? 3 : sim.score >= s2 ? 2 : sim.score >= s1 ? 1 : 1;
            soundEngine.playVictory();
            callbacksRef.current.onLevelComplete(sim.score, stars, unusedCount);
          } else if (sim.settleFrames > 55 && sim.pigs.size > 0 && !sim.endHandled) {
            // Advance to next bird or defeat
            for (const ab of sim.activeBirds) {
              spawnParticles(
                ab.body.position.x,
                ab.body.position.y,
                'smoke',
                '#ffffff',
                6,
                2.5,
              );
              Matter.Composite.remove(sim.engine.world, ab.body);
            }
            sim.activeBirds = [];
            sim.settleFrames = 0;

            const nextBird = sim.queue.shift() ?? null;
            sim.loadedBird = nextBird;
            callbacksRef.current.onQueueChange([...sim.queue], nextBird);
            setAbilityHint(null);

            if (nextBird) {
              sim.roundState = 'READY';
              sim.manualCam = false;
              sim.pullPos = { x: SLING_X, y: SLING_Y };
              callbacksRef.current.onRoundStateChange('READY');
            } else {
              sim.endHandled = true;
              sim.roundState = 'DEFEAT';
              soundEngine.playDefeat();
              callbacksRef.current.onRoundStateChange('DEFEAT');
              callbacksRef.current.onLevelFailed(sim.score);
            }
          }
        }

        // Camera smooth tracking
        const visibleWorldW = sim.viewW / sim.viewScale;
        const maxCamX = Math.max(0, 1480 - visibleWorldW);
        if (!sim.manualCam) {
          if (sim.eagleSweep?.active) {
            sim.targetCamX = Math.max(0, Math.min(maxCamX, sim.eagleSweep.x - visibleWorldW * 0.45));
          } else if (sim.roundState === 'FLYING' && sim.activeBirds.length > 0) {
            const lead = sim.activeBirds[0];
            sim.targetCamX = Math.max(0, Math.min(maxCamX, lead.body.position.x - visibleWorldW * 0.4));
          } else {
            sim.targetCamX = 0;
          }
        } else {
          sim.targetCamX = Math.max(0, Math.min(maxCamX, sim.targetCamX));
        }
        sim.camX += (sim.targetCamX - sim.camX) * 0.1;

        if (sim.shake > 0) sim.shake *= 0.86;
        if (sim.shake < 0.3) sim.shake = 0;

        // Update particles
        for (let i = sim.particles.length - 1; i >= 0; i--) {
          const pt = sim.particles[i];
          pt.life++;
          if (pt.kind !== 'ring') {
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.vy += pt.kind === 'smoke' || pt.kind === 'bubble' ? -0.04 : 0.18;
            pt.rot += pt.vRot;
          }
          pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);
          if (pt.life >= pt.maxLife) sim.particles.splice(i, 1);
        }

        // Update floating scores
        for (let i = sim.floatingScores.length - 1; i >= 0; i--) {
          const fs = sim.floatingScores[i];
          fs.life++;
          fs.y -= 0.7;
          if (fs.life >= fs.maxLife) sim.floatingScores.splice(i, 1);
        }
      }

      // ================= RENDER =================
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, sim.viewW, sim.viewH);

      const shakeX = sim.shake > 0 ? (Math.random() - 0.5) * sim.shake : 0;
      const shakeY = sim.shake > 0 ? (Math.random() - 0.5) * sim.shake : 0;

      const worldGroundScreenY = sim.viewH - Math.max(70, (660 - WORLD_GROUND_Y) * sim.viewScale);
      const groundWorldOffset = worldGroundScreenY / sim.viewScale - WORLD_GROUND_Y;

      drawWorldBackground(
        ctx,
        sim.viewW,
        sim.viewH,
        sim.camX * sim.viewScale,
        worldGroundScreenY,
        level.skyTop,
        level.skyBottom,
        level.hillBack,
        level.hillFront,
        sim.time,
      );

      ctx.save();
      ctx.scale(sim.viewScale, sim.viewScale);
      ctx.translate(-sim.camX + shakeX, groundWorldOffset + shakeY);

      // Ground
      drawGround(ctx, -400, 2400, WORLD_GROUND_Y, WORLD_GROUND_Y + 260);

      // Slingshot Back Layer
      const isAiming = sim.roundState === 'AIMING';
      drawSlingshotBack(
        ctx,
        SLING_X,
        SLING_Y,
        WORLD_GROUND_Y,
        sim.pullPos.x,
        sim.pullPos.y,
        isAiming,
      );

      // Waiting bird queue behind slingshot (with cute idle hops!)
      sim.queue.slice(0, 5).forEach((bType, idx) => {
        const hop = Math.abs(Math.sin(sim.time * 3.2 + idx * 1.4)) * 7;
        const qx = SLING_X - 58 - idx * 44;
        const meta = CHARACTERS[bType];
        const qy = WORLD_GROUND_Y - meta.radius - hop - 2;
        drawBird(ctx, bType, qx, qy, meta.radius * 0.9, 0, {
          state: 'idle',
          blink: Math.sin(sim.time * 2 + idx) > 0.96,
          time: sim.time,
        });
      });

      // Trajectory preview dots while aiming
      if (isAiming && sim.loadedBird) {
        const dx = SLING_X - sim.pullPos.x;
        const dy = SLING_Y - sim.pullPos.y;
        const vx = dx * LAUNCH_POWER;
        const vy = dy * LAUNCH_POWER;
        const g = 0.278; // tuned to match Matter.js 1.0 gravity scale at 60fps
        for (let i = 1; i <= 15; i++) {
          const t = i * 2.4;
          const px = sim.pullPos.x + vx * t;
          const py = sim.pullPos.y + vy * t + 0.5 * g * t * t;
          if (py > WORLD_GROUND_Y) break;
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.2, 0.92 - i * 0.05)})`;
          ctx.strokeStyle = 'rgba(27, 19, 15, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(2.5, 5.2 - i * 0.18), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Flight breadcrumb trail
      for (const tp of sim.trailPoints) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, tp.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Destructible Blocks
      for (const b of sim.blocks.values()) {
        drawBlock(
          ctx,
          b.material,
          b.body.position.x,
          b.body.position.y,
          b.w,
          b.h,
          b.body.angle,
          b.hp / b.maxHp,
          b.shape,
        );
        if (b.bubbledUntil > sim.time) {
          drawSoapBubble(ctx, b.body.position.x, b.body.position.y, Math.max(b.w, b.h) * 0.65);
        }
      }

      // Bad Piggies
      const leadBird = sim.activeBirds[0];
      for (const p of sim.pigs.values()) {
        const distToBird = leadBird
          ? Math.hypot(
              leadBird.body.position.x - p.body.position.x,
              leadBird.body.position.y - p.body.position.y,
            )
          : 999;
        const panicked = distToBird < 210 || Math.hypot(p.body.velocity.x, p.body.velocity.y) > 1.8;
        drawPig(ctx, p.type, p.body.position.x, p.body.position.y, p.radius, p.body.angle, {
          hpRatio: p.hp / p.maxHp,
          panicked,
          blink: !panicked && Math.sin(sim.time * 2.5 + p.id) > 0.965,
          time: sim.time,
        });
        if (p.bubbledUntil > sim.time) {
          drawSoapBubble(ctx, p.body.position.x, p.body.position.y, p.radius * 1.45);
        }
      }

      // Loaded Bird on Slingshot
      if (sim.loadedBird && (sim.roundState === 'READY' || sim.roundState === 'AIMING')) {
        const meta = CHARACTERS[sim.loadedBird];
        const aimAngle = isAiming
          ? Math.atan2(SLING_Y - sim.pullPos.y, SLING_X - sim.pullPos.x) * 0.35
          : 0;
        drawBird(
          ctx,
          sim.loadedBird,
          sim.pullPos.x,
          sim.pullPos.y,
          meta.radius,
          aimAngle,
          {
            state: isAiming ? 'aim' : 'idle',
            blink: !isAiming && Math.sin(sim.time * 3) > 0.96,
            time: sim.time,
          },
        );
      }

      // Flying Active Birds (and Matilda's Egg)
      for (const ab of sim.activeBirds) {
        if (ab.isEgg) {
          ctx.save();
          ctx.translate(ab.body.position.x, ab.body.position.y);
          ctx.fillStyle = '#fff9eb';
          ctx.strokeStyle = '#1b130f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          continue;
        }
        drawBird(
          ctx,
          ab.type,
          ab.body.position.x,
          ab.body.position.y,
          ab.radius,
          ab.body.angle,
          {
            state:
              ab.hurtUntil > sim.time
                ? 'hurt'
                : ab.abilityUsed
                  ? 'ability'
                  : 'flying',
            scale: ab.scale,
            time: sim.time,
          },
        );
      }

      // Mighty Eagle Swoop!
      if (sim.eagleSweep?.active) {
        const es = sim.eagleSweep;
        const eAngle = Math.atan2(es.vy, es.vx);
        drawBird(ctx, 'mighty_eagle', es.x, es.y, 74, eAngle, {
          state: 'ability',
          time: sim.time,
        });
      }

      // Slingshot Front Layer (pouch & front band over bird!)
      drawSlingshotFront(
        ctx,
        SLING_X,
        SLING_Y,
        sim.pullPos.x,
        sim.pullPos.y,
        isAiming,
      );

      // Particles
      for (const pt of sim.particles) {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        if (pt.kind === 'ring') {
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = 8 * pt.alpha;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * (1 - pt.alpha * 0.65), 0, Math.PI * 2);
          ctx.stroke();
        } else if (pt.kind === 'smoke' || pt.kind === 'bubble') {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          if (pt.kind === 'bubble') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        } else {
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.rot);
          ctx.fillStyle = pt.color;
          ctx.fillRect(-pt.size / 2, -pt.size / 3, pt.size, pt.size * 0.65);
        }
        ctx.restore();
      }

      // Floating Score Popups
      for (const fs of sim.floatingScores) {
        const alpha = Math.max(0, 1 - fs.life / fs.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '800 22px Fredoka, Rubik, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#1b130f';
        ctx.lineWidth = 4;
        ctx.strokeText(fs.text, fs.x, fs.y);
        ctx.fillStyle = fs.color;
        ctx.fillText(fs.text, fs.x, fs.y);
        ctx.restore();
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(stepLoop);

    const activateAbility = () => {
      const sim = simRef.current;
      if (!sim || isPausedRef.current) return;
      if (sim.roundState !== 'FLYING' || sim.activeBirds.length === 0) return;

      const lead = sim.activeBirds[0];
      if (lead.abilityUsed || lead.isEgg) return;
      lead.abilityUsed = true;
      setAbilityHint(null);
      soundEngine.playAbility(lead.type);

      const { x, y } = lead.body.position;
      const { x: vx, y: vy } = lead.body.velocity;

      switch (lead.type) {
        case 'red': {
          // Battle Cry Kinetic Wave
          sim.particles.push({
            x,
            y,
            vx: 0,
            vy: 0,
            size: 135,
            color: '#ff4242',
            alpha: 0.9,
            life: 0,
            maxLife: 16,
            rot: 0,
            vRot: 0,
            kind: 'ring',
          });
          for (const b of sim.blocks.values()) {
            const dx = b.body.position.x - x;
            const dy = b.body.position.y - y;
            const d = Math.hypot(dx, dy);
            if (d < 140 && d > 1) {
              const f = (1 - d / 140) * 0.095;
              Matter.Body.applyForce(b.body, b.body.position, {
                x: (dx / d) * f,
                y: (dy / d) * f,
              });
              b.hp -= (1 - d / 140) * 18;
            }
          }
          for (const p of sim.pigs.values()) {
            const dx = p.body.position.x - x;
            const dy = p.body.position.y - y;
            const d = Math.hypot(dx, dy);
            if (d < 140 && d > 1) {
              p.hp -= (1 - d / 140) * 20;
            }
          }
          break;
        }

        case 'blues': {
          // Split into 3 Blue Birds!
          const meta = CHARACTERS.blues;
          const baseAngle = Math.atan2(vy, vx);
          const speed = Math.max(8, Math.hypot(vx, vy));
          for (const offset of [-0.24, 0.24]) {
            const cloneBody = Matter.Bodies.circle(x, y + offset * 38, meta.radius, {
              density: meta.density,
              restitution: meta.restitution,
              friction: 0.4,
              label: 'bird:blues',
            });
            Matter.Body.setVelocity(cloneBody, {
              x: Math.cos(baseAngle + offset) * speed,
              y: Math.sin(baseAngle + offset) * speed,
            });
            Matter.Composite.add(sim.engine.world, cloneBody);
            sim.activeBirds.push({
              body: cloneBody,
              type: 'blues',
              radius: meta.radius,
              abilityUsed: true,
              isClone: true,
              scale: 1,
              hurtUntil: 0,
              launchedAt: sim.time,
            });
          }
          spawnParticles(x, y, 'feather', '#4da8ff', 8, 4);
          break;
        }

        case 'chuck': {
          // Supersonic Turbo Boost!
          const angle = Math.atan2(vy, vx);
          const turboSpeed = Math.max(24, Math.hypot(vx, vy) * 2.1);
          Matter.Body.setVelocity(lead.body, {
            x: Math.cos(angle) * turboSpeed,
            y: Math.sin(angle) * turboSpeed * 0.75,
          });
          spawnParticles(x, y, 'feather', '#ffe338', 10, 5);
          break;
        }

        case 'bomb': {
          // Massive Blast!
          triggerExplosion(x, y, 185, 130, 2.35);
          Matter.Composite.remove(sim.engine.world, lead.body);
          sim.activeBirds = sim.activeBirds.filter((ab) => ab.body.id !== lead.body.id);
          break;
        }

        case 'matilda': {
          // Drop Egg Bomb & Rocket Upward!
          const eggBody = Matter.Bodies.circle(x, y + 24, 13, {
            density: 0.004,
            restitution: 0.1,
            label: 'egg_bomb',
          });
          Matter.Body.setVelocity(eggBody, { x: vx * 0.15, y: 12 });
          Matter.Composite.add(sim.engine.world, eggBody);
          sim.activeBirds.push({
            body: eggBody,
            type: 'matilda',
            radius: 13,
            abilityUsed: false,
            isEgg: true,
            scale: 1,
            hurtUntil: 0,
            launchedAt: sim.time,
          });
          Matter.Body.setVelocity(lead.body, { x: vx + 6, y: -13 });
          spawnParticles(x, y, 'feather', '#ffffff', 8, 4);
          break;
        }

        case 'hal': {
          // Boomerang Reversal!
          Matter.Body.setVelocity(lead.body, {
            x: -Math.max(15, Math.abs(vx) * 1.45),
            y: Math.min(vy, -3.5),
          });
          Matter.Body.setAngularVelocity(lead.body, -0.35);
          spawnParticles(x, y, 'feather', '#43c93e', 8, 4);
          break;
        }

        case 'terence': {
          // Heavy Slam!
          Matter.Body.setVelocity(lead.body, {
            x: vx * 1.15,
            y: vy + 14,
          });
          sim.shake = 6;
          spawnParticles(x, y, 'feather', '#a81922', 8, 4);
          break;
        }

        case 'bubbles': {
          // Balloon Inflation!
          Matter.Body.scale(lead.body, 2.55, 2.55);
          lead.scale = 2.55;
          for (const b of sim.blocks.values()) {
            const dx = b.body.position.x - x;
            const dy = b.body.position.y - y;
            const d = Math.hypot(dx, dy);
            if (d < 155 && d > 1) {
              const f = (1 - d / 155) * 0.14;
              Matter.Body.applyForce(b.body, b.body.position, {
                x: (dx / d) * f,
                y: (dy / d) * f - 0.02,
              });
              b.hp -= (1 - d / 155) * 26;
            }
          }
          for (const p of sim.pigs.values()) {
            const dx = p.body.position.x - x;
            const dy = p.body.position.y - y;
            const d = Math.hypot(dx, dy);
            if (d < 155 && d > 1) {
              p.hp -= (1 - d / 155) * 32;
            }
          }
          break;
        }

        case 'stella': {
          // Pink Soap Bubbles lift blocks & pigs!
          const liftEnd = sim.time + 1.35;
          spawnParticles(x, y, 'bubble', '#ff85c0', 14, 4.5);
          for (const b of sim.blocks.values()) {
            if (Math.hypot(b.body.position.x - x, b.body.position.y - y) < 165) {
              b.bubbledUntil = liftEnd;
              Matter.Body.setVelocity(b.body, { x: b.body.velocity.x, y: -3.2 });
            }
          }
          for (const p of sim.pigs.values()) {
            if (Math.hypot(p.body.position.x - x, p.body.position.y - y) < 165) {
              p.bubbledUntil = liftEnd;
              Matter.Body.setVelocity(p.body, { x: p.body.velocity.x, y: -3.2 });
            }
          }
          break;
        }

        case 'mighty_eagle': {
          // Trigger Mighty Eagle dive right above current spot!
          Matter.Composite.remove(sim.engine.world, lead.body);
          sim.activeBirds = sim.activeBirds.filter((ab) => ab.body.id !== lead.body.id);
          soundEngine.playBirdVoice('mighty_eagle');
          sim.eagleSweep = {
            x: x - 540,
            y: -120,
            vx: 26,
            vy: 14,
            targetX: x + 420,
            active: true,
            hitIds: new Set(),
          };
          break;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        activateAbility();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Store helper on canvas element for pointer events
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      (canvasEl as unknown as { __activateAbility?: () => void }).__activateAbility = activateAbility;
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      Matter.Events.off(engine, 'collisionStart');
      Matter.Engine.clear(engine);
      simRef.current = null;
    };
  }, [level]);

  // Helper to convert pointer coordinates into world coordinates
  const toWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const sim = simRef.current;
    if (!canvas || !sim) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const worldGroundScreenY = sim.viewH - Math.max(70, (660 - WORLD_GROUND_Y) * sim.viewScale);
    const groundWorldOffset = worldGroundScreenY / sim.viewScale - WORLD_GROUND_Y;

    return {
      x: sx / sim.viewScale + sim.camX,
      y: sy / sim.viewScale - groundWorldOffset,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    if (!sim || !canvas || isPaused) return;
    canvas.setPointerCapture(e.pointerId);

    if (sim.roundState === 'FLYING') {
      (canvas as unknown as { __activateAbility?: () => void }).__activateAbility?.();
      return;
    }

    if (sim.roundState === 'READY' && sim.loadedBird) {
      const wp = toWorld(e.clientX, e.clientY);
      const dist = Math.hypot(wp.x - SLING_X, wp.y - SLING_Y);
      if (dist < 115) {
        sim.roundState = 'AIMING';
        sim.dragStart = wp;
        sim.manualCam = false;
        callbacksRef.current.onRoundStateChange('AIMING');
        soundEngine.playStretch();
      } else {
        // Pan battlefield horizontally
        sim.panDragStart = { clientX: e.clientX, camX: sim.camX };
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim || isPaused) return;

    if (sim.roundState === 'AIMING') {
      const wp = toWorld(e.clientX, e.clientY);
      let dx = wp.x - SLING_X;
      let dy = wp.y - SLING_Y;
      const dist = Math.hypot(dx, dy);
      if (dist > MAX_PULL) {
        dx = (dx / dist) * MAX_PULL;
        dy = (dy / dist) * MAX_PULL;
      }
      // Keep bird above ground while pulling down
      if (SLING_Y + dy > WORLD_GROUND_Y - 26) {
        dy = WORLD_GROUND_Y - 26 - SLING_Y;
      }
      sim.pullPos = { x: SLING_X + dx, y: SLING_Y + dy };

      if (sim.time - sim.lastStretchSound > 0.25 && dist > 35) {
        sim.lastStretchSound = sim.time;
        soundEngine.playStretch();
      }
    } else if (sim.panDragStart) {
      const delta = (sim.panDragStart.clientX - e.clientX) / sim.viewScale;
      sim.manualCam = true;
      sim.targetCamX = sim.panDragStart.camX + delta;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    if (!sim) return;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    sim.panDragStart = null;

    if (sim.roundState === 'AIMING' && sim.loadedBird) {
      const dx = SLING_X - sim.pullPos.x;
      const dy = SLING_Y - sim.pullPos.y;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist < 18) {
        // Cancel shot cleanly
        sim.pullPos = { x: SLING_X, y: SLING_Y };
        sim.roundState = 'READY';
        callbacksRef.current.onRoundStateChange('READY');
        return;
      }

      // Launch bird!
      const bType = sim.loadedBird;
      const meta = CHARACTERS[bType];
      const body = Matter.Bodies.circle(sim.pullPos.x, sim.pullPos.y, meta.radius, {
        density: meta.density,
        restitution: meta.restitution,
        friction: 0.5,
        frictionAir: 0.002,
        label: `bird:${bType}`,
      });
      Matter.Body.setVelocity(body, {
        x: dx * LAUNCH_POWER,
        y: dy * LAUNCH_POWER,
      });
      Matter.Composite.add(sim.engine.world, body);

      sim.activeBirds = [
        {
          body,
          type: bType,
          radius: meta.radius,
          abilityUsed: false,
          isEagleProjectile: bType === 'mighty_eagle',
          scale: 1,
          hurtUntil: 0,
          launchedAt: sim.time,
        },
      ];
      sim.trailPoints = [];
      sim.loadedBird = null;
      sim.pullPos = { x: SLING_X, y: SLING_Y };
      sim.roundState = 'FLYING';
      sim.settleFrames = 0;
      sim.manualCam = false;

      soundEngine.playLaunch(bType);
      callbacksRef.current.onRoundStateChange('FLYING');
      callbacksRef.current.onQueueChange([...sim.queue], null);
      setAbilityHint(`לחצו או הקישו רווח להפעלת ${meta.abilityName}`);
    }
  };

  function drawSoapBubble(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 133, 198, 0.34)';
    ctx.strokeStyle = '#ff9ed4';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.32, y - r * 0.32, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
      />
      {abilityHint && (
        <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-xl bg-slate-950/75 px-4 py-2 text-sm font-medium text-amber-200 shadow-lg backdrop-blur-xs border border-white/15">
          {abilityHint}
        </div>
      )}
    </div>
  );
};
