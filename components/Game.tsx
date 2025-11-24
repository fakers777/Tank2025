
import React, { useRef, useEffect, useCallback } from 'react';
import { 
  Tank, Bullet, Direction, TileType, TankType
} from '../types';
import { 
  CONFIG, COLORS, KEYS, INITIAL_MAP, PLAYER_START_X, PLAYER_START_Y, 
  ENEMY_SPAWN_POINTS, TILE_SIZE, MAP_ROWS, MAP_COLS 
} from '../constants';
import { checkMapCollision, getRect, checkCollision, getHitTile } from '../utils/physics';

interface GameProps {
  onGameOver: (score: number, win: boolean) => void;
  setScore: (score: number) => void;
  setLives: (lives: number) => void;
}

// --- Safe Fallbacks for Imports ---
const SAFE_COLORS = COLORS || {
  BACKGROUND: '#000000',
  BRICK: '#A52A2A',
  STEEL: '#C0C0C0',
  WATER: '#4169E1',
  TREE: '#228B22',
  PLAYER: '#FFD700',
  ENEMY_BASIC: '#C0C0C0',
  ENEMY_FAST: '#FF69B4',
  ENEMY_HEAVY: '#008080',
  BULLET: '#FFFFFF',
};

const SAFE_KEYS = KEYS || {
  UP: ['ArrowUp', 'w', 'W'],
  DOWN: ['ArrowDown', 's', 'S'],
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  SHOOT: [' ', 'Enter'],
};

// Use 24px default if config missing
const SAFE_CONFIG = CONFIG || {
  width: 624,
  height: 624,
  tileSize: 24
};

const SAFE_TANK_TYPE = TankType || {
  PLAYER: 'PLAYER',
  ENEMY_BASIC: 'ENEMY_BASIC',
  ENEMY_FAST: 'ENEMY_FAST',
  ENEMY_HEAVY: 'ENEMY_HEAVY',
};

