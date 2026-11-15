export type BirdType =
  | 'red'
  | 'blues'
  | 'chuck'
  | 'bomb'
  | 'matilda'
  | 'hal'
  | 'terence'
  | 'bubbles'
  | 'stella'
  | 'mighty_eagle';

export type PigType = 'minion' | 'corporal' | 'foreman' | 'king';

export type MaterialType = 'wood' | 'ice' | 'stone' | 'tnt' | 'boulder' | 'golden_egg';

export type BlockShape = 'rect' | 'circle' | 'triangle';

export type GameScreen = 'TITLE_MENU' | 'LEVEL_SELECT' | 'CHARACTERS' | 'PLAYING';

export type RoundState =
  | 'READY'
  | 'AIMING'
  | 'FLYING'
  | 'SETTLING'
  | 'VICTORY'
  | 'DEFEAT'
  | 'PAUSED';

export interface CharacterMeta {
  id: BirdType;
  heName: string;
  enName: string;
  title: string;
  abilityName: string;
  description: string;
  strongAgainst: string;
  radius: number;
  density: number;
  restitution: number;
  primaryColor: string;
  accentColor: string;
}

export interface PigMeta {
  id: PigType;
  heName: string;
  enName: string;
  role: string;
  hp: number;
  radius: number;
  score: number;
}

export interface BlockDef {
  x: number; // relative to structure origin (e.g. 950)
  y: number; // height above GROUND_Y (center y = GROUND_Y - y)
  w: number;
  h: number;
  material: MaterialType;
  shape?: BlockShape;
  angle?: number; // radians
}

export interface PigDef {
  x: number; // relative to structure origin
  y: number; // height above GROUND_Y (center y = GROUND_Y - y)
  type: PigType;
}

export interface LevelDef {
  id: number;
  worldHe: string;
  worldEn: string;
  nameHe: string;
  skyTop: string;
  skyBottom: string;
  hillBack: string;
  hillFront: string;
  birds: BirdType[];
  starThresholds: [number, number, number];
  blocks: BlockDef[];
  pigs: PigDef[];
  structureOriginX: number;
}

export interface LevelProgress {
  stars: number; // 0-3
  highScore: number;
  unlocked: boolean;
}

export type ProgressMap = Record<number, LevelProgress>;
