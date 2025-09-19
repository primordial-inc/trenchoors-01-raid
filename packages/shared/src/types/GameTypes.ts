// Core game types and interfaces

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  color: string;
  frameIndex: number;
  damage: number;
  deaths: number;
  isAlive: boolean;
  joinedAt: Date;
  lastCommandAt?: Date;
}

export interface Boss {
  id: string;
  name: string;
  position: Position;
  maxHealth: number;
  currentHealth: number;
  phase: number;
  isAlive: boolean;
  lastAttackAt?: Date;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  players: Map<string, Player>;
  boss: Boss | null;
  gridWidth: number;
  gridHeight: number;
  tickRate: number;
  createdAt: Date;
  lastTickAt: Date | undefined;
  heroismBoost: HeroismBoost | null;
}

export interface HeroismBoost {
  isActive: boolean;
  multiplier: number;
  duration: number; // milliseconds
  startTime: Date;
  endTime: Date;
  participants: string[]; // player IDs who contributed
}

export interface Command {
  id: string;
  type: 'join' | 'move' | 'attack' | 'heroism' | 'respawn';
  playerId?: string;
  data: any;
  timestamp: Date;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface GameEvent {
  id: string;
  type: 'player_joined' | 'player_moved' | 'player_attacked' | 'boss_damaged' | 'player_died' | 'boss_died' | 'game_started' | 'game_ended';
  playerId?: string;
  data: any;
  timestamp: Date;
}

// Grid constants
export const GRID_WIDTH = 16;
export const GRID_HEIGHT = 12;

// Game configuration
export interface GameConfig {
  tickRate: number;
  maxPlayers: number;
  bossHealth: number;
  playerSpawnDelay: number;
  commandCooldown: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  tickRate: 500, // 500ms = 0.5 seconds
  maxPlayers: 50,
  bossHealth: 10000,
  playerSpawnDelay: 1000,
  commandCooldown: 200
};
