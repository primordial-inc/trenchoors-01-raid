import * as PIXI from 'pixi.js';
import { SPRITE_CONFIGS } from './AssetConfig';

export interface SpriteLoadResult {
  success: boolean;
  texture?: PIXI.Texture;
  error?: string;
}

export interface SpriteCache {
  [key: string]: PIXI.Texture;
}

export class SpriteLoader {
  private cache: SpriteCache = {};
  private loadingPromises: Map<string, Promise<SpriteLoadResult>> = new Map();

  /**
   * Load a single sprite by key
   * @param spriteKey Key from SPRITE_CONFIGS
   * @returns Promise with load result
   */
  async loadSprite(spriteKey: keyof typeof SPRITE_CONFIGS): Promise<SpriteLoadResult> {
    // Return cached texture if available
    if (this.cache[spriteKey]) {
      return {
        success: true,
        texture: this.cache[spriteKey]
      };
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(spriteKey)) {
      return this.loadingPromises.get(spriteKey)!;
    }

    // Start loading
    const loadPromise = this.loadSpriteFromPath(spriteKey);
    this.loadingPromises.set(spriteKey, loadPromise);

    try {
      const result = await loadPromise;
      if (result.success && result.texture) {
        this.cache[spriteKey] = result.texture;
      }
      return result;
    } finally {
      this.loadingPromises.delete(spriteKey);
    }
  }

  /**
   * Load multiple sprites
   * @param spriteKeys Array of sprite keys
   * @returns Promise with array of load results
   */
  async loadSprites(spriteKeys: (keyof typeof SPRITE_CONFIGS)[]): Promise<SpriteLoadResult[]> {
    const promises = spriteKeys.map(key => this.loadSprite(key));
    return Promise.all(promises);
  }

  /**
   * Load all sprites from a category
   * @param category Asset category
   * @returns Promise with array of load results
   */
  async loadCategory(category: 'PLAYERS' | 'BOSS' | 'TERRAIN' | 'EFFECTS' | 'DECORATIONS'): Promise<SpriteLoadResult[]> {
    const { ASSET_CATEGORIES } = await import('./AssetConfig');
    const spriteKeys = ASSET_CATEGORIES[category] as (keyof typeof SPRITE_CONFIGS)[];
    return this.loadSprites(spriteKeys);
  }

  /**
   * Load all sprites
   * @returns Promise with array of load results
   */
  async loadAllSprites(): Promise<SpriteLoadResult[]> {
    const spriteKeys = Object.keys(SPRITE_CONFIGS) as (keyof typeof SPRITE_CONFIGS)[];
    return this.loadSprites(spriteKeys);
  }

  /**
   * Get cached texture
   * @param spriteKey Sprite key
   * @returns Cached texture or undefined
   */
  getCachedTexture(spriteKey: keyof typeof SPRITE_CONFIGS): PIXI.Texture | undefined {
    return this.cache[spriteKey];
  }

  /**
   * Check if sprite is cached
   * @param spriteKey Sprite key
   * @returns True if cached
   */
  isCached(spriteKey: keyof typeof SPRITE_CONFIGS): boolean {
    return spriteKey in this.cache;
  }

  /**
   * Check if sprite is currently loading
   * @param spriteKey Sprite key
   * @returns True if loading
   */
  isLoading(spriteKey: keyof typeof SPRITE_CONFIGS): boolean {
    return this.loadingPromises.has(spriteKey);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    Object.values(this.cache).forEach(texture => {
      texture.destroy();
    });
    this.cache = {};
  }

  /**
   * Get cache size
   * @returns Number of cached textures
   */
  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }

  /**
   * Internal method to load sprite from path
   * @param spriteKey Sprite key
   * @returns Promise with load result
   */
  private async loadSpriteFromPath(spriteKey: keyof typeof SPRITE_CONFIGS): Promise<SpriteLoadResult> {
    const config = SPRITE_CONFIGS[spriteKey];
    
    try {
      console.log(`Loading sprite: ${spriteKey} from path: ${config.path}`);
      
      // For PixiJS v8, use PIXI.Assets.load() for proper asynchronous loading
      const texture = await PIXI.Assets.load(config.path);
      
      // Check if texture is valid
      if (!texture) {
        throw new Error('Texture failed to load or is invalid');
      }
      
      console.log(`Successfully loaded sprite: ${spriteKey}`, texture);
      
      return {
        success: true,
        texture
      };
    } catch (error) {
      console.error(`Failed to load sprite ${spriteKey} from ${config.path}:`, error);
      
      // Try fallback method with PIXI.Texture.from (synchronous)
      try {
        console.log(`Trying PIXI.Texture.from fallback for ${spriteKey}`);
        const fallbackTexture = PIXI.Texture.from(config.path);
        
        // Check if texture is valid
        if (!fallbackTexture) {
          throw new Error('Fallback texture is invalid');
        }
        
        console.log(`PIXI.Texture.from fallback succeeded for ${spriteKey}`, fallbackTexture);
        
        return {
          success: true,
          texture: fallbackTexture
        };
      } catch (fallbackError) {
        console.error(`PIXI.Texture.from fallback also failed for ${spriteKey}:`, fallbackError);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }

  /**
   * Create fallback texture for failed loads
   * @param width Texture width
   * @param height Texture height
   * @param color Fill color
   * @returns Fallback texture
   */
  createFallbackTexture(width: number = 32, height: number = 32, color: number = 0xFF0000): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    
    return PIXI.RenderTexture.create({ width, height });
  }

  /**
   * Preload critical sprites (players, boss, terrain)
   * @returns Promise with load results
   */
  async preloadCriticalSprites(): Promise<SpriteLoadResult[]> {
    const criticalSprites: (keyof typeof SPRITE_CONFIGS)[] = [
      'player_blue_warrior',
      'player_red_warrior',
      'player_yellow_warrior',
      'player_black_warrior',
      'boss_castle',
      'terrain_tile1'
    ];

    return this.loadSprites(criticalSprites);
  }

  /**
   * Get loading progress for multiple sprites
   * @param spriteKeys Array of sprite keys
   * @returns Loading progress (0-1)
   */
  getLoadingProgress(spriteKeys: (keyof typeof SPRITE_CONFIGS)[]): number {
    const total = spriteKeys.length;
    const loaded = spriteKeys.filter(key => this.isCached(key)).length;
    return total > 0 ? loaded / total : 1;
  }
}

// Singleton instance
export const spriteLoader = new SpriteLoader();
