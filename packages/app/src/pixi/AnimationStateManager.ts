import { SpriteAnimationController } from './SpriteAnimationController';
import { getAnimationConfig, getAttackDuration, getAutoReturnDelay, type AnimationType, type EntityType } from '../config/AnimationConfig';
import type { GridPosition } from '../types/GameTypes';

export interface EntityAnimationState {
  id: string;
  entityType: EntityType;
  currentAnimation: AnimationType;
  isMoving: boolean;
  targetPosition?: GridPosition;
  moveStartTime?: number;
  moveDuration: number;
  lastActionTime?: number;
  isDead: boolean;
}

export class AnimationStateManager {
  private entityStates = new Map<string, EntityAnimationState>();
  private animationController: SpriteAnimationController;
  private autoReturnTimers = new Map<string, number>();

  constructor(animationController: SpriteAnimationController) {
    this.animationController = animationController;
  }

  /**
   * Initialize entity animation state
   */
  initializeEntity(id: string, entityType: EntityType, _position: GridPosition): void {
    const state: EntityAnimationState = {
      id,
      entityType,
      currentAnimation: 'idle',
      isMoving: false,
      moveDuration: 400,
      isDead: false
    };
    
    this.entityStates.set(id, state);
    this.setEntityAnimation(id, 'idle');
  }

  /**
   * Set entity animation
   */
  setEntityAnimation(id: string, animation: AnimationType): void {
    const state = this.entityStates.get(id);
    if (!state) {
      console.warn(`No animation state found for entity: ${id}`);
      return;
    }

    // Don't change animation if entity is dead (except for death animation)
    if (state.isDead && animation !== 'death') {
      return;
    }

    state.currentAnimation = animation;
    
    // For now, we'll use the same sprite sheet but change the animation speed
    // In a full implementation, we'd switch between different sprite sheets
    if (this.animationController.hasSprite(id)) {
      const config = getAnimationConfig(state.entityType, animation);
      this.animationController.setAnimationSpeed(id, config.speed);
      this.animationController.setLoop(id, config.loop);
      this.animationController.playAnimation(id);
    }

    console.log(`🎬 Set ${state.entityType} ${id} animation to: ${animation}`);
  }

  /**
   * Start moving animation
   */
  startMoving(id: string, targetPosition: GridPosition): void {
    const state = this.entityStates.get(id);
    if (!state || state.isDead) return;

    state.isMoving = true;
    state.targetPosition = targetPosition;
    state.moveStartTime = Date.now();
    
    this.setEntityAnimation(id, 'walk');
    
    // Clear any existing auto-return timer
    this.clearAutoReturnTimer(id);
  }

  /**
   * Finish moving animation
   */
  finishMoving(id: string): void {
    const state = this.entityStates.get(id);
    if (!state) return;

    state.isMoving = false;
    state.targetPosition = undefined;
    state.moveStartTime = undefined;
    
    // Return to idle after a short delay
    this.scheduleAutoReturnToIdle(id);
  }

  /**
   * Trigger attack animation
   */
  triggerAttack(id: string, duration?: number): void {
    const state = this.entityStates.get(id);
    if (!state || state.isDead) return;

    const attackDuration = duration || getAttackDuration();
    
    this.setEntityAnimation(id, 'attack');
    
    // Clear any existing auto-return timer
    this.clearAutoReturnTimer(id);
    
    // Schedule return to idle after attack
    const timer = setTimeout(() => {
      this.setEntityAnimation(id, 'idle');
      this.autoReturnTimers.delete(id);
    }, attackDuration);
    
    this.autoReturnTimers.set(id, timer);
    
    console.log(`⚔️ Triggered attack animation for ${id} (${attackDuration}ms)`);
  }

  /**
   * Set entity as dead
   */
  setEntityDead(id: string): void {
    const state = this.entityStates.get(id);
    if (!state) return;

    state.isDead = true;
    state.isMoving = false;
    
    // Clear any movement or auto-return timers
    this.clearAutoReturnTimer(id);
    
    // Set death animation
    this.setEntityAnimation(id, 'death');
    
    // Make sprite semi-transparent
    const sprite = this.animationController.getSprite(id);
    if (sprite) {
      sprite.alpha = 0.5;
    }
    
    console.log(`💀 Set ${id} as dead`);
  }

  /**
   * Set entity as alive
   */
  setEntityAlive(id: string): void {
    const state = this.entityStates.get(id);
    if (!state) return;

    state.isDead = false;
    
    // Restore full opacity
    const sprite = this.animationController.getSprite(id);
    if (sprite) {
      sprite.alpha = 1.0;
    }
    
    // Return to idle animation
    this.setEntityAnimation(id, 'idle');
    
    console.log(`❤️ Set ${id} as alive`);
  }

  /**
   * Get entity animation state
   */
  getEntityState(id: string): EntityAnimationState | undefined {
    return this.entityStates.get(id);
  }

  /**
   * Check if entity is moving
   */
  isEntityMoving(id: string): boolean {
    const state = this.entityStates.get(id);
    return state ? state.isMoving : false;
  }

  /**
   * Check if entity is dead
   */
  isEntityDead(id: string): boolean {
    const state = this.entityStates.get(id);
    return state ? state.isDead : false;
  }

  /**
   * Get current animation
   */
  getCurrentAnimation(id: string): AnimationType | undefined {
    const state = this.entityStates.get(id);
    return state ? state.currentAnimation : undefined;
  }

  /**
   * Schedule auto-return to idle animation
   */
  private scheduleAutoReturnToIdle(id: string): void {
    this.clearAutoReturnTimer(id);
    
    const timer = setTimeout(() => {
      this.setEntityAnimation(id, 'idle');
      this.autoReturnTimers.delete(id);
    }, getAutoReturnDelay());
    
    this.autoReturnTimers.set(id, timer);
  }

  /**
   * Clear auto-return timer
   */
  private clearAutoReturnTimer(id: string): void {
    const timer = this.autoReturnTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoReturnTimers.delete(id);
    }
  }

  /**
   * Update animation states
   */
  update(_deltaTime: number): void {
    // Update any time-based animations here if needed
    // For now, the auto-return timers handle most timing
  }

  /**
   * Remove entity from animation state tracking
   */
  removeEntity(id: string): void {
    this.clearAutoReturnTimer(id);
    this.entityStates.delete(id);
    console.log(`🗑️ Removed animation state for entity: ${id}`);
  }

  /**
   * Destroy all resources
   */
  destroy(): void {
    // Clear all timers
    for (const timer of this.autoReturnTimers.values()) {
      clearTimeout(timer);
    }
    this.autoReturnTimers.clear();
    
    // Clear all states
    this.entityStates.clear();
    
    console.log('🗑️ AnimationStateManager destroyed');
  }
}
