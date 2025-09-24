import * as PIXI from 'pixi.js';

export interface AnimationState {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  animationSpeed: number;
  loop: boolean;
}

export class SpriteAnimationController {
  private sprites = new Map<string, PIXI.AnimatedSprite>();
  private animationStates = new Map<string, AnimationState>();
  private ticker: PIXI.Ticker;

  constructor() {
    this.ticker = PIXI.Ticker.shared;
    this.ticker.add(this.updateAnimations.bind(this));
  }

  /**
   * Create a new animated sprite with the given frames
   */
  createSprite(id: string, frames: PIXI.Texture[], config?: {
    animationSpeed?: number;
    loop?: boolean;
    anchor?: { x: number; y: number };
    position?: { x: number; y: number };
    scale?: { x: number; y: number };
  }): PIXI.AnimatedSprite {
    if (this.sprites.has(id)) {
      this.destroySprite(id);
    }

    const animatedSprite = new PIXI.AnimatedSprite(frames);
    
    // Apply configuration
    if (config?.animationSpeed !== undefined) {
      animatedSprite.animationSpeed = config.animationSpeed;
    }
    
    if (config?.loop !== undefined) {
      animatedSprite.loop = config.loop;
    }
    
    if (config?.anchor) {
      animatedSprite.anchor.set(config.anchor.x, config.anchor.y);
    }
    
    if (config?.position) {
      animatedSprite.position.set(config.position.x, config.position.y);
    }
    
    if (config?.scale) {
      animatedSprite.scale.set(config.scale.x, config.scale.y);
    }

    // Store the sprite and its state
    this.sprites.set(id, animatedSprite);
    this.animationStates.set(id, {
      isPlaying: false,
      currentFrame: 0,
      totalFrames: frames.length,
      animationSpeed: config?.animationSpeed || 0.1,
      loop: config?.loop !== false
    });

    console.log(`Created animated sprite: ${id} with ${frames.length} frames`);
    return animatedSprite;
  }

  /**
   * Start playing animation for a sprite
   */
  playAnimation(spriteId: string): void {
    const sprite = this.sprites.get(spriteId);
    const state = this.animationStates.get(spriteId);
    
    if (!sprite || !state) {
      console.warn(`Sprite '${spriteId}' not found`);
      return;
    }

    sprite.play();
    state.isPlaying = true;
    console.log(`Playing animation: ${spriteId}`);
  }

  /**
   * Stop playing animation for a sprite
   */
  stopAnimation(spriteId: string): void {
    const sprite = this.sprites.get(spriteId);
    const state = this.animationStates.get(spriteId);
    
    if (!sprite || !state) {
      console.warn(`Sprite '${spriteId}' not found`);
      return;
    }

    sprite.stop();
    state.isPlaying = false;
    console.log(`Stopped animation: ${spriteId}`);
  }

  /**
   * Pause animation (keeps current frame)
   */
  pauseAnimation(spriteId: string): void {
    const sprite = this.sprites.get(spriteId);
    const state = this.animationStates.get(spriteId);
    
    if (!sprite || !state) {
      console.warn(`Sprite '${spriteId}' not found`);
      return;
    }

    sprite.stop();
    state.isPlaying = false;
    console.log(`Paused animation: ${spriteId}`);
  }

  /**
   * Set animation speed for a sprite
   */
  setAnimationSpeed(spriteId: string, speed: number): void {
    const sprite = this.sprites.get(spriteId);
    const state = this.animationStates.get(spriteId);
    
    if (!sprite || !state) {
      console.warn(`Sprite '${spriteId}' not found`);
      return;
    }

    sprite.animationSpeed = speed;
    state.animationSpeed = speed;
    console.log(`Set animation speed for '${spriteId}': ${speed}`);
  }

  /**
   * Set loop mode for a sprite
   */
  setLoop(spriteId: string, loop: boolean): void {
    const sprite = this.sprites.get(spriteId);
    const state = this.animationStates.get(spriteId);
    
    if (!sprite || !state) {
      console.warn(`Sprite '${spriteId}' not found`);
      return;
    }

    sprite.loop = loop;
    state.loop = loop;
    console.log(`Set loop for '${spriteId}': ${loop}`);
  }

  /**
   * Go to a specific frame
   */
  gotoFrame(spriteId: string, frame: number): void {
    const sprite = this.sprites.get(spriteId);
    const state = this.animationStates.get(spriteId);
    
    if (!sprite || !state) {
      console.warn(`Sprite '${spriteId}' not found`);
      return;
    }

    if (frame >= 0 && frame < state.totalFrames) {
      sprite.gotoAndStop(frame);
      state.currentFrame = frame;
      console.log(`Goto frame ${frame} for '${spriteId}'`);
    }
  }

  /**
   * Get animation state for a sprite
   */
  getAnimationState(spriteId: string): AnimationState | undefined {
    return this.animationStates.get(spriteId);
  }

  /**
   * Get the animated sprite object
   */
  getSprite(spriteId: string): PIXI.AnimatedSprite | undefined {
    return this.sprites.get(spriteId);
  }

  /**
   * Check if a sprite exists
   */
  hasSprite(spriteId: string): boolean {
    return this.sprites.has(spriteId);
  }

  /**
   * Get all sprite IDs
   */
  getSpriteIds(): string[] {
    return Array.from(this.sprites.keys());
  }

  /**
   * Destroy a sprite and remove it from tracking
   */
  destroySprite(spriteId: string): void {
    const sprite = this.sprites.get(spriteId);
    
    if (sprite) {
      sprite.destroy();
      this.sprites.delete(spriteId);
      this.animationStates.delete(spriteId);
      console.log(`Destroyed sprite: ${spriteId}`);
    }
  }

  /**
   * Destroy all sprites
   */
  destroyAll(): void {
    for (const sprite of this.sprites.values()) {
      sprite.destroy();
    }
    
    this.sprites.clear();
    this.animationStates.clear();
    
    console.log('Destroyed all animated sprites');
  }

  /**
   * Update animation states (called by ticker)
   */
  private updateAnimations(): void {
    for (const [id, sprite] of this.sprites) {
      const state = this.animationStates.get(id);
      if (state) {
        state.currentFrame = sprite.currentFrame;
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.ticker.remove(this.updateAnimations.bind(this));
    this.destroyAll();
  }
}
