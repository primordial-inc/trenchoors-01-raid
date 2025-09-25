import * as PIXI from 'pixi.js';
import type { GridPosition } from '../types/GridTypes';
import type { MechanicEffect } from '../types/MechanicTypes';
import { MECHANIC_VISUALS, MECHANIC_TIMING, MECHANIC_ANIMATIONS } from '../config/MechanicConfig';

export class MechanicEffects {
  private effectsLayer: PIXI.Container;
  private effects = new Map<string, MechanicEffect>();
  private effectSprites = new Map<string, PIXI.Container>();
  private cellSize: number;
  private labelArea: { top: number; bottom: number; left: number; right: number };

  constructor(
    effectsLayer: PIXI.Container,
    cellSize: number,
    labelArea: { top: number; bottom: number; left: number; right: number }
  ) {
    this.effectsLayer = effectsLayer;
    this.cellSize = cellSize;
    this.labelArea = labelArea;
  }

  /**
   * Create meteor explosion effect
   */
  async createMeteorExplosion(position: GridPosition): Promise<void> {
    const effectId = `meteor_explosion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const effect: MechanicEffect = {
      id: effectId,
      type: 'meteor_explosion',
      position,
      duration: MECHANIC_TIMING.ANIMATION_DURATIONS.METEOR_IMPACT,
      startTime: Date.now()
    };

    this.effects.set(effectId, effect);
    
    // Create explosion container
    const explosionContainer = new PIXI.Container();
    this.effectsLayer.addChild(explosionContainer);
    this.effectSprites.set(effectId, explosionContainer);
    
    // Create explosion effect
    await this.createExplosionEffect(explosionContainer, position);
    
    // Auto-cleanup after duration
    setTimeout(() => {
      this.clearEffect(effectId);
    }, effect.duration);
    
    console.log(`💥 Created meteor explosion effect: ${effectId}`);
  }

  /**
   * Create lava wave flow effect
   */
  async createLavaWaveFlow(column: number, direction: 'horizontal' | 'vertical'): Promise<void> {
    const effectId = `lava_flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create effect for each position in the wave
    const positions: GridPosition[] = [];
    if (direction === 'vertical') {
      for (let y = 0; y < 12; y++) {
        positions.push({ x: column, y });
      }
    } else {
      for (let x = 0; x < 16; x++) {
        positions.push({ x, y: column });
      }
    }

    // Create flow effect for each position
    for (const position of positions) {
      const positionEffectId = `${effectId}_${position.x}_${position.y}`;
      
      const effect: MechanicEffect = {
        id: positionEffectId,
        type: 'lava_flow',
        position,
        duration: MECHANIC_TIMING.ANIMATION_DURATIONS.LAVA_FLOW,
        startTime: Date.now()
      };

      this.effects.set(positionEffectId, effect);
      
      // Create lava flow container
      const flowContainer = new PIXI.Container();
      this.effectsLayer.addChild(flowContainer);
      this.effectSprites.set(positionEffectId, flowContainer);
      
      // Create lava flow effect
      await this.createLavaFlowEffect(flowContainer, position, direction);
      
      // Auto-cleanup after duration
      setTimeout(() => {
        this.clearEffect(positionEffectId);
      }, effect.duration);
    }
    
    console.log(`🌊 Created lava wave flow effect: ${effectId} for ${positions.length} positions`);
  }

  /**
   * Create explosion effect
   */
  private async createExplosionEffect(container: PIXI.Container, position: GridPosition): Promise<void> {
    const screenPos = this.gridToScreen(position);
    const config = MECHANIC_VISUALS.METEOR_STRIKE;
    
    // Create explosion particles
    const particles: PIXI.Graphics[] = [];
    
    for (let i = 0; i < MECHANIC_ANIMATIONS.EXPLOSION.PARTICLES_COUNT; i++) {
      const particle = new PIXI.Graphics();
      particle.fill({ color: 0xFF4444 });
      particle.circle(0, 0, 3);
      particle.fill();
      
      // Random direction
      const angle = (i / MECHANIC_ANIMATIONS.EXPLOSION.PARTICLES_COUNT) * Math.PI * 2;
      const speed = MECHANIC_ANIMATIONS.EXPLOSION.PARTICLE_SPEED * (0.5 + Math.random() * 0.5);
      
      particle.x = screenPos.x;
      particle.y = screenPos.y;
      
      container.addChild(particle);
      particles.push(particle);
      
      // Animate particle
      this.animateParticle(particle, angle, speed, MECHANIC_ANIMATIONS.EXPLOSION.PARTICLE_LIFETIME);
    }
    
    // Create central explosion
    const centralExplosion = new PIXI.Graphics();
    centralExplosion.fill({ color: 0xFF0000 });
    centralExplosion.circle(screenPos.x, screenPos.y, 5);
    centralExplosion.fill();
    
    container.addChild(centralExplosion);
    
    // Animate central explosion
    this.animateCentralExplosion(centralExplosion, screenPos, config.IMPACT_DURATION);
  }

