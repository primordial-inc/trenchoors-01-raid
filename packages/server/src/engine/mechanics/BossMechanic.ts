import { Position, GRID_WIDTH, GRID_HEIGHT } from '@pumpfun-game/shared';

export interface BossMechanic {
  id: string;
  type: string;
  name: string;
  description: string;
  warningTimeMs: number; // milliseconds before mechanic activates
  duration: number; // how long the mechanic lasts
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  warningStartTime?: Date;
  data: any; // mechanic-specific data
}

export interface MechanicResult {
  success: boolean;
  message?: string;
  affectedPositions?: Position[];
  damage?: number;
}

export abstract class BaseBossMechanic {
  protected mechanic: BossMechanic;

  constructor(type: string, name: string, description: string, warningTimeMs: number, duration: number) {
    this.mechanic = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name,
      description,
      warningTimeMs,
      duration,
      isActive: false,
      data: {}
    };
  }

  // Abstract methods that each mechanic must implement
  abstract activate(): MechanicResult;
  abstract checkPlayerPosition(playerPos: Position): boolean; // true if player is safe
  abstract getAffectedPositions(): Position[];
  abstract getWarningMessage(): string;

  // Common methods
  public getId(): string {
    return this.mechanic.id;
  }

  public getType(): string {
    return this.mechanic.type;
  }

  public getName(): string {
    return this.mechanic.name;
  }

  public getDescription(): string {
    return this.mechanic.description;
  }

  public isMechanicActive(): boolean {
    return this.mechanic.isActive;
  }

  public start(): void {
    this.mechanic.isActive = true;
    this.mechanic.warningStartTime = new Date();
    this.mechanic.startTime = new Date(Date.now() + this.mechanic.warningTimeMs);
    this.mechanic.endTime = new Date(Date.now() + this.mechanic.warningTimeMs + this.mechanic.duration * 1000);
  }

  public end(): void {
    this.mechanic.isActive = false;
    this.mechanic.endTime = new Date();
  }

  public isWarningActive(): boolean {
    if (!this.mechanic.warningStartTime || !this.mechanic.startTime) return false;
    const now = new Date();
    return now >= this.mechanic.warningStartTime && now < this.mechanic.startTime;
  }

  public isMechanicExecuting(): boolean {
    if (!this.mechanic.startTime || !this.mechanic.endTime) return false;
    const now = new Date();
    return now >= this.mechanic.startTime && now < this.mechanic.endTime;
  }

  public getTimeRemaining(): number {
    if (!this.mechanic.endTime) return 0;
    const now = new Date();
    return Math.max(0, this.mechanic.endTime.getTime() - now.getTime());
  }

  public getWarningTimeRemaining(): number {
    if (!this.mechanic.startTime) return 0;
    const now = new Date();
    return Math.max(0, this.mechanic.startTime.getTime() - now.getTime());
  }

  public serialize(): BossMechanic {
    return { ...this.mechanic };
  }
}
