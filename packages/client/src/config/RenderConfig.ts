import type { RenderConfig } from '../types/ClientTypes';

// Default render configuration
export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  canvasWidth: 1200,
  canvasHeight: 800,
  backgroundColor: 0x2C3E50, // Dark blue-gray
  gridWidth: 16,
  gridHeight: 12,
  cellSize: 0, // Will be calculated based on canvas size
  padding: 40
};

// Calculate cell size based on canvas dimensions and grid size
export function calculateCellSize(config: RenderConfig): number {
  const availableWidth = config.canvasWidth - (config.padding * 2);
  const availableHeight = config.canvasHeight - (config.padding * 2);
  
  const cellWidth = availableWidth / config.gridWidth;
  const cellHeight = availableHeight / config.gridHeight;
  
  // Use the smaller dimension to ensure cells fit
  return Math.min(cellWidth, cellHeight);
}

// Get render config with calculated cell size
export function getRenderConfig(overrides?: Partial<RenderConfig>): RenderConfig {
  const config = { ...DEFAULT_RENDER_CONFIG, ...overrides };
  config.cellSize = calculateCellSize(config);
  return config;
}

// Responsive render configurations
export const RESPONSIVE_CONFIGS = {
  // Desktop (1920x1080)
  desktop: {
    canvasWidth: 1600,
    canvasHeight: 900,
    backgroundColor: 0x2C3E50,
    gridWidth: 16,
    gridHeight: 12,
    padding: 50
  },
  
  // Laptop (1366x768)
  laptop: {
    canvasWidth: 1200,
    canvasHeight: 700,
    backgroundColor: 0x2C3E50,
    gridWidth: 16,
    gridHeight: 12,
    padding: 40
  },
  
  // Tablet (1024x768)
  tablet: {
    canvasWidth: 1000,
    canvasHeight: 600,
    backgroundColor: 0x2C3E50,
    gridWidth: 16,
    gridHeight: 12,
    padding: 30
  },
  
  // Mobile (768x1024)
  mobile: {
    canvasWidth: 700,
    canvasHeight: 500,
    backgroundColor: 0x2C3E50,
    gridWidth: 16,
    gridHeight: 12,
    padding: 20
  }
};

// Get responsive config based on screen size
export function getResponsiveConfig(): RenderConfig {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  if (width >= 1920 && height >= 1080) {
    return getRenderConfig(RESPONSIVE_CONFIGS.desktop);
  } else if (width >= 1366 && height >= 768) {
    return getRenderConfig(RESPONSIVE_CONFIGS.laptop);
  } else if (width >= 1024 && height >= 768) {
    return getRenderConfig(RESPONSIVE_CONFIGS.tablet);
  } else {
    return getRenderConfig(RESPONSIVE_CONFIGS.mobile);
  }
}

// Color schemes
export const COLOR_SCHEMES = {
  dark: {
    backgroundColor: 0x2C3E50,
    gridColor: 0x34495E,
    textColor: 0xECF0F1,
    accentColor: 0x3498DB
  },
  
  light: {
    backgroundColor: 0xF8F9FA,
    gridColor: 0xE9ECEF,
    textColor: 0x212529,
    accentColor: 0x007BFF
  },
  
  game: {
    backgroundColor: 0x1A1A2E,
    gridColor: 0x16213E,
    textColor: 0xE94560,
    accentColor: 0x0F3460
  }
};

// Player colors (matching server colors)
export const PLAYER_COLORS = {
  blue: 0x3498DB,
  red: 0xE74C3C,
  yellow: 0xF1C40F,
  black: 0x2C3E50
};

// Boss colors
export const BOSS_COLORS = {
  phase1: 0x8E44AD,
  phase2: 0xE67E22,
  phase3: 0xC0392B,
  enraged: 0xFF0000
};

// Mechanic colors
export const MECHANIC_COLORS = {
  lava: 0xFF6B35,
  meteor: 0x8B4513,
  pillar: 0x708090,
  lightning: 0xFFD700,
  poison: 0x32CD32,
  shockwave: 0x00BFFF
};

// UI colors
export const UI_COLORS = {
  healthBar: {
    background: 0x2C3E50,
    fill: 0x27AE60,
    border: 0x34495E
  },
  
  heroismBar: {
    background: 0x2C3E50,
    fill: 0xF39C12,
    border: 0x34495E
  },
  
  playerList: {
    background: 0x2C3E50,
    text: 0xECF0F1,
    border: 0x34495E,
    highlight: 0x3498DB
  },
  
  announcements: {
    background: 0xE74C3C,
    text: 0xFFFFFF,
    border: 0xC0392B
  }
};

// Animation settings
export const ANIMATION_SETTINGS = {
  playerMove: {
    duration: 300,
    easing: 'ease-out'
  },
  
  playerAttack: {
    duration: 500,
    easing: 'ease-in-out'
  },
  
  bossMechanic: {
    warningDuration: 5000,
    mechanicDuration: 3000,
    easing: 'ease-in-out'
  },
  
  damageNumber: {
    duration: 1000,
    easing: 'ease-out',
    fadeOut: 500
  },
  
  explosion: {
    duration: 800,
    easing: 'ease-out',
    scale: 1.5
  }
};

// Performance settings
export const PERFORMANCE_SETTINGS = {
  maxSprites: 1000,
  maxParticles: 500,
  targetFPS: 60,
  lowFPSThreshold: 30,
  enableCulling: true,
  enableBatching: true
};

// Asset loading settings
export const ASSET_LOADING_SETTINGS = {
  batchSize: 10,
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableFallbacks: true
};
