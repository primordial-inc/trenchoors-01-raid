import * as PIXI from 'pixi.js';

export interface SpriteSheetConfig {
  name: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  animationSpeed?: number;
  loop?: boolean;
}

export class SpriteSheetManager {
  private loadedSheets = new Map<string, PIXI.Texture>();
  private frameCache = new Map<string, PIXI.Texture[]>();

  /**
   * Load a sprite sheet texture from the given path
   */
  async loadSpriteSheet(config: SpriteSheetConfig): Promise<void> {
    const { name, path } = config;
    
    if (this.loadedSheets.has(name)) {
      console.log(`Sprite sheet '${name}' already loaded`);
      return;
    }

    try {
      // Load the texture
      const texture = await PIXI.Assets.load(path);
      this.loadedSheets.set(name, texture);
      console.log(`Successfully loaded sprite sheet: ${name}`);
    } catch (error) {
      console.error(`Failed to load sprite sheet '${name}' from '${path}':`, error);
      throw error;
    }
  }

  /**
   * Chop a loaded sprite sheet into individual frame textures
   */
  chopSpriteSheet(sheetName: string, config: SpriteSheetConfig): PIXI.Texture[] {
    const { frameWidth, frameHeight, frames } = config;
    
    if (!this.loadedSheets.has(sheetName)) {
      throw new Error(`Sprite sheet '${sheetName}' not loaded. Call loadSpriteSheet() first.`);
    }

    // Check if frames are already cached
    const cacheKey = `${sheetName}_${frameWidth}x${frameHeight}_${frames}`;
    if (this.frameCache.has(cacheKey)) {
      return this.frameCache.get(cacheKey)!;
    }

    const baseTexture = this.loadedSheets.get(sheetName)!;
    const frameTextures: PIXI.Texture[] = [];

    // Calculate frames per row (assuming horizontal layout)
    const framesPerRow = Math.floor(baseTexture.width / frameWidth);
    
    for (let i = 0; i < frames; i++) {
      const row = Math.floor(i / framesPerRow);
      const col = i % framesPerRow;
      
      const x = col * frameWidth;
      const y = row * frameHeight;
      
      // Create a texture from the sprite sheet using PIXI v8 approach
      // const frameTexture = PIXI.Texture.from({
      //   source: baseTexture.source,
      //   frame: new PIXI.Rectangle(x, y, frameWidth, frameHeight)
      // });
      const frameTexture = new PIXI.Texture({
        source: baseTexture.source,
        frame: new PIXI.Rectangle(x, y, frameWidth, frameHeight)
      });
      
      frameTextures.push(frameTexture);
    }

    // Cache the frames
    this.frameCache.set(cacheKey, frameTextures);
    console.log(`Chopped sprite sheet '${sheetName}' into ${frames} frames`);
    
    return frameTextures;
  }

  /**
   * Create an animated sprite from a loaded sprite sheet
   */
  createAnimatedSprite(sheetName: string, config: SpriteSheetConfig): PIXI.AnimatedSprite {
    const frames = this.chopSpriteSheet(sheetName, config);
    const animatedSprite = new PIXI.AnimatedSprite(frames);
    
    // Apply configuration
    if (config.animationSpeed !== undefined) {
      animatedSprite.animationSpeed = config.animationSpeed;
    }
    
    if (config.loop !== undefined) {
      animatedSprite.loop = config.loop;
    }
    
    return animatedSprite;
  }

  /**
   * Check if a sprite sheet is loaded
   */
  isLoaded(sheetName: string): boolean {
    return this.loadedSheets.has(sheetName);
  }

  /**
   * Get loaded sprite sheet texture
   */
  getSpriteSheet(sheetName: string): PIXI.Texture | undefined {
    return this.loadedSheets.get(sheetName);
  }

  /**
   * Get cached frames for a sprite sheet configuration
   */
  getCachedFrames(sheetName: string, config: SpriteSheetConfig): PIXI.Texture[] | undefined {
    const cacheKey = `${sheetName}_${config.frameWidth}x${config.frameHeight}_${config.frames}`;
    return this.frameCache.get(cacheKey);
  }

  /**
   * Clear cached frames for a specific sprite sheet
   */
  clearCache(sheetName: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.frameCache.keys()) {
      if (key.startsWith(sheetName)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      const frames = this.frameCache.get(key);
      if (frames) {
        // Destroy textures to free memory
        frames.forEach(frame => frame.destroy());
      }
      this.frameCache.delete(key);
    });
    
    console.log(`Cleared cache for sprite sheet: ${sheetName}`);
  }

  /**
   * Destroy a loaded sprite sheet and clear its cache
   */
  destroySpriteSheet(sheetName: string): void {
    const texture = this.loadedSheets.get(sheetName);
    if (texture) {
      texture.destroy();
      this.loadedSheets.delete(sheetName);
    }
    
    this.clearCache(sheetName);
    console.log(`Destroyed sprite sheet: ${sheetName}`);
  }

  /**
   * Get list of loaded sprite sheet names
   */
  getLoadedSheets(): string[] {
    return Array.from(this.loadedSheets.keys());
  }

  /**
   * Clear all loaded sprite sheets and caches
   */
  destroyAll(): void {
    // Destroy all textures
    for (const texture of this.loadedSheets.values()) {
      texture.destroy();
    }
    
    // Destroy all cached frames
    for (const frames of this.frameCache.values()) {
      frames.forEach(frame => frame.destroy());
    }
    
    this.loadedSheets.clear();
    this.frameCache.clear();
    
    console.log('Destroyed all sprite sheets and caches');
  }
}
