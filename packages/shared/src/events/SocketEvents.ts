// Socket.io event definitions

export interface ServerToClientEvents {
  // Game state events
  gameStateUpdate: (state: any) => void;
  playerJoined: (player: any) => void;
  playerLeft: (playerId: string) => void;
  playerMoved: (playerId: string, position: any) => void;
  playerAttacked: (playerId: string, target: any) => void;
  playerDied: (playerId: string) => void;
  
  // Boss events
  bossSpawned: (boss: any) => void;
  bossDamaged: (damage: number, newHealth: number) => void;
  bossDied: () => void;
  bossMechanic: (mechanic: any) => void;
  
  // Game events
  gameStarted: () => void;
  gamePaused: () => void;
  gameResumed: () => void;
  gameEnded: (result: any) => void;
  
  // Admin events
  adminMessage: (message: string) => void;
  
  // Legacy events (for compatibility)
  existingTiles: (knights: any[]) => void;
  knightSpawned: (knight: any) => void;
}

export interface ClientToServerEvents {
  // Player commands
  joinGame: (playerName: string) => void;
  move: (direction: 'up' | 'down' | 'left' | 'right') => void;
  attack: () => void;
  respawn: () => void;
  
  // Chat commands
  heroism: () => void;
  
  // Legacy events (for compatibility)
  buttonClick: () => void;
}

export interface InterServerEvents {
  // Server-to-server events (if needed for scaling)
  gameStateSync: (gameId: string, state: any) => void;
}

export interface SocketData {
  playerId?: string;
  isAdmin?: boolean;
  lastCommandAt?: Date;
}
