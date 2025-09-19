import { BaseBossMechanic, BossMechanic, MechanicResult } from './BossMechanic';
import { Position, GRID_WIDTH, GRID_HEIGHT } from '@pumpfun-game/shared';

export interface PillarPhaseData {
  pillars: Position[];
  safeRadius: number; // how close to pillar to be safe
  pillarCount: number;
}

export class PillarPhaseMechanic extends BaseBossMechanic {
  private data: PillarPhaseData;

  constructor() {
    super('pillar_phase', 'Pillar Phase', 'Seek shelter behind pillars to survive', 6000, 8);
    this.data = {
      pillars: [],
      safeRadius: 1, // adjacent to pillar
      pillarCount: 4
    };
  }

  public activate(): MechanicResult {
    // Place pillars at grid corners
    this.data.pillars = [
      { x: 0, y: 0 }, // Top-left
      { x: GRID_WIDTH - 1, y: 0 }, // Top-right
      { x: 0, y: GRID_HEIGHT - 1 }, // Bottom-left
      { x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 } // Bottom-right
    ];

    this.mechanic.data = this.data;
    this.start();

    return {
      success: true,
      message: `Pillar phase activated! Seek shelter behind the 4 corner pillars!`,
      affectedPositions: this.getAffectedPositions()
    };
  }

  public checkPlayerPosition(playerPos: Position): boolean {
    if (!this.isMechanicExecuting()) return true;

    // Check if player is adjacent to any pillar
    for (const pillar of this.data.pillars) {
      const distance = Math.max(
        Math.abs(playerPos.x - pillar.x),
        Math.abs(playerPos.y - pillar.y)
      );
      
      if (distance <= this.data.safeRadius) {
        return true; // Player is safe
      }
    }

    return false; // Player is in danger
  }

  public getAffectedPositions(): Position[] {
    const positions: Position[] = [];

    // Add all positions that are NOT safe (not adjacent to pillars)
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const pos = { x, y };
        if (!this.checkPlayerPosition(pos)) {
          positions.push(pos);
        }
      }
    }

    return positions;
  }

  public getWarningMessage(): string {
    return `The ground trembles... seek shelter behind pillars! 4 corner pillars will provide safety!`;
  }

  public getData(): PillarPhaseData {
    return { ...this.data };
  }

  public getPillars(): Position[] {
    return [...this.data.pillars];
  }

  public getSafePositions(): Position[] {
    const safePositions: Position[] = [];

    for (const pillar of this.data.pillars) {
      // Add all positions within safe radius of each pillar
      for (let x = Math.max(0, pillar.x - this.data.safeRadius); 
           x <= Math.min(GRID_WIDTH - 1, pillar.x + this.data.safeRadius); 
           x++) {
        for (let y = Math.max(0, pillar.y - this.data.safeRadius); 
             y <= Math.min(GRID_HEIGHT - 1, pillar.y + this.data.safeRadius); 
             y++) {
          safePositions.push({ x, y });
        }
      }
    }

    return safePositions;
  }
}
