import { BaseBossMechanic, BossMechanic, MechanicResult } from './BossMechanic';
import { Position, GRID_WIDTH, GRID_HEIGHT } from '@pumpfun-game/shared';

export interface MeteorStrikeData {
  targets: Position[];
  blastRadius: number;
  meteorCount: number;
}

export class MeteorStrikeMechanic extends BaseBossMechanic {
  private data: MeteorStrikeData;

  constructor() {
    super('meteor_strike', 'Meteor Strike', 'Meteors rain down from the sky', 4000, 2);
    this.data = {
      targets: [],
      blastRadius: 2, // 2x2 blast radius
      meteorCount: 3
    };
  }

  public activate(): MechanicResult {
    // Generate random target positions
    this.data.targets = [];
    this.data.meteorCount = Math.floor(Math.random() * 3) + 3; // 3-5 meteors

    for (let i = 0; i < this.data.meteorCount; i++) {
      const target: Position = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT)
      };
      this.data.targets.push(target);
    }

    this.mechanic.data = this.data;
    this.start();

    return {
      success: true,
      message: `Meteor strike incoming! ${this.data.meteorCount} meteors will impact!`,
      affectedPositions: this.getAffectedPositions()
    };
  }

  public checkPlayerPosition(playerPos: Position): boolean {
    if (!this.isMechanicExecuting()) return true;

    // Check if player is within blast radius of any meteor
    for (const target of this.data.targets) {
      const distance = Math.max(
        Math.abs(playerPos.x - target.x),
        Math.abs(playerPos.y - target.y)
      );
      
      if (distance <= this.data.blastRadius) {
        return false; // Player is in danger
      }
    }

    return true; // Player is safe
  }

  public getAffectedPositions(): Position[] {
    const positions: Position[] = [];

    for (const target of this.data.targets) {
      // Add all positions within blast radius
      for (let x = Math.max(0, target.x - this.data.blastRadius); 
           x <= Math.min(GRID_WIDTH - 1, target.x + this.data.blastRadius); 
           x++) {
        for (let y = Math.max(0, target.y - this.data.blastRadius); 
             y <= Math.min(GRID_HEIGHT - 1, target.y + this.data.blastRadius); 
             y++) {
          positions.push({ x, y });
        }
      }
    }

    return positions;
  }

  public getWarningMessage(): string {
    return `Dark clouds gather... meteors will rain from above! ${this.data.meteorCount} impact zones marked!`;
  }

  public getData(): MeteorStrikeData {
    return { ...this.data };
  }

  public getTargets(): Position[] {
    return [...this.data.targets];
  }
}
