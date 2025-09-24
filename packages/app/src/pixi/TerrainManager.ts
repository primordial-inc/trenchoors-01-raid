import * as PIXI from 'pixi.js';
import { SpriteSheetManager } from '../assets/SpriteSheetManager';
import { TERRAIN_SPRITE_CONFIGS } from '../assets/SpriteSheetConfigs';
import type { GridPosition } from '../types/GameTypes';

export interface TerrainTile {
  type: string;
  variant: number; // Frame index for variety
  position: GridPosition;
}

export interface TerrainPattern {
  tiles: TerrainTile[];
  width: number;
  height: number;
}

export class TerrainManager {
  private spriteManager: SpriteSheetManager;
  private terrainTextures = new Map<string, PIXI.Texture[]>();
  private terrainSprites = new Map<string, PIXI.Sprite>();
  private loadedTerrainTypes = new Set<string>();

  constructor(spriteManager: SpriteSheetManager) {
    this.spriteManager = spriteManager;
  }

  /**
   * Load terrain sprite textures for all configured terrain types
   */
  async loadTerrainSprites(): Promise<void> {
    const terrainConfigs = Object.values(TERRAIN_SPRITE_CONFIGS);
    
    for (const config of terrainConfigs) {
      try {
        // Load the sprite sheet
        await this.spriteManager.loadSpriteSheet(config);
        
        // Chop into individual frame textures
        const frames = this.spriteManager.chopSpriteSheet(config.name, config);
        this.terrainTextures.set(config.name, frames);
        this.loadedTerrainTypes.add(config.name);
        
        console.log(`✅ Loaded terrain sprites: ${config.name} (${frames.length} variants)`);
      } catch (error) {
        console.error(`❌ Failed to load terrain sprites: ${config.name}`, error);
      }
    }
  }

  /**
   * Generate a random terrain pattern for the battlefield
   */
  generateRandomTerrain(width: number, height: number, terrainType: string = 'mixed'): TerrainPattern {
    const tiles: TerrainTile[] = [];
    
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const position: GridPosition = { x: col, y: row };
        
        let tileType: string;
        let variant: number;
        
        if (terrainType === 'mixed') {
          // Mix different terrain types
          const terrainTypes = Array.from(this.loadedTerrainTypes);
          tileType = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        } else {
          // Use specific terrain type
          tileType = terrainType;
        }
        
        // Get random variant for this terrain type
        const textures = this.terrainTextures.get(tileType);
        if (textures && textures.length > 0) {
          variant = Math.floor(Math.random() * textures.length);
        } else {
          // Fallback to first variant
          variant = 0;
        }
        
        tiles.push({
          type: tileType,
          variant,
          position
        });
      }
    }
    
    return {
      tiles,
      width,
      height
    };
  }

  /**
   * Create a terrain sprite for a specific tile
   */
  createTerrainSprite(tile: TerrainTile, cellSize: number): PIXI.Sprite | null {
    const textures = this.terrainTextures.get(tile.type);
    
    if (!textures || !textures[tile.variant]) {
      console.warn(`Terrain texture not found: ${tile.type}[${tile.variant}]`);
      return null;
    }
    
    const sprite = new PIXI.Sprite(textures[tile.variant]);
    
    // Position the sprite
    sprite.x = tile.position.x * cellSize;
    sprite.y = tile.position.y * cellSize;
    
    // Scale to fit cell size
    sprite.width = cellSize;
    sprite.height = cellSize;
    
    return sprite;
  }

  /**
   * Get terrain texture for a specific type and variant
   */
  getTerrainTexture(type: string, variant: number = 0): PIXI.Texture | null {
    const textures = this.terrainTextures.get(type);
    return textures && textures[variant] ? textures[variant] : null;
  }

  /**
   * Create all terrain sprites for a pattern
   */
  createTerrainSprites(pattern: TerrainPattern, cellSize: number): PIXI.Sprite[] {
    const sprites: PIXI.Sprite[] = [];
    
    for (const tile of pattern.tiles) {
      const sprite = this.createTerrainSprite(tile, cellSize);
      if (sprite) {
        sprites.push(sprite);
      }
    }
    
    return sprites;
  }

  /**
   * Get available terrain types
   */
  getAvailableTerrainTypes(): string[] {
    return Array.from(this.loadedTerrainTypes);
  }

  /**
   * Check if terrain type is loaded
   */
  isTerrainTypeLoaded(type: string): boolean {
    return this.loadedTerrainTypes.has(type);
  }

  /**
   * Get terrain sprite by position
   */
  getTerrainSpriteAt(position: GridPosition): PIXI.Sprite | null {
    const key = `${position.y}_${position.x}`;
    return this.terrainSprites.get(key) || null;
  }

  /**
   * Store terrain sprite by position
   */
  setTerrainSpriteAt(position: GridPosition, sprite: PIXI.Sprite): void {
    const key = `${position.y}_${position.x}`;
    this.terrainSprites.set(key, sprite);
  }

  /**
   * Clear all terrain sprites
   */
  clearTerrainSprites(): void {
    for (const sprite of this.terrainSprites.values()) {
      sprite.destroy();
    }
    this.terrainSprites.clear();
  }

  /**
   * Destroy all terrain resources
   */
  destroy(): void {
    this.clearTerrainSprites();
    
    // Clear texture references
    this.terrainTextures.clear();
    this.loadedTerrainTypes.clear();
    
    console.log('🗑️ TerrainManager destroyed');
  }
}