  /**
   * Create lava flow effect
   */
  private async createLavaFlowEffect(container: PIXI.Container, position: GridPosition, direction: 'horizontal' | 'vertical'): Promise<void> {
    const screenPos = this.gridToScreen(position);
    const config = MECHANIC_VISUALS.LAVA_WAVE;
    
    // Create lava flow graphics
    const lavaFlow = new PIXI.Graphics();
    
    if (direction === 'vertical') {
      // Vertical flow - flowing down
      lavaFlow.fill({ color: config.WARNING_COLOR, alpha: 0.8 });
      lavaFlow.rect(
        screenPos.x - this.cellSize / 2,
        screenPos.y - this.cellSize / 2,
        this.cellSize,
        this.cellSize
      );
    } else {
      // Horizontal flow - flowing right
      lavaFlow.fill({ color: config.WARNING_COLOR, alpha: 0.8 });
      lavaFlow.rect(
        screenPos.x - this.cellSize / 2,
        screenPos.y - this.cellSize / 2,
        this.cellSize,
        this.cellSize
      );
    }
    
    lavaFlow.fill();
    container.addChild(lavaFlow);
    
    // Create wave animation
    this.animateLavaFlow(lavaFlow, screenPos, direction, config.FLOW_DURATION);
  }

  /**
   * Animate particle
   */
  private animateParticle(particle: PIXI.Graphics, angle: number, speed: number, lifetime: number): void {
    const startTime = Date.now();
    const startX = particle.x;
    const startY = particle.y;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / lifetime;
      
      if (progress >= 1) {
        particle.alpha = 0;
        return;
      }
      
      // Move particle
      const distance = speed * elapsed;
      particle.x = startX + Math.cos(angle) * distance;
      particle.y = startY + Math.sin(angle) * distance;
      
      // Fade out
      particle.alpha = 1 - progress;
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Animate central explosion
   */
  private animateCentralExplosion(explosion: PIXI.Graphics, centerPos: { x: number; y: number }, duration: number): void {
    const startTime = Date.now();
    const startRadius = 5;
    const endRadius = this.cellSize * MECHANIC_VISUALS.METEOR_STRIKE.EXPLOSION_SCALE;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        explosion.alpha = 0;
        return;
      }
      
      // Scale explosion
      const currentRadius = startRadius + (endRadius - startRadius) * progress;
      explosion.clear();
      explosion.fill({ color: 0xFF0000, alpha: 1 - progress });
      explosion.circle(centerPos.x, centerPos.y, currentRadius);
      explosion.fill();
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Animate lava flow
   */
  private animateLavaFlow(lavaFlow: PIXI.Graphics, screenPos: { x: number; y: number }, direction: 'horizontal' | 'vertical', duration: number): void {
    const startTime = Date.now();
    const config = MECHANIC_VISUALS.LAVA_WAVE;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        lavaFlow.alpha = 0;
        return;
      }
      
      // Create wave effect
      const wavePhase = progress * Math.PI * MECHANIC_ANIMATIONS.LAVA_FLOW.WAVE_COUNT;
      const waveOffset = Math.sin(wavePhase) * MECHANIC_ANIMATIONS.LAVA_FLOW.WAVE_AMPLITUDE * this.cellSize;
      
      lavaFlow.clear();
      lavaFlow.fill({ color: config.WARNING_COLOR, alpha: 0.8 * (1 - progress) });
      
      if (direction === 'vertical') {
        lavaFlow.rect(
          screenPos.x - this.cellSize / 2 + waveOffset,
          screenPos.y - this.cellSize / 2,
          this.cellSize,
          this.cellSize
        );
      } else {
        lavaFlow.rect(
          screenPos.x - this.cellSize / 2,
          screenPos.y - this.cellSize / 2 + waveOffset,
          this.cellSize,
          this.cellSize
        );
      }
      
      lavaFlow.fill();
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Clear specific effect
   */
  clearEffect(effectId: string): void {
    const effect = this.effects.get(effectId);
    if (!effect) return;

    const sprite = this.effectSprites.get(effectId);
    if (sprite && sprite.parent) {
      sprite.parent.removeChild(sprite);
    }

    this.effects.delete(effectId);
    this.effectSprites.delete(effectId);
    
    console.log(`🗑️ Cleared effect: ${effectId}`);
  }

  /**
   * Clear all effects
   */
  clearAllEffects(): void {
    for (const effectId of this.effects.keys()) {
      this.clearEffect(effectId);
    }
  }

  /**
   * Convert grid position to screen coordinates
   */
  private gridToScreen(position: GridPosition): { x: number; y: number } {
    return {
      x: this.labelArea.left + position.x * this.cellSize + this.cellSize / 2,
      y: this.labelArea.top + position.y * this.cellSize + this.cellSize / 2
    };
  }

  /**
   * Get active effect count
   */
  getActiveEffectCount(): number {
    return this.effects.size;
  }

  /**
   * Check if effect exists
   */
  hasEffect(effectId: string): boolean {
    return this.effects.has(effectId);
  }

  /**
   * Destroy the effects system
   */
  destroy(): void {
    this.clearAllEffects();
    console.log('🧹 MechanicEffects destroyed');
  }
}
