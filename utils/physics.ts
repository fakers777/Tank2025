
import { Entity, Point } from '../types';

// Local constants to avoid import dependency issues
const DEFAULT_TILE_SIZE = 32;
const DEFAULT_ROWS = 26;
const DEFAULT_COLS = 26;

// Define TileTypes locally for physics calculations
const TILE_EMPTY = 0;
const TILE_BRICK = 1;
const TILE_STEEL = 2;
const TILE_WATER = 3;
const TILE_TREE = 4;
const TILE_BASE = 9;

// Define Directions locally
const DIR_UP = 'UP';
const DIR_DOWN = 'DOWN';
const DIR_LEFT = 'LEFT';
const DIR_RIGHT = 'RIGHT';

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const getRect = (entity: Entity): Rect => {
  if (!entity) return { left: 0, right: 0, top: 0, bottom: 0 };
  const buffer = 2; // Smaller collision box to allow sliding through gaps
  return {
    left: entity.x + buffer,
    right: entity.x + entity.width - buffer,
    top: entity.y + buffer,
    bottom: entity.y + entity.height - buffer,
  };
};

export const checkCollision = (rect1: Rect, rect2: Rect): boolean => {
  if (!rect1 || !rect2) return false;
  return (
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top
  );
};

export const isSolidTile = (tile: number, forBullet: boolean = false) => {
  if (tile === TILE_BRICK || tile === TILE_STEEL || tile === TILE_BASE) return true;
  if (!forBullet && tile === TILE_WATER) return true;
  return false;
};

// Check if an entity collides with map walls or borders
export const checkMapCollision = (
  entity: Entity, 
  map: number[][], 
  nextX: number, 
  nextY: number, 
  isBullet: boolean = false,
  tileSize: number = DEFAULT_TILE_SIZE
): boolean => {
  // Use map dimensions if available, otherwise defaults
  const rows = map?.length || DEFAULT_ROWS;
  const cols = map?.[0]?.length || DEFAULT_COLS;
  const mapWidth = cols * tileSize;
  const mapHeight = rows * tileSize;

  if (!map || map.length === 0) return true;
  
  // Guard against NaN
  if (isNaN(nextX) || isNaN(nextY)) return true;

  // 1. Boundary Checks
  if (nextX < 0 || nextX + entity.width > mapWidth ||
      nextY < 0 || nextY + entity.height > mapHeight) {
    return true;
  }

  // 2. Tile Collision Check
  const corners = [
    { x: nextX + 1, y: nextY + 1 }, // Top-Left + 1px buffer
    { x: nextX + entity.width - 1, y: nextY + 1 }, // Top-Right
    { x: nextX + 1, y: nextY + entity.height - 1 }, // Bottom-Left
    { x: nextX + entity.width - 1, y: nextY + entity.height - 1 }, // Bottom-Right
  ];

  for (const point of corners) {
    const col = Math.floor(point.x / tileSize);
    const row = Math.floor(point.y / tileSize);

    // Explicitly handle out-of-bounds indices
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return true;
    }

    // Safety check for map row existence
    if (!map[row]) {
      return true;
    }

    const tile = map[row][col];
    
    // Safety check for tile existence
    if (typeof tile === 'undefined') {
      return true;
    }

    if (isSolidTile(tile, isBullet)) {
      return true;
    }
  }

  return false;
};

// Get the tile coordinate hit by a bullet
export const getHitTile = (bullet: Entity, tileSize: number = DEFAULT_TILE_SIZE): Point | null => {
  const center = {
    x: bullet.x + bullet.width / 2,
    y: bullet.y + bullet.height / 2
  };
  
  // Predict slightly ahead to find the tile being hit
  let checkX = center.x;
  let checkY = center.y;
  
  const offset = tileSize / 2; // Look ahead 1/2 tile

  const dir = bullet.direction;
  if (dir === DIR_UP) checkY -= offset;
  else if (dir === DIR_DOWN) checkY += offset;
  else if (dir === DIR_LEFT) checkX -= offset;
  else if (dir === DIR_RIGHT) checkX += offset;

  const col = Math.floor(checkX / tileSize);
  const row = Math.floor(checkY / tileSize);

  if (row >= 0 && col >= 0) {
    return { x: col, y: row };
  }
  return null;
};
