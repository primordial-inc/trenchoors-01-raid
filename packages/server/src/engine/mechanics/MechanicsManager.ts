import { BaseBossMechanic, BossMechanic } from './BossMechanic';
import { LavaWaveMechanic } from './LavaWave';
import { MeteorStrikeMechanic } from './MeteorStrike';
import { Position, Player } from '@pumpfun-game/shared';

export interface MechanicsConfig {
  phase1Interval: number; // milliseconds between mechanics in phase 1
  phase2Interval: number; // milliseconds between mechanics in phase 2
  phase3Interval: number; // milliseconds between mechanics in phase 3
  maxConcurrentMechanics: number;
}

export const DEFAULT_MECHANICS_CONFIG: MechanicsConfig = {
  phase1Interval: 12000, // 12 seconds
  phase2Interval: 8000,  // 8 seconds
  phase3Interval: 5000,  // 5 seconds
  maxConcurrentMechanics: 3
};

export class MechanicsManager {
  private activeMechanics: Map<string, BaseBossMechanic> = new Map();
  private mechanicTypes: BaseBossMechanic[] = [];
  private config: MechanicsConfig;
  private lastMechanicTime: Date = new Date(Date.now() - 20000); // 20 seconds ago to allow immediate triggering
  private bossPhase: number = 1;

  constructor(config: MechanicsConfig = DEFAULT_MECHANICS_CONFIG) {
    this.config = config;
    this.initializeMechanicTypes();
  }

  private initializeMechanicTypes(): void {
    this.mechanicTypes = [
      new LavaWaveMechanic(),
      new MeteorStrikeMechanic()
    ];
  }

  public setBossPhase(phase: number): void {
    this.bossPhase = Math.max(1, Math.min(3, phase));
  }

  public getBossPhase(): number {
    return this.bossPhase;
  }

  public shouldTriggerMechanic(): boolean {
    const now = new Date();
    const timeSinceLastMechanic = now.getTime() - this.lastMechanicTime.getTime();
    
    let interval: number;
    switch (this.bossPhase) {
      case 1: interval = this.config.phase1Interval; break;
      case 2: interval = this.config.phase2Interval; break;
      case 3: interval = this.config.phase3Interval; break;
      default: interval = this.config.phase1Interval;
    }

    const shouldTrigger = timeSinceLastMechanic >= interval && 
           this.activeMechanics.size < this.config.maxConcurrentMechanics;
    
    console.log(`🔍 Mechanic check: timeSince=${timeSinceLastMechanic}ms, interval=${interval}ms, active=${this.activeMechanics.size}, shouldTrigger=${shouldTrigger}`);
    
    return shouldTrigger;
  }

  public triggerRandomMechanic(): BaseBossMechanic | null {
    if (!this.shouldTriggerMechanic()) {
      console.log(`❌ Not triggering mechanic - conditions not met`);
      return null;
    }

    // Filter out mechanics that are already active
    const availableMechanics = this.mechanicTypes.filter(mechanic => 
      !Array.from(this.activeMechanics.values()).some(active => active.getType() === mechanic.getType())
    );

    console.log(`🎯 Available mechanics: ${availableMechanics.length}, Total types: ${this.mechanicTypes.length}`);

    if (availableMechanics.length === 0) return null;

    // Choose random mechanic
    const randomIndex = Math.floor(Math.random() * availableMechanics.length);
    const mechanic = availableMechanics[randomIndex];
    
    if (!mechanic) return null;
    
    // Create new instance to avoid state conflicts
    let newMechanic: BaseBossMechanic | null = null;
    switch (mechanic.getType()) {
      case 'lava_wave':
        newMechanic = new LavaWaveMechanic();
        break;
      case 'meteor_strike':
        newMechanic = new MeteorStrikeMechanic();
        break;
      default:
        return null;
    }

    if (!newMechanic) return null;

    // Activate the mechanic
    const result = newMechanic.activate();
    if (result.success) {
      this.activeMechanics.set(newMechanic.getId(), newMechanic);
      this.lastMechanicTime = new Date();
      return newMechanic;
    }

    return null;
  }

  public updateMechanics(): void {
    const now = new Date();
    const mechanicsToRemove: string[] = [];

    for (const [id, mechanic] of this.activeMechanics) {
      // Check if mechanic should end
      if (mechanic.getTimeRemaining() <= 0) {
        mechanic.end();
        mechanicsToRemove.push(id);
      }
    }

    // Remove ended mechanics
    for (const id of mechanicsToRemove) {
      this.activeMechanics.delete(id);
    }
  }

  public checkPlayerSafety(player: Player): boolean {
    for (const mechanic of this.activeMechanics.values()) {
      if (mechanic.isMechanicExecuting() && !mechanic.checkPlayerPosition(player.position)) {
        return false; // Player is in danger
      }
    }
    return true; // Player is safe
  }

  public getActiveMechanics(): BaseBossMechanic[] {
    return Array.from(this.activeMechanics.values());
  }

  public getWarningMechanics(): BaseBossMechanic[] {
    return Array.from(this.activeMechanics.values()).filter(mechanic => 
      mechanic.isWarningActive()
    );
  }

  public getExecutingMechanics(): BaseBossMechanic[] {
    return Array.from(this.activeMechanics.values()).filter(mechanic => 
      mechanic.isMechanicExecuting()
    );
  }

  public getMechanicById(id: string): BaseBossMechanic | undefined {
    return this.activeMechanics.get(id);
  }

  public clearAllMechanics(): void {
    for (const mechanic of this.activeMechanics.values()) {
      mechanic.end();
    }
    this.activeMechanics.clear();
  }

  public getMechanicCount(): number {
    return this.activeMechanics.size;
  }

  public forceTriggerRandomMechanic(): BaseBossMechanic | null {
    console.log('🚀 Force triggering mechanic - bypassing all checks');
    
    // Filter out mechanics that are already active
    const availableMechanics = this.mechanicTypes.filter(mechanic => 
      !Array.from(this.activeMechanics.values()).some(active => active.getType() === mechanic.getType())
    );

    console.log(`🎯 Force - Available mechanics: ${availableMechanics.length}, Total types: ${this.mechanicTypes.length}`);

    if (availableMechanics.length === 0) {
      console.log('❌ No available mechanics for force trigger');
      return null;
    }

    // Choose random mechanic
    const randomIndex = Math.floor(Math.random() * availableMechanics.length);
    const selectedMechanic = availableMechanics[randomIndex];
    
    if (!selectedMechanic) {
      console.log('❌ No mechanic selected for force trigger');
      return null;
    }
    
    console.log(`🎲 Force selected mechanic: ${selectedMechanic.getType()}`);
    
    // Activate the mechanic (this generates the data)
    const result = selectedMechanic.activate();
    console.log(`🎯 Mechanic activation result:`, result);
    
    // Add to active mechanics
    this.activeMechanics.set(selectedMechanic.getType(), selectedMechanic);
    this.lastMechanicTime = new Date();
    
    console.log(`✅ Force activated mechanic: ${selectedMechanic.getType()}`);
    
    return selectedMechanic;
  }

  public serialize(): any {
    return {
      activeMechanics: Array.from(this.activeMechanics.values()).map(m => m.serialize()),
      bossPhase: this.bossPhase,
      config: this.config,
      lastMechanicTime: this.lastMechanicTime
    };
  }
}
