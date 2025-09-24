export interface GridPosition {
  x: number; // 0-15 (A-P)
  y: number; // 0-11 (1-12)
}

export interface Player {
  id: string;
  name: string;
  position: GridPosition;
  color: string;
  isAlive: boolean;
  damage: number;
  deaths: number;
}

export interface Boss {
  position: GridPosition;
  currentHealth: number;
  maxHealth: number;
  phase: number;
  isAlive: boolean;
}

export interface GameState {
  status: 'waiting' | 'active' | 'paused' | 'finished';
  players: Player[];
  boss: Boss | null;
  gridWidth: number;
  gridHeight: number;
  tickRate: number;
}

export interface EntityInfo {
  type: 'player' | 'boss';
  id: string;
  name: string;
  position: GridPosition;
  data: Player | Boss;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface ServerEvent {
  type: 'gameStateUpdate' | 'playerJoined' | 'playerMoved' | 'playerDied' | 'bossSpawned' | 'bossDamaged' | 'gameStarted' | 'gameEnded';
  data: any;
}
