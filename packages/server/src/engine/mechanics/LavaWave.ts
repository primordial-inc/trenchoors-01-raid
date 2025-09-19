import { BaseBossMechanic, BossMechanic, MechanicResult } from './BossMechanic';
import { Position, GRID_WIDTH, GRID_HEIGHT } from '@pumpfun-game/shared';

export interface LavaWaveData {
  direction: 'horizontal' | 'vertical';
  rowOrColumn: number;
  speed: number; // squares per second
}

export class LavaWaveMechanic extends BaseBossMechanic {
  private data: LavaWaveData;

  constructor() {
    super('lava_wave', 'Lava Wave', 'A wave of lava sweeps across the battlefield', 5000, 3);
    this.data = {
      direction: 'horizontal',
      rowOrColumn: 0,
      speed: 2
    };
  }

  public activate(): MechanicResult {
    // Randomly choose direction and position
    this.data.direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
    
    if (this.data.direction === 'horizontal') {
      this.data.rowOrColumn = Math.floor(Math.random() * GRID_HEIGHT);
    } else {
      this.data.rowOrColumn = Math.floor(Math.random() * GRID_WIDTH);
    }

    this.mechanic.data = this.data;
    this.start();

    return {
      success: true,
      message: `Lava wave incoming! ${this.data.direction === 'horizontal' ? 'Row' : 'Column'} ${this.data.rowOrColumn + 1} will be affected!`,
      affectedPositions: this.getAffectedPositions()
    };
  }

  public checkPlayerPosition(playerPos: Position): boolean {
    if (!this.isMechanicExecuting()) return true;

    if (this.data.direction === 'horizontal') {
      return playerPos.y !== this.data.rowOrColumn;
    } else {
      return playerPos.x !== this.data.rowOrColumn;
    }
  }

  public getAffectedPositions(): Position[] {
    const positions: Position[] = [];
    
    if (this.data.direction === 'horizontal') {
      for (let x = 0; x < GRID_WIDTH; x++) {
        positions.push({ x, y: this.data.rowOrColumn });
      }
    } else {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        positions.push({ x: this.data.rowOrColumn, y });
      }
    }

    return positions;
  }

  public getWarningMessage(): string {
    const direction = this.data.direction === 'horizontal' ? 'row' : 'column';
    const position = this.data.rowOrColumn + 1;
    return `The boss is charging up... lava wave incoming! ${direction.charAt(0).toUpperCase() + direction.slice(1)} ${position} will be affected!`;
  }

  public getData(): LavaWaveData {
    return { ...this.data };
  }
}
