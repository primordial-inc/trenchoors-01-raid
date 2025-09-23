// Asset configuration for individual sprites
// These are individual PNG files, not sprite sheets

export interface SpriteConfig {
  path: string;
  width?: number;  // Optional, will be auto-detected
  height?: number; // Optional, will be auto-detected
}

export const SPRITE_CONFIGS = {
  // Players - Pack1 Units (Warrior class for now)
  player_blue_warrior: {
    path: 'assets/Pack1/Units/Blue Units/Warrior/Warrior_Idle.png'
  },
  player_red_warrior: {
    path: 'assets/Pack1/Units/Red Units/Warrior/Warrior_Idle.png'
  },
  player_yellow_warrior: {
    path: 'assets/Pack1/Units/Yellow Units/Warrior/Warrior_Idle.png'
  },
  player_black_warrior: {
    path: 'assets/Pack1/Units/Black Units/Warrior/Warrior_Idle.png'
  },
  
  // Player attack animations
  player_blue_attack: {
    path: 'assets/Pack1/Units/Blue Units/Warrior/Warrior_Attack.png'
  },
  player_red_attack: {
    path: 'assets/Pack1/Units/Red Units/Warrior/Warrior_Attack.png'
  },
  player_yellow_attack: {
    path: 'assets/Pack1/Units/Yellow Units/Warrior/Warrior_Attack.png'
  },
  player_black_attack: {
    path: 'assets/Pack1/Units/Black Units/Warrior/Warrior_Attack.png'
  },
  
  // Boss - Pack1 Buildings
  boss_castle: {
    path: 'assets/Pack1/Buildings/Black Buildings/Castle.png'
  },
  
  // Terrain - Pack1
  terrain_tile1: {
    path: 'assets/Pack1/Terrain/Tilemap_color1.png'
  },
  terrain_tile2: {
    path: 'assets/Pack1/Terrain/Tilemap_color2.png'
  },
  terrain_tile3: {
    path: 'assets/Pack1/Terrain/Tilemap_color3.png'
  },
  
  // Effects - Pack2
  explosion: {
    path: 'assets/Pack2/Effects/Explosion/Explosions.png'
  },
  fire: {
    path: 'assets/Pack2/Effects/Fire/Fire.png'
  },
  
  // Decorations - Pack2
  decoration_rock1: {
    path: 'assets/Pack2/Deco/01.png'
  },
  decoration_rock2: {
    path: 'assets/Pack2/Deco/02.png'
  },
  decoration_rock3: {
    path: 'assets/Pack2/Deco/03.png'
  },
  
  // Trees - Pack1
  tree1: {
    path: 'assets/Pack1/Decorations/Trees/Tree1.png'
  },
  tree2: {
    path: 'assets/Pack1/Decorations/Trees/Tree2.png'
  },
  tree3: {
    path: 'assets/Pack1/Decorations/Trees/Tree3.png'
  },
  tree4: {
    path: 'assets/Pack1/Decorations/Trees/Tree4.png'
  },
  
  // Rocks - Pack1
  rock1: {
    path: 'assets/Pack1/Decorations/Rocks/Rock1.png'
  },
  rock2: {
    path: 'assets/Pack1/Decorations/Rocks/Rock2.png'
  },
  rock3: {
    path: 'assets/Pack1/Decorations/Rocks/Rock3.png'
  },
  rock4: {
    path: 'assets/Pack1/Decorations/Rocks/Rock4.png'
  },
  
  // Bushes - Pack1
  bush1: {
    path: 'assets/Pack1/Decorations/Bushes/Bushe1.png'
  },
  bush2: {
    path: 'assets/Pack1/Decorations/Bushes/Bushe2.png'
  },
  bush3: {
    path: 'assets/Pack1/Decorations/Bushes/Bushe3.png'
  },
  bush4: {
    path: 'assets/Pack1/Decorations/Bushes/Bushe4.png'
  }
} as const;

// Asset categories for organized loading
export const ASSET_CATEGORIES = {
  PLAYERS: [
    'player_blue_warrior',
    'player_red_warrior', 
    'player_yellow_warrior',
    'player_black_warrior',
    'player_blue_attack',
    'player_red_attack',
    'player_yellow_attack',
    'player_black_attack'
  ] as (keyof typeof SPRITE_CONFIGS)[],
  BOSS: [
    'boss_castle'
  ] as (keyof typeof SPRITE_CONFIGS)[],
  TERRAIN: [
    'terrain_tile1',
    'terrain_tile2', 
    'terrain_tile3'
  ] as (keyof typeof SPRITE_CONFIGS)[],
  EFFECTS: [
    'explosion',
    'fire'
  ] as (keyof typeof SPRITE_CONFIGS)[],
  DECORATIONS: [
    'decoration_rock1',
    'decoration_rock2',
    'decoration_rock3',
    'tree1',
    'tree2',
    'tree3',
    'tree4',
    'rock1',
    'rock2',
    'rock3',
    'rock4',
    'bush1',
    'bush2',
    'bush3',
    'bush4'
  ] as (keyof typeof SPRITE_CONFIGS)[]
};

// Helper function to get sprite config by key
export function getSpriteConfig(key: keyof typeof SPRITE_CONFIGS): SpriteConfig {
  return SPRITE_CONFIGS[key];
}

// Helper function to get all sprite keys
export function getAllSpriteKeys(): (keyof typeof SPRITE_CONFIGS)[] {
  return Object.keys(SPRITE_CONFIGS) as (keyof typeof SPRITE_CONFIGS)[];
}

// Helper function to get sprite keys by category
export function getSpriteKeysByCategory(category: keyof typeof ASSET_CATEGORIES): (keyof typeof SPRITE_CONFIGS)[] {
  return ASSET_CATEGORIES[category] as (keyof typeof SPRITE_CONFIGS)[];
}
