import * as PIXI from 'pixi.js';
import { SpriteSheetManager } from '../assets/SpriteSheetManager';
import { SpriteAnimationController } from './SpriteAnimationController';
import { PLAYER_SPRITE_CONFIGS, BOSS_SPRITE_CONFIGS, getPlayerSpriteConfig, getBossSpriteConfig } from '../assets/EntitySpriteConfigs';
import type { GridPosition } from '../types/GameTypes';

export class SpriteEntityManager {
  private loadedSprites = new Set<string>();
  private spriteManager: SpriteSheetManager;
  private animationController: SpriteAnimationController;

  constructor(
    spriteManager: SpriteSheetManager,
    animationController: SpriteAnimationController
  ) {
    this.spriteManager = spriteManager;
    this.animationController = animationController;
  }

  /**
   * Load all entity sprite sheets
   */
  async loadEntitySprites(): Promise<void> {
    const allConfigs = [
      ...Object.values(PLAYER_SPRITE_CONFIGS),
      ...Object.values(BOSS_SPRITE_CONFIGS)
    ];

    for (const config of allConfigs) {
      try {
        await this.spriteManager.loadSpriteSheet(config);
        this.loadedSprites.add(config.name);
        console.log(`✅ Loaded entity sprite: ${config.name}`);
      } catch (error) {
        console.error(`❌ Failed to load entity sprite: ${config.name}`, error);
      }
    }
  }

  /**
   * Create an animated player sprite
   */
  async createPlayerSprite(color: string, position: GridPosition, playerId: string): Promise<PIXI.AnimatedSprite | null> {
    const config = getPlayerSpriteConfig(color);
    
    if (!config) {
      console.warn(`No sprite config found for player color: ${color}`);
      return null;
    }

    try {
      // Ensure sprite sheet is loaded
      if (!this.loadedSprites.has(config.name)) {
        await this.spriteManager.loadSpriteSheet(config);
        this.loadedSprites.add(config.name);
      }

      // Get chopped frames
      const frames = this.spriteManager.chopSpriteSheet(config.name, config);
      
      // Create animated sprite
      const animatedSprite = this.animationController.createSprite(playerId, frames, {
        animationSpeed: config.animationSpeed,
        loop: config.loop,
        anchor: { x: 0.5, y: 0.5 }, // Center anchor for better positioning
        scale: { x: 0.5, y: 0.5 } // Scale down to fit grid cells better
      });

      // Position the sprite
      this.positionSprite(animatedSprite, position);

      // Start animation
      this.animationController.playAnimation(playerId);

      console.log(`✅ Created player sprite: ${playerId} (${color})`);
      return animatedSprite;

    } catch (error) {
      console.error(`❌ Failed to create player sprite: ${playerId}`, error);
      return null;
    }
  }

  /**
   * Create an animated boss sprite
   */
  async createBossSprite(position: GridPosition, bossId: string = 'boss'): Promise<PIXI.AnimatedSprite | null> {
    const config = getBossSpriteConfig();

    try {
      // Ensure sprite sheet is loaded
      if (!this.loadedSprites.has(config.name)) {
        await this.spriteManager.loadSpriteSheet(config);
        this.loadedSprites.add(config.name);
      }

      // Get chopped frames
      const frames = this.spriteManager.chopSpriteSheet(config.name, config);
      
      // Create animated sprite
      const animatedSprite = this.animationController.createSprite(bossId, frames, {
        animationSpeed: config.animationSpeed,
        loop: config.loop,
        anchor: { x: 0.5, y: 0.5 }, // Center anchor
        scale: { x: 0.8, y: 0.8 } // Larger scale for boss
      });

      // Position the sprite
      this.positionSprite(animatedSprite, position);

      // Start animation
      this.animationController.playAnimation(bossId);

      console.log(`✅ Created boss sprite: ${bossId}`);
      return animatedSprite;

    } catch (error) {
      console.error(`❌ Failed to create boss sprite: ${bossId}`, error);
      return null;
    }
  }

  /**
   * Position a sprite at a grid position
   */
  positionSprite(sprite: PIXI.AnimatedSprite, position: GridPosition, cellSize: number = 40): void {
    // Convert grid position to screen coordinates
    // Grid position: x=0-15 (A-P), y=0-11 (1-12)
    sprite.x = position.x * cellSize + cellSize / 2; // Center in cell
    sprite.y = position.y * cellSize + cellSize / 2; // Center in cell
  }

  /**
   * Update sprite position
   */
  updateSpritePosition(spriteId: string, position: GridPosition, cellSize: number = 40): void {
    const sprite = this.animationController.getSprite(spriteId);
    if (sprite) {
      this.positionSprite(sprite, position, cellSize);
    }
  }

  /**
   * Get sprite by ID
   */
  getSprite(spriteId: string): PIXI.AnimatedSprite | undefined {
    return this.animationController.getSprite(spriteId);
  }

  /**
   * Destroy a sprite
   */
  destroySprite(spriteId: string): void {
    this.animationController.destroySprite(spriteId);
  }

  /**
   * Check if entity sprites are loaded
   */
  areSpritesLoaded(): boolean {
    const requiredSprites = [
      ...Object.keys(PLAYER_SPRITE_CONFIGS),
      ...Object.keys(BOSS_SPRITE_CONFIGS)
    ];
    
    return requiredSprites.every(spriteName => this.loadedSprites.has(spriteName));
  }

  /**
   * Get loading status
   */
  getLoadingStatus(): { loaded: string[]; missing: string[] } {
    const allSprites = [
      ...Object.keys(PLAYER_SPRITE_CONFIGS),
      ...Object.keys(BOSS_SPRITE_CONFIGS)
    ];
    
    const loaded = allSprites.filter(spriteName => this.loadedSprites.has(spriteName));
    const missing = allSprites.filter(spriteName => !this.loadedSprites.has(spriteName));
    
    return { loaded, missing };
  }

  /**
   * Destroy all resources
   */
  destroy(): void {
    this.animationController.destroy();
    this.loadedSprites.clear();
    console.log('🗑️ SpriteEntityManager destroyed');
  }
}
