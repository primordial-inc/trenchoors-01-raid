import type { GridPosition } from './GridTypes';

export interface MechanicWarning {
  id: string;
  type: 'meteor_strike' | 'lava_wave';
  positions: GridPosition[];
  startTime: number;
  warningDuration: number;
  isActive: boolean;
  column?: number; // For lava wave (vertical)
  row?: number;   // For lava wave (horizontal)
}

export interface MeteorStrikeData {
  impactZones: GridPosition[];
  warningDuration: number;
}

export interface LavaWaveData {
  column?: number;
  row?: number;
  warningDuration: number;
}

export interface MechanicEffect {
  id: string;
  type: 'meteor_explosion' | 'lava_flow';
  position: GridPosition;
  duration: number;
  startTime: number;
}

export interface BossMechanicEvent {
  type: 'meteor_strike' | 'lava_wave';
  data: MeteorStrikeData | LavaWaveData;
  timestamp: number;
}

export interface MechanicActivationEvent {
  type: 'meteor_strike' | 'lava_wave';
  impactZones?: GridPosition[];
  column?: number;
  row?: number;
  timestamp: number;
}
