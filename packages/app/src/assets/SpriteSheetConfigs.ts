import type { SpriteSheetConfig } from './SpriteSheetManager';

export const SPRITE_SHEET_CONFIGS: Record<string, SpriteSheetConfig> = {
  // Archer animations (single row)
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
  },

  // Effect animations
  'effect_dead': {
    name: 'effect_dead',
    path: '/src/assets/sheets/Dead.png',
    frameWidth: 128,  // Actual sprite pixel size
    frameHeight: 128, // Actual sprite pixel size
    frames: 14, // 2 rows × 7 frames each
    animationSpeed: 0.1, // 10fps = 100ms per frame
    loop: false
  },
  'effect_explosion': {
    name: 'effect_explosion',
    path: '/src/assets/sheets/Effect_explosion.png',
    frameWidth: 192,  // Actual sprite pixel size
    frameHeight: 192, // Actual sprite pixel size
    frames: 8, // 1 row × 8 frames
    animationSpeed: 0.1, // 10fps = 100ms per frame
    loop: false
  },
  'effect_fire': {
    name: 'effect_fire',
    path: '/src/assets/sheets/Effect_fire.png',
    frameWidth: 128,  // Actual sprite pixel size
    frameHeight: 128, // Actual sprite pixel size
    frames: 7, // 1 row × 7 frames
    animationSpeed: 0.1, // 10fps = 100ms per frame
    loop: true
  },

  // Boss animations
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

// Terrain sprite configurations
export const TERRAIN_SPRITE_CONFIGS: Record<string, SpriteSheetConfig> = {
  'terrain_flat': {
    name: 'terrain_flat',
    path: '/src/assets/sheets/Terrain_flat.png',
    frameWidth: 64,  // Grid cell size
    frameHeight: 64, // Grid cell size
    frames: 16, // Multiple terrain variations
    animationSpeed: 0.1, // Not used for static terrain
    loop: false // Static terrain doesn't animate
  }
};

// Helper function to get config by name
export function getSpriteSheetConfig(name: string): SpriteSheetConfig | undefined {
  return SPRITE_SHEET_CONFIGS[name];
}

// Helper function to get all available sprite sheet names
export function getAvailableSpriteSheets(): string[] {
  return Object.keys(SPRITE_SHEET_CONFIGS);
}

// Helper function to get terrain config by name
export function getTerrainSpriteConfig(name: string): SpriteSheetConfig | undefined {
  return TERRAIN_SPRITE_CONFIGS[name];
}

// Helper function to get all available terrain sprite names
export function getAvailableTerrainSprites(): string[] {
  return Object.keys(TERRAIN_SPRITE_CONFIGS);
}

// Helper function to create a custom config
export function createSpriteSheetConfig(
  name: string,
  path: string,
  frameWidth: number,
  frameHeight: number,
  frames: number,
  options?: {
    animationSpeed?: number;
    loop?: boolean;
  }
): SpriteSheetConfig {
  return {
    name,
    path,
    frameWidth,
    frameHeight,
    frames,
    animationSpeed: options?.animationSpeed || 0.1,
    loop: options?.loop !== false
  };
}
