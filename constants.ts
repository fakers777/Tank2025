
import { Direction, GameConfig, TileType } from './types';

// Grid Configuration
export const TILE_SIZE = 24;
export const MAP_COLS = 26; // 26x26 grid standard for Battle City
export const MAP_ROWS = 26;
export const CANVAS_WIDTH = MAP_COLS * TILE_SIZE;
export const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE;

export const CONFIG: GameConfig = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  tileSize: TILE_SIZE,
};

// Colors
export const COLORS = {
  BACKGROUND: '#000000',
  BRICK: '#A52A2A',
  STEEL: '#C0C0C0',
  WATER: '#4169E1',
  TREE: '#228B22',
  PLAYER: '#FFD700', // Gold/Yellow
  ENEMY_BASIC: '#C0C0C0', // Silver
  ENEMY_FAST: '#FF69B4', // Pinkish
  ENEMY_HEAVY: '#008080', // Teal
  BULLET: '#FFFFFF',
};

// Key Mappings
export const KEYS = {
  UP: ['ArrowUp', 'w', 'W'],
  DOWN: ['ArrowDown', 's', 'S'],
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  SHOOT: [' ', 'Enter', 'j', 'J'],
};

// Initial Map (Simple representation of Level 1)
// 0: Empty, 1: Brick, 2: Steel, 3: Water, 4: Tree, 9: Base
// Standard Battle City map size is 26x26
const rawMap = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,2,2,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,2,2,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,2,2,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,2,2,0,0],
  [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,0,0,1,1,3,3,3,1,1,0,0,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,3,3,3,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0],
  [0,2,2,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,2,2,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // Row 24: Protection wall top
  [0,0,0,0,0,0,0,0,0,0,0,1,9,1,0,0,0,0,0,0,0,0,0,0,0,0], // Row 25: Base at index 12 (center), protected by bricks at 11 and 13
];

export const INITIAL_MAP = rawMap;

// Player starts at column 8 (left of base), row 25 (bottom)
// Ensuring this coordinate (8, 25) is 0 in the map above
export const PLAYER_START_X = 8 * TILE_SIZE; 
export const PLAYER_START_Y = 24 * TILE_SIZE; // 24th row (visually 25th row in 0-indexed) - actually bottom is 25.

export const ENEMY_SPAWN_POINTS = [
  { x: 0, y: 0 },
  { x: 12 * TILE_SIZE, y: 0 },
  { x: 24 * TILE_SIZE, y: 0 },
];
