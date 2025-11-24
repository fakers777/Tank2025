
export const Direction = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
} as const;
export type Direction = typeof Direction[keyof typeof Direction];

export const TileType = {
  EMPTY: 0,
  BRICK: 1,
  STEEL: 2,
  WATER: 3,
  TREE: 4,
  BASE: 9,
} as const;
export type TileType = typeof TileType[keyof typeof TileType];

export const TankType = {
  PLAYER: 'PLAYER',
  ENEMY_BASIC: 'ENEMY_BASIC',
  ENEMY_FAST: 'ENEMY_FAST',
  ENEMY_HEAVY: 'ENEMY_HEAVY',
} as const;
export type TankType = typeof TankType[keyof typeof TankType];

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  width: number;
  height: number;
  direction: Direction;
  speed: number;
  isDestroyed: boolean;
}

export interface Tank extends Entity {
  id: string;
  type: TankType;
  color: string;
  cooldown: number; // Frames until next shot
  health: number;
  scoreValue: number;
  moveTimer?: number; // For AI decision making
}

export interface Bullet extends Entity {
  ownerId: string; // To prevent shooting oneself immediately
  damage: number;
  isPlayerBullet: boolean;
}

export interface GameConfig {
  width: number;
  height: number;
  tileSize: number;
}
