import * as PIXI from 'pixi.js';
import { getMovementDuration } from '../config/AnimationConfig';
import type { GridPosition } from '../types/GameTypes';

interface MoveTween {
  sprite: PIXI.AnimatedSprite;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  startTime: number;
  duration: number;
  onComplete?: () => void;
  entityId: string;
}

export class MovementTweener {
  private activeTweens = new Map<string, MoveTween>();
  private ticker: PIXI.Ticker;

  constructor() {
    this.ticker = PIXI.Ticker.shared;
    this.ticker.add(this.update.bind(this));
  }

  /**
   * Create smooth movement between positions
   */
  moveEntity(
    entityId: string, 
    sprite: PIXI.AnimatedSprite, 
    fromPosition: GridPosition, 
    toPosition: GridPosition, 
    duration: number = getMovementDuration(),
    cellSize: number = 40
  ): Promise<void> {
    return new Promise((resolve) => {
      // Stop any existing movement for this entity
      this.stopTween(entityId);

      // Convert grid positions to screen coordinates
      const startPos = {
        x: fromPosition.x * cellSize + cellSize / 2,
        y: fromPosition.y * cellSize + cellSize / 2
      };
      
      const endPos = {
        x: toPosition.x * cellSize + cellSize / 2,
        y: toPosition.y * cellSize + cellSize / 2
      };

      // Create tween
      const tween: MoveTween = {
        sprite,
        startPos,
        endPos,
        startTime: Date.now(),
        duration,
        entityId,
        onComplete: () => {
          this.activeTweens.delete(entityId);
          resolve();
        }
      };

      this.activeTweens.set(entityId, tween);
      
      console.log(`🚶 Started smooth movement for ${entityId}: (${fromPosition.x},${fromPosition.y}) → (${toPosition.x},${toPosition.y})`);
    });
  }

  /**
   * Update tween animations
   */
  private update(): void {
    const currentTime = Date.now();
    
    for (const [entityId, tween] of this.activeTweens) {
      const elapsed = currentTime - tween.startTime;
      const progress = Math.min(elapsed / tween.duration, 1);
      
      // Apply easing (ease-out)
      const easedProgress = this.easeOutCubic(progress);
      
      // Interpolate position
      const currentX = tween.startPos.x + (tween.endPos.x - tween.startPos.x) * easedProgress;
      const currentY = tween.startPos.y + (tween.endPos.y - tween.startPos.y) * easedProgress;
      
      // Update sprite position
      tween.sprite.x = currentX;
      tween.sprite.y = currentY;
      
      // Check if movement is complete
      if (progress >= 1) {
        // Ensure final position is exact
        tween.sprite.x = tween.endPos.x;
        tween.sprite.y = tween.endPos.y;
        
        // Call completion callback
        if (tween.onComplete) {
          tween.onComplete();
        }
        
        console.log(`✅ Completed smooth movement for ${entityId}`);
      }
    }
  }

  /**
   * Ease-out cubic easing function
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Stop tween for specific entity
   */
  stopTween(entityId: string): void {
    const tween = this.activeTweens.get(entityId);
    if (tween) {
      this.activeTweens.delete(entityId);
      console.log(`⏹️ Stopped movement tween for ${entityId}`);
    }
  }

  /**
   * Check if entity is currently moving
   */
  isMoving(entityId: string): boolean {
    return this.activeTweens.has(entityId);
  }

  /**
   * Get movement progress for entity (0-1)
   */
  getMovementProgress(entityId: string): number {
    const tween = this.activeTweens.get(entityId);
    if (!tween) return 0;
    
    const elapsed = Date.now() - tween.startTime;
    return Math.min(elapsed / tween.duration, 1);
  }

  /**
   * Get all currently moving entities
   */
  getMovingEntities(): string[] {
    return Array.from(this.activeTweens.keys());
  }

  /**
   * Stop all tweens
   */
  stopAllTweens(): void {
    this.activeTweens.clear();
    console.log('⏹️ Stopped all movement tweens');
  }

  /**
   * Update sprite position immediately (for instant movement)
   */
  setSpritePosition(sprite: PIXI.AnimatedSprite, position: GridPosition, cellSize: number = 40): void {
    sprite.x = position.x * cellSize + cellSize / 2;
    sprite.y = position.y * cellSize + cellSize / 2;
  }

  /**
   * Destroy tweener and clean up
   */
  destroy(): void {
    this.ticker.remove(this.update.bind(this));
    this.stopAllTweens();
    console.log('🗑️ MovementTweener destroyed');
  }
}
