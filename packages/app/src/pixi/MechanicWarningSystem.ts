import * as PIXI from 'pixi.js';
import type { GridPosition } from '../types/GridTypes';
import type { MechanicWarning } from '../types/MechanicTypes';
import { MECHANIC_VISUALS, MECHANIC_TIMING, MECHANIC_ANIMATIONS } from '../config/MechanicConfig';

export class MechanicWarningSystem {
  private warnings = new Map<string, MechanicWarning>();
  private warningSprites = new Map<string, PIXI.Graphics[]>();
  private countdownTexts = new Map<string, PIXI.Text>();
  private warningLayer: PIXI.Container;
  private countdownLayer: PIXI.Container;
  private cellSize: number;
  private labelArea: { top: number; bottom: number; left: number; right: number };
  private updateInterval: number | null = null;

  constructor(
    warningLayer: PIXI.Container,
    countdownLayer: PIXI.Container,
    cellSize: number,
    labelArea: { top: number; bottom: number; left: number; right: number }
  ) {
    this.warningLayer = warningLayer;
    this.countdownLayer = countdownLayer;
    this.cellSize = cellSize;
    this.labelArea = labelArea;
    this.startUpdateLoop();
  }

  /**
   * Add meteor strike warning
   */
  addMeteorWarning(positions: GridPosition[], duration: number): string {
    const warningId = `meteor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const warning: MechanicWarning = {
      id: warningId,
      type: 'meteor_strike',
      positions,
      startTime: Date.now(),
      warningDuration: duration,
      isActive: true
    };

    this.warnings.set(warningId, warning);
    this.createMeteorWarningVisuals(warningId, positions);
    
    console.log(`⚡ Added meteor warning: ${warningId} for ${positions.length} positions`);
    return warningId;
  }

  /**
   * Add lava wave warning (column)
   */
  addLavaWaveWarning(column: number, duration: number): string {
    const warningId = `lava_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate positions for entire column
    const positions: GridPosition[] = [];
    for (let y = 0; y < 12; y++) {
      positions.push({ x: column, y });
    }

    const warning: MechanicWarning = {
      id: warningId,
      type: 'lava_wave',
      positions,
      startTime: Date.now(),
      warningDuration: duration,
      isActive: true,
      column
    };

    this.warnings.set(warningId, warning);
    this.createLavaWaveWarningVisuals(warningId, positions, 'vertical');
    
    console.log(`🌊 Added lava wave warning: ${warningId} for column ${column}`);
    return warningId;
  }

