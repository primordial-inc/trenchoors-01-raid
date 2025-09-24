import type { SpriteSheetConfig } from './SpriteSheetManager';

export const SPRITE_SHEET_CONFIGS: Record<string, SpriteSheetConfig> = {
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

// Helper function to get config by name
export function getSpriteSheetConfig(name: string): SpriteSheetConfig | undefined {
  return SPRITE_SHEET_CONFIGS[name];
}

// Helper function to get all available sprite sheet names
export function getAvailableSpriteSheets(): string[] {
  return Object.keys(SPRITE_SHEET_CONFIGS);
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
