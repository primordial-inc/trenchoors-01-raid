import type { SpriteSheetConfig } from './SpriteSheetManager';

// Player sprite configurations - using Archer sprites for different player states
export const PLAYER_SPRITE_CONFIGS: Record<string, SpriteSheetConfig> = {
  'archer_idle': {
    name: 'archer_idle',
    path: '/src/assets/sheets/Archer_Idle.png',
    frameWidth: 192,  // Actual sprite pixel size
    frameHeight: 192, // Actual sprite pixel size
    frames: 6,
    animationSpeed: 0.1, // 10fps = 100ms per frame
    loop: true
  },
  'archer_run': {
    name: 'archer_run',
    path: '/src/assets/sheets/Archer_Run.png',
    frameWidth: 192,  // Actual sprite pixel size
    frameHeight: 192, // Actual sprite pixel size
    frames: 4,
    animationSpeed: 0.1, // 10fps = 100ms per frame
    loop: true
  },
  'archer_shoot': {
    name: 'archer_shoot',
    path: '/src/assets/sheets/Archer_Shoot.png',
    frameWidth: 192,  // Actual sprite pixel size
    frameHeight: 192, // Actual sprite pixel size
    frames: 8,
    animationSpeed: 0.1, // 10fps = 100ms per frame
    loop: false
  }
};

// Boss sprite configurations
export const BOSS_SPRITE_CONFIGS: Record<string, SpriteSheetConfig> = {
  'boss_idle': {
    name: 'boss_idle',
    path: '/src/assets/sheets/Boss_idle.png',
    frameWidth: 192,  // Actual sprite pixel size
    frameHeight: 192, // Actual sprite pixel size
    frames: 6, // 2 rows × 6 frames each (using only first 2 rows)
    animationSpeed: 0.1, // 10fps = 100ms per frame
    loop: true
  }
};

// Color mapping for players (since we're using Archer sprites for all players)
export const PLAYER_COLOR_MAPPING: Record<string, string> = {
  'blue': 'archer_idle',
  'red': 'archer_idle', 
  'yellow': 'archer_idle',
  'green': 'archer_idle',
  'purple': 'archer_idle',
  'orange': 'archer_idle',
  'pink': 'archer_idle',
  'cyan': 'archer_idle'
};

// Helper function to get player sprite config by color
export function getPlayerSpriteConfig(color: string): SpriteSheetConfig | undefined {
  const spriteName = PLAYER_COLOR_MAPPING[color];
  return spriteName ? PLAYER_SPRITE_CONFIGS[spriteName] : undefined;
}

// Helper function to get boss sprite config
export function getBossSpriteConfig(): SpriteSheetConfig {
  return BOSS_SPRITE_CONFIGS['boss_idle'];
}

// Helper function to get all available player sprite names
export function getAvailablePlayerSprites(): string[] {
  return Object.keys(PLAYER_SPRITE_CONFIGS);
}

// Helper function to get all available boss sprite names
export function getAvailableBossSprites(): string[] {
  return Object.keys(BOSS_SPRITE_CONFIGS);
}

// Helper function to get all available player colors
export function getAvailablePlayerColors(): string[] {
  return Object.keys(PLAYER_COLOR_MAPPING);
}