  /**
   * Add lava wave warning (row)
   */
  addLavaWaveWarningRow(row: number, duration: number): string {
    const warningId = `lava_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate positions for entire row
    const positions: GridPosition[] = [];
    for (let x = 0; x < 16; x++) {
      positions.push({ x, y: row });
    }

    const warning: MechanicWarning = {
      id: warningId,
      type: 'lava_wave',
      positions,
      startTime: Date.now(),
      warningDuration: duration,
      isActive: true,
      row
    };

    this.warnings.set(warningId, warning);
    this.createLavaWaveWarningVisuals(warningId, positions, 'horizontal');
    
    console.log(`🌊 Added lava wave warning: ${warningId} for row ${row}`);
    return warningId;
  }

  /**
   * Remove warning
   */
  removeWarning(warningId: string): void {
    const warning = this.warnings.get(warningId);
    if (!warning) return;

    // Remove visual elements
    const sprites = this.warningSprites.get(warningId);
    if (sprites) {
      sprites.forEach(sprite => {
        if (sprite.parent) {
          sprite.parent.removeChild(sprite);
        }
      });
      this.warningSprites.delete(warningId);
    }

    const countdownText = this.countdownTexts.get(warningId);
    if (countdownText) {
      if (countdownText.parent) {
        countdownText.parent.removeChild(countdownText);
      }
      this.countdownTexts.delete(warningId);
    }

    // Remove from warnings map
    this.warnings.delete(warningId);
    
    console.log(`🗑️ Removed warning: ${warningId}`);
  }

  /**
   * Create meteor warning visuals
   */
  private createMeteorWarningVisuals(warningId: string, positions: GridPosition[]): void {
    const sprites: PIXI.Graphics[] = [];
    
    positions.forEach(position => {
      const sprite = this.createWarningIndicator('meteor', position);
      sprites.push(sprite);
      this.warningLayer.addChild(sprite);
    });

    this.warningSprites.set(warningId, sprites);

    // Create countdown text
    this.createCountdownTimer(warningId, positions[0]); // Use first position for countdown
  }

  /**
   * Create lava wave warning visuals
   */
  private createLavaWaveWarningVisuals(warningId: string, positions: GridPosition[], direction: 'horizontal' | 'vertical'): void {
    const sprites: PIXI.Graphics[] = [];
    
    positions.forEach(position => {
      const sprite = this.createWarningIndicator('lava', position);
      sprites.push(sprite);
      this.warningLayer.addChild(sprite);
    });

    this.warningSprites.set(warningId, sprites);

    // Create countdown text (use center position)
    const centerPosition = this.getCenterPosition(positions, direction);
    this.createCountdownTimer(warningId, centerPosition);
  }

  /**
   * Create warning indicator for a single position
   */
  private createWarningIndicator(type: 'meteor' | 'lava', position: GridPosition): PIXI.Graphics {
    const config = type === 'meteor' ? MECHANIC_VISUALS.METEOR_STRIKE : MECHANIC_VISUALS.LAVA_WAVE;
    
    const sprite = new PIXI.Graphics();
    
    // Convert grid position to screen coordinates
    const screenPos = this.gridToScreen(position);
    
    // Draw warning rectangle
    sprite.fill({ color: config.WARNING_COLOR, alpha: config.WARNING_ALPHA });
    sprite.stroke({ color: config.WARNING_BORDER_COLOR, width: config.WARNING_BORDER_WIDTH });
    
    if (type === 'meteor') {
      // 2x2 area for meteor
      sprite.rect(
        screenPos.x - this.cellSize,
        screenPos.y - this.cellSize,
        this.cellSize * 2,
        this.cellSize * 2
      );
    } else {
      // Single cell for lava
      sprite.rect(
        screenPos.x - this.cellSize / 2,
        screenPos.y - this.cellSize / 2,
        this.cellSize,
        this.cellSize
      );
    }
    
    sprite.fill();
    sprite.stroke();
    
    return sprite;
  }

  /**
   * Create countdown timer
   */
  private createCountdownTimer(warningId: string, position: GridPosition): void {
    const screenPos = this.gridToScreen(position);
    const offset = MECHANIC_VISUALS.COUNTDOWN.POSITION_OFFSET;
    
    const countdownText = new PIXI.Text({
      text: '0.0s',
      style: {
        fontSize: MECHANIC_VISUALS.COUNTDOWN.FONT_SIZE,
        fill: MECHANIC_VISUALS.COUNTDOWN.COLOR,
        stroke: {
          color: MECHANIC_VISUALS.COUNTDOWN.STROKE_COLOR,
          width: MECHANIC_VISUALS.COUNTDOWN.STROKE_WIDTH
        },
        align: 'center'
      }
    });
    
    countdownText.anchor.set(0.5, 0.5);
    countdownText.x = screenPos.x + offset.x;
    countdownText.y = screenPos.y + offset.y;
    
    this.countdownLayer.addChild(countdownText);
    this.countdownTexts.set(warningId, countdownText);
  }

  /**
   * Update countdown timers and warning animations
   */
  private updateCountdowns(): void {
    const currentTime = Date.now();
    
    for (const [warningId, warning] of this.warnings) {
      if (!warning.isActive) continue;
      
      const elapsed = currentTime - warning.startTime;
      const remaining = Math.max(0, warning.warningDuration - elapsed);
      const remainingSeconds = (remaining / 1000).toFixed(1);
      
      // Update countdown text
      const countdownText = this.countdownTexts.get(warningId);
      if (countdownText) {
        countdownText.text = `${remainingSeconds}s`;
        
        // Change color based on urgency
        const urgency = remaining / warning.warningDuration;
        if (urgency <= MECHANIC_TIMING.WARNING_PHASES.CRITICAL) {
          countdownText.style.fill = 0xFF0000; // Red for critical
        } else if (urgency <= MECHANIC_TIMING.WARNING_PHASES.URGENT) {
          countdownText.style.fill = 0xFF8800; // Orange for urgent
        } else {
          countdownText.style.fill = MECHANIC_VISUALS.COUNTDOWN.COLOR; // White for normal
        }
      }
      
      // Update warning sprite animations
      const sprites = this.warningSprites.get(warningId);
      if (sprites) {
        const urgency = remaining / warning.warningDuration;
        const pulseSpeed = this.getPulseSpeed(urgency);
        
        sprites.forEach(sprite => {
          // Pulsing animation
          const pulsePhase = (currentTime * pulseSpeed) % (Math.PI * 2);
          const alpha = MECHANIC_ANIMATIONS.PULSE.MIN_ALPHA + 
            (MECHANIC_ANIMATIONS.PULSE.MAX_ALPHA - MECHANIC_ANIMATIONS.PULSE.MIN_ALPHA) * 
            (Math.sin(pulsePhase) * 0.5 + 0.5);
          
          sprite.alpha = alpha;
        });
      }
      
      // Auto-remove expired warnings
      if (remaining <= 0) {
        this.removeWarning(warningId);
      }
    }
  }

  /**
   * Get pulse speed based on urgency
   */
  private getPulseSpeed(urgency: number): number {
    if (urgency <= MECHANIC_TIMING.WARNING_PHASES.CRITICAL) {
      return MECHANIC_ANIMATIONS.PULSE.SPEED_FAST;
    } else if (urgency <= MECHANIC_TIMING.WARNING_PHASES.URGENT) {
      return MECHANIC_ANIMATIONS.PULSE.SPEED_MEDIUM;
    } else {
      return MECHANIC_ANIMATIONS.PULSE.SPEED_SLOW;
    }
  }

  /**
   * Get center position for countdown display
   */
  private getCenterPosition(positions: GridPosition[], direction: 'horizontal' | 'vertical'): GridPosition {
    if (positions.length === 0) return { x: 0, y: 0 };
    
    if (direction === 'horizontal') {
      // Use middle of row
      const middleIndex = Math.floor(positions.length / 2);
      return positions[middleIndex];
    } else {
      // Use middle of column
      const middleIndex = Math.floor(positions.length / 2);
      return positions[middleIndex];
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
   * Start update loop
   */
  private startUpdateLoop(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateCountdowns();
    }, MECHANIC_TIMING.ANIMATION_DURATIONS.COUNTDOWN_UPDATE);
  }

  /**
   * Stop update loop
   */
  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Clear all warnings
   */
  clearAllWarnings(): void {
    for (const warningId of this.warnings.keys()) {
      this.removeWarning(warningId);
    }
  }

  /**
   * Get active warning count
   */
  getActiveWarningCount(): number {
    return this.warnings.size;
  }

  /**
   * Check if warning exists
   */
  hasWarning(warningId: string): boolean {
    return this.warnings.has(warningId);
  }

  /**
   * Destroy the warning system
   */
  destroy(): void {
    this.stopUpdateLoop();
    this.clearAllWarnings();
    console.log('🧹 MechanicWarningSystem destroyed');
  }
}