const SAFE_DIRECTION = Direction || {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

const SAFE_TILE_TYPE = TileType || {
  EMPTY: 0,
  BRICK: 1,
  STEEL: 2,
  WATER: 3,
  TREE: 4,
  BASE: 9,
};

// Fallback size
const SIZE = SAFE_CONFIG.tileSize || 24;
const ROWS = MAP_ROWS || 26;
const COLS = MAP_COLS || 26;

const Game: React.FC<GameProps> = ({ onGameOver, setScore, setLives }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  // Lazy initialization of the map
  const mapRef = useRef<number[][] | null>(null);
  
  if (mapRef.current === null) {
    if (INITIAL_MAP && INITIAL_MAP.length > 0) {
      try {
        mapRef.current = JSON.parse(JSON.stringify(INITIAL_MAP));
      } catch (e) {
        console.error("Failed to parse initial map", e);
        mapRef.current = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));
      }
    } else {
      mapRef.current = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));
    }
    
    // Safety Force: Ensure Base Exists at (25, 12)
    if (mapRef.current && mapRef.current.length > 25) {
       // Clear player spawn area to prevent stuck
       const playerRow = Math.floor((PLAYER_START_Y || (24 * SIZE)) / SIZE);
       const playerCol = Math.floor((PLAYER_START_X || (8 * SIZE)) / SIZE);
       
       if (mapRef.current[playerRow]) {
          mapRef.current[playerRow][playerCol] = 0; // Ensure player start is empty
          // Also clear neighbors to be safe
          if (mapRef.current[playerRow][playerCol+1] !== undefined) mapRef.current[playerRow][playerCol+1] = 0;
          if (playerRow+1 < ROWS && mapRef.current[playerRow+1]) mapRef.current[playerRow+1][playerCol] = 0;
       }

       // Setup Base
       if (mapRef.current[25]) {
         mapRef.current[25][12] = SAFE_TILE_TYPE.BASE;
         // Setup Protection
         if(mapRef.current[25][11] === 0) mapRef.current[25][11] = SAFE_TILE_TYPE.BRICK;
         if(mapRef.current[25][13] === 0) mapRef.current[25][13] = SAFE_TILE_TYPE.BRICK;
         if(mapRef.current[24]) {
            mapRef.current[24][11] = SAFE_TILE_TYPE.BRICK;
            mapRef.current[24][12] = SAFE_TILE_TYPE.BRICK;
            mapRef.current[24][13] = SAFE_TILE_TYPE.BRICK;
         }
       }
       
       console.log("Game Initialized. Player Start:", playerCol, playerRow);
       console.log("Map at Start:", mapRef.current[playerRow]?.[playerCol]);
    }
  }

  const playerRef = useRef<Tank>({
    id: 'p1',
    type: SAFE_TANK_TYPE.PLAYER,
    x: PLAYER_START_X || (8 * SIZE),
    y: PLAYER_START_Y || (24 * SIZE),
    width: SIZE - 2,
    height: SIZE - 2,
    direction: SAFE_DIRECTION.UP,
    speed: 2,
    isDestroyed: false,
    color: SAFE_COLORS.PLAYER,
    cooldown: 0,
    health: 1,
    scoreValue: 0
  });
  
  const enemiesRef = useRef<Tank[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const keysPressed = useRef<Set<string>>(new Set());
  
  // Game State Refs
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const gameActiveRef = useRef(true);
  const frameCountRef = useRef(0);
  const enemySpawnTimerRef = useRef(0);

  // Keep props fresh in refs
  const onGameOverRef = useRef(onGameOver);
  const setScoreRef = useRef(setScore);
  const setLivesRef = useRef(setLives);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
    setScoreRef.current = setScore;
    setLivesRef.current = setLives;
  }, [onGameOver, setScore, setLives]);

  // --- Logic ---

  const spawnEnemy = useCallback(() => {
    if (!mapRef.current || enemiesRef.current.length >= 4) return;
    
    // Fallback spawn points
    const spawns = ENEMY_SPAWN_POINTS || [
      { x: 0, y: 0 },
      { x: 12 * SIZE, y: 0 },
      { x: 24 * SIZE, y: 0 }
    ];
    const spawnPoint = spawns[Math.floor(Math.random() * spawns.length)];
    
    // Simple overlap check
    const isBlocked = enemiesRef.current.some(e => 
      Math.abs(e.x - spawnPoint.x) < SIZE && Math.abs(e.y - spawnPoint.y) < SIZE
    ) || (
      !playerRef.current.isDestroyed &&
      Math.abs(playerRef.current.x - spawnPoint.x) < SIZE && 
      Math.abs(playerRef.current.y - spawnPoint.y) < SIZE
    );

    if (isBlocked) return;

    const types = [SAFE_TANK_TYPE.ENEMY_BASIC, SAFE_TANK_TYPE.ENEMY_FAST, SAFE_TANK_TYPE.ENEMY_HEAVY];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let speed = 1.0; // Slower base speed for 24px tile size
    let color = SAFE_COLORS.ENEMY_BASIC;
    let health = 1;
    let scoreVal = 100;

    if (type === SAFE_TANK_TYPE.ENEMY_FAST) {
      speed = 1.8;
      color = SAFE_COLORS.ENEMY_FAST;
      scoreVal = 200;
    } else if (type === SAFE_TANK_TYPE.ENEMY_HEAVY) {
      speed = 0.8;
      color = SAFE_COLORS.ENEMY_HEAVY;
      health = 3;
      scoreVal = 400;
    }

    enemiesRef.current.push({
      id: `enemy_${Date.now()}_${Math.random()}`,
      type,
      x: spawnPoint.x,
      y: spawnPoint.y,
      width: SIZE - 2,
      height: SIZE - 2,
      direction: SAFE_DIRECTION.DOWN,
      speed,
      isDestroyed: false,
      color,
      cooldown: 50,
      health,
      scoreValue: scoreVal,
      moveTimer: 0
    });
  }, []);

  const fireBullet = useCallback((tank: Tank) => {
    const isPlayer = tank.type === SAFE_TANK_TYPE.PLAYER;
    
    const existing = bulletsRef.current.filter(b => b.ownerId === tank.id).length;
    if (isPlayer && existing >= 2) return;
    if (!isPlayer && existing >= 1) return;

    let bx = tank.x + tank.width / 2 - 2;
    let by = tank.y + tank.height / 2 - 2;
    
    switch (tank.direction) {
      case SAFE_DIRECTION.UP: by = tank.y - 6; break;
      case SAFE_DIRECTION.DOWN: by = tank.y + tank.height + 2; break;
      case SAFE_DIRECTION.LEFT: bx = tank.x - 6; break;
      case SAFE_DIRECTION.RIGHT: bx = tank.x + tank.width + 2; break;
    }

    bulletsRef.current.push({
      x: bx,
      y: by,
      width: 4,
      height: 4,
      direction: tank.direction,
      speed: isPlayer ? 4 : 2, // Scaled for 24px
      isDestroyed: false,
      ownerId: tank.id,
      isPlayerBullet: isPlayer,
      damage: 1
    });
  }, []);

  const updatePlayer = useCallback(() => {
    const player = playerRef.current;
    if (player.isDestroyed || !mapRef.current) return;

    let nextX = player.x;
    let nextY = player.y;
    let moving = false;
    let newDir = player.direction;

    if (SAFE_KEYS.UP.some(k => keysPressed.current.has(k))) {
      nextY -= player.speed;
      newDir = SAFE_DIRECTION.UP;
      moving = true;
    } else if (SAFE_KEYS.DOWN.some(k => keysPressed.current.has(k))) {
      nextY += player.speed;
      newDir = SAFE_DIRECTION.DOWN;
      moving = true;
    } else if (SAFE_KEYS.LEFT.some(k => keysPressed.current.has(k))) {
      nextX -= player.speed;
      newDir = SAFE_DIRECTION.LEFT;
      moving = true;
    } else if (SAFE_KEYS.RIGHT.some(k => keysPressed.current.has(k))) {
      nextX += player.speed;
      newDir = SAFE_DIRECTION.RIGHT;
      moving = true;
    }

    if (moving) {
      if (newDir !== player.direction) {
        player.direction = newDir;
        // Snap to grid
        if (newDir === SAFE_DIRECTION.UP || newDir === SAFE_DIRECTION.DOWN) {
           const gridX = Math.round(player.x / (SIZE / 2)) * (SIZE / 2);
           player.x = gridX;
           nextX = gridX;
        } else {
           const gridY = Math.round(player.y / (SIZE / 2)) * (SIZE / 2);
           player.y = gridY;
           nextY = gridY;
        }
      }

      // Check collision with explicit tile size
      if (!checkMapCollision(player, mapRef.current, nextX, nextY, false, SIZE)) {
        player.x = nextX;
        player.y = nextY;
      }
    }

    if (player.cooldown > 0) player.cooldown--;
    if (SAFE_KEYS.SHOOT.some(k => keysPressed.current.has(k)) && player.cooldown <= 0) {
      fireBullet(player);
      player.cooldown = 15;
    }
  }, [fireBullet]);

  const updateEnemies = useCallback(() => {
    if (!mapRef.current) return;
    
    enemiesRef.current.forEach(enemy => {
      if (enemy.isDestroyed) return;

      if (enemy.moveTimer && enemy.moveTimer > 0) {
        enemy.moveTimer--;
      } else {
        const r = Math.random();
        if (r < 0.05) {
           const dirs = [SAFE_DIRECTION.UP, SAFE_DIRECTION.DOWN, SAFE_DIRECTION.LEFT, SAFE_DIRECTION.RIGHT];
           enemy.direction = dirs[Math.floor(Math.random() * dirs.length)];
           enemy.moveTimer = 30 + Math.random() * 30;
        }
      }

      let nextX = enemy.x;
      let nextY = enemy.y;

      switch (enemy.direction) {
        case SAFE_DIRECTION.UP: nextY -= enemy.speed; break;
        case SAFE_DIRECTION.DOWN: nextY += enemy.speed; break;
        case SAFE_DIRECTION.LEFT: nextX -= enemy.speed; break;
        case SAFE_DIRECTION.RIGHT: nextX += enemy.speed; break;
      }

      if (checkMapCollision(enemy, mapRef.current, nextX, nextY, false, SIZE)) {
         const dirs = [SAFE_DIRECTION.UP, SAFE_DIRECTION.DOWN, SAFE_DIRECTION.LEFT, SAFE_DIRECTION.RIGHT].filter(d => d !== enemy.direction);
         enemy.direction = dirs[Math.floor(Math.random() * dirs.length)];
         enemy.moveTimer = 0; 
      } else {
         enemy.x = nextX;
         enemy.y = nextY;
      }

      if (enemy.cooldown > 0) enemy.cooldown--;
      else if (Math.random() < 0.03) {
        fireBullet(enemy);
        enemy.cooldown = 60 + Math.random() * 60;
      }
    });
  }, [fireBullet]);

  const updateBullets = useCallback(() => {
    if (!mapRef.current) return;

    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const b = bulletsRef.current[i];
      if (b.isDestroyed) {
        bulletsRef.current.splice(i, 1);
        continue;
      }

      switch (b.direction) {
        case SAFE_DIRECTION.UP: b.y -= b.speed; break;
        case SAFE_DIRECTION.DOWN: b.y += b.speed; break;
        case SAFE_DIRECTION.LEFT: b.x -= b.speed; break;
        case SAFE_DIRECTION.RIGHT: b.x += b.speed; break;
      }

      const bRect = getRect(b);

      if (checkMapCollision(b, mapRef.current, b.x, b.y, true, SIZE)) {
        b.isDestroyed = true;
        const tileCoords = getHitTile(b, SIZE);
        if (tileCoords) {
           const { x: c, y: r } = tileCoords;
           if (r >= 0 && r < ROWS && c >= 0 && c < COLS && mapRef.current[r]) {
             const tile = mapRef.current[r][c];
             if (tile === SAFE_TILE_TYPE.BRICK) {
               mapRef.current[r][c] = SAFE_TILE_TYPE.EMPTY;
             } else if (tile === SAFE_TILE_TYPE.BASE) {
               mapRef.current[r][c] = SAFE_TILE_TYPE.EMPTY;
               gameActiveRef.current = false;
               onGameOverRef.current(scoreRef.current, false);
             }
           }
        }
        continue;
      }

      if (!b.isPlayerBullet && !playerRef.current.isDestroyed) {
         if (checkCollision(bRect, getRect(playerRef.current))) {
            b.isDestroyed = true;
            livesRef.current = Math.max(0, livesRef.current - 1);
            setLivesRef.current(livesRef.current);
            
            playerRef.current.x = PLAYER_START_X || (8 * SIZE);
            playerRef.current.y = PLAYER_START_Y || (24 * SIZE);
            playerRef.current.direction = SAFE_DIRECTION.UP;
            
            if (livesRef.current <= 0) {
              playerRef.current.isDestroyed = true;
              gameActiveRef.current = false;
              onGameOverRef.current(scoreRef.current, false);
            }
            continue;
         }
      }

      if (b.isPlayerBullet) {
        for (const enemy of enemiesRef.current) {
          if (!enemy.isDestroyed && checkCollision(bRect, getRect(enemy))) {
             b.isDestroyed = true;
             enemy.health -= 1;
             if (enemy.health <= 0) {
               enemy.isDestroyed = true;
               scoreRef.current += enemy.scoreValue;
               setScoreRef.current(scoreRef.current);
             }
             break;
          }
        }
      }
      
      for (let j = 0; j < bulletsRef.current.length; j++) {
        if (i === j) continue;
        const other = bulletsRef.current[j];
        if (b.isPlayerBullet !== other.isPlayerBullet && !other.isDestroyed) {
          if (checkCollision(bRect, getRect(other))) {
             b.isDestroyed = true;
             other.isDestroyed = true;
             break;
          }
        }
      }
    }
    enemiesRef.current = enemiesRef.current.filter(e => !e.isDestroyed);
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = SAFE_COLORS.BACKGROUND;
    ctx.fillRect(0, 0, SAFE_CONFIG.width, SAFE_CONFIG.height);

    if (!mapRef.current) return;

    for (let row = 0; row < ROWS; row++) {
      if (!mapRef.current[row]) continue;
      for (let col = 0; col < COLS; col++) {
        const tile = mapRef.current[row][col];
        if (typeof tile === 'undefined' || tile === SAFE_TILE_TYPE.EMPTY) continue;
        
        const x = col * SIZE;
        const y = row * SIZE;

        if (tile === SAFE_TILE_TYPE.BRICK) {
          ctx.fillStyle = SAFE_COLORS.BRICK;
          ctx.fillRect(x, y, SIZE, SIZE);
          // Brick pattern relative to SIZE
          ctx.fillStyle = '#8B4513';
          const bw = SIZE / 8; // Brick border width
          const bh = SIZE / 2;
          ctx.fillRect(x + bw, y, bw, bh); // Vertical line top
          ctx.fillRect(x + bw*5, y, bw, bh);
          ctx.fillRect(x, y + bh - 1, SIZE, 2); // Horizontal line
        } else if (tile === SAFE_TILE_TYPE.STEEL) {
          ctx.fillStyle = SAFE_COLORS.STEEL;
          ctx.fillRect(x + 2, y + 2, SIZE - 4, SIZE - 4);
          ctx.strokeStyle = '#FFFFFF';
          ctx.strokeRect(x + 4, y + 4, SIZE - 8, SIZE - 8);
        } else if (tile === SAFE_TILE_TYPE.WATER) {
          ctx.fillStyle = SAFE_COLORS.WATER;
          ctx.fillRect(x, y, SIZE, SIZE);
        } else if (tile === SAFE_TILE_TYPE.BASE) {
          // Draw Eagle/Base - SCALABLE
          ctx.fillStyle = '#FFFF00'; // Yellow
          ctx.beginPath();
          // Upward pointing triangle/eagle head
          ctx.moveTo(x + SIZE/2, y + 2);
          ctx.lineTo(x + SIZE - 4, y + SIZE/2);
          ctx.lineTo(x + 4, y + SIZE/2);
          ctx.fill();
          
          ctx.fillStyle = '#808080'; // Body
          ctx.fillRect(x + 4, y + SIZE/2, SIZE - 8, SIZE/2 - 2);
          
          ctx.fillStyle = '#FF0000'; // Eye
          ctx.fillRect(x + SIZE/2 + 2, y + SIZE/4 + 1, 2, 2);
        }
      }
    }

    const drawTank = (t: Tank) => {
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x, t.y, 6, t.height);
      ctx.fillRect(t.x + t.width - 6, t.y, 6, t.height);
      ctx.fillRect(t.x + 6, t.y + 4, t.width - 12, t.height - 8);

      ctx.fillStyle = t.type === SAFE_TANK_TYPE.PLAYER ? '#DAA520' : '#808080';
      const cx = t.x + t.width / 2;
      const cy = t.y + t.height / 2;
      ctx.fillRect(cx - 5, cy - 5, 10, 10);

      ctx.fillStyle = '#FFFFFF';
      const barrelLen = 14;
      const barrelW = 4;
      switch(t.direction) {
        case SAFE_DIRECTION.UP: ctx.fillRect(cx - 2, t.y - 2, barrelW, barrelLen); break;
        case SAFE_DIRECTION.DOWN: ctx.fillRect(cx - 2, cy, barrelW, barrelLen); break;
        case SAFE_DIRECTION.LEFT: ctx.fillRect(t.x - 2, cy - 2, barrelLen, barrelW); break;
        case SAFE_DIRECTION.RIGHT: ctx.fillRect(cx, cy - 2, barrelLen, barrelW); break;
      }
      
      if (t.health > 1) {
        ctx.fillStyle = 'red';
        ctx.fillRect(t.x, t.y - 4, t.width * (t.health / 3), 2);
      }
    };

    if (!playerRef.current.isDestroyed) {
      drawTank(playerRef.current);
    }

    enemiesRef.current.forEach(e => drawTank(e));

    ctx.fillStyle = SAFE_COLORS.BULLET;
    bulletsRef.current.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x + b.width/2, b.y + b.height/2, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let row = 0; row < ROWS; row++) {
      if (!mapRef.current[row]) continue;
      for (let col = 0; col < COLS; col++) {
        if (mapRef.current[row][col] === SAFE_TILE_TYPE.TREE) {
           ctx.fillStyle = SAFE_COLORS.TREE;
           ctx.globalAlpha = 0.7;
           ctx.fillRect(col * SIZE, row * SIZE, SIZE, SIZE);
           ctx.globalAlpha = 1.0;
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const allKeys = Object.values(SAFE_KEYS).flat();
      if (allKeys.includes(e.key)) {
         e.preventDefault();
         keysPressed.current.add(e.key);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    gameActiveRef.current = true;
    
    const loop = () => {
      if (!gameActiveRef.current) return;
      
      try {
        // Ensure map is loaded before updating logic
        if (!mapRef.current) {
           requestRef.current = requestAnimationFrame(loop);
           return;
        }

        frameCountRef.current++;
        enemySpawnTimerRef.current++;
        if (enemySpawnTimerRef.current > 180) {
          spawnEnemy();
          enemySpawnTimerRef.current = 0;
        }

        updatePlayer();
        updateEnemies();
        updateBullets();
        
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          draw(ctx);
        }
      } catch (e) {
        console.error("Game loop error (recovered):", e);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      gameActiveRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [spawnEnemy, updatePlayer, updateEnemies, updateBullets, draw]);

  return (
    <div className="relative border-4 border-gray-600 bg-black shadow-2xl">
      <canvas 
        ref={canvasRef}
        width={SAFE_CONFIG.width}
        height={SAFE_CONFIG.height}
        className="block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default Game;
