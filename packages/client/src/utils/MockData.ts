import type { GameState, Player, Boss, HeroismBoost } from '@pumpfun-game/shared';

// Mock game state for development when server is unavailable
export const createMockGameState = (): GameState => {
  const players = new Map<string, Player>();
  
  // Add some mock players
  players.set('player1', {
    id: 'player1',
    name: 'Alice',
    position: { x: 2, y: 3 },
    color: 'blue',
    frameIndex: 0,
    damage: 150,
    deaths: 1,
    isAlive: true,
    joinedAt: new Date(Date.now() - 30000),
    lastCommandAt: new Date(Date.now() - 5000)
  });
  
  players.set('player2', {
    id: 'player2',
    name: 'Bob',
    position: { x: 14, y: 8 },
    color: 'red',
    frameIndex: 0,
    damage: 200,
    deaths: 0,
    isAlive: true,
    joinedAt: new Date(Date.now() - 25000),
    lastCommandAt: new Date(Date.now() - 2000)
  });
  
  players.set('player3', {
    id: 'player3',
    name: 'Charlie',
    position: { x: 8, y: 1 },
    color: 'yellow',
    frameIndex: 0,
    damage: 75,
    deaths: 2,
    isAlive: false,
    joinedAt: new Date(Date.now() - 40000),
    lastCommandAt: new Date(Date.now() - 10000)
  });
  
  players.set('player4', {
    id: 'player4',
    name: 'Diana',
    position: { x: 1, y: 10 },
    color: 'black',
    frameIndex: 0,
    damage: 300,
    deaths: 0,
    isAlive: true,
    joinedAt: new Date(Date.now() - 20000),
    lastCommandAt: new Date(Date.now() - 1000)
  });

  const boss: Boss = {
    id: 'boss1',
    name: 'Dark Lord',
    position: { x: 8, y: 6 }, // Center of 16x12 grid
    maxHealth: 10000,
    currentHealth: 6750, // Phase 2 (60-30% HP)
    phase: 2,
    isAlive: true,
    lastAttackAt: new Date(Date.now() - 3000)
  };

  const heroismBoost: HeroismBoost = {
    isActive: false,
    multiplier: 5,
    duration: 30000, // 30 seconds
    startTime: new Date(Date.now() - 10000),
    endTime: new Date(Date.now() + 20000),
    participants: ['player1', 'player2', 'player4']
  };

  return {
    id: 'mock-game-1',
    status: 'active',
    players,
    boss,
    gridWidth: 16,
    gridHeight: 12,
    tickRate: 500,
    createdAt: new Date(Date.now() - 60000),
    lastTickAt: new Date(Date.now() - 500),
    heroismBoost
  };
};

// Mock mechanic data for testing visual effects
export const createMockMechanics = () => ({
  lavaWave: {
    type: 'lava_wave',
    direction: 'horizontal' as 'horizontal' | 'vertical',
    row: 6, // Boss row
    warningTime: 5000,
    duration: 3000,
    isActive: false,
    startTime: new Date(Date.now() + 2000)
  },
  
  meteorStrike: {
    type: 'meteor_strike',
    positions: [
      { x: 3, y: 2 },
      { x: 12, y: 5 },
      { x: 7, y: 9 }
    ],
    warningTime: 4000,
    duration: 2000,
    isActive: false,
    startTime: new Date(Date.now() + 3000)
  },
  
  pillarPhase: {
    type: 'pillar_phase',
    pillars: [
      { x: 0, y: 0 },   // Top-left
      { x: 15, y: 0 },  // Top-right
      { x: 0, y: 11 },  // Bottom-left
      { x: 15, y: 11 }  // Bottom-right
    ],
    warningTime: 6000,
    duration: 8000,
    isActive: false,
    startTime: new Date(Date.now() + 4000)
  }
});

// Mock connection states for testing
export const mockConnectionStates = {
  connected: {
    status: 'connected' as const,
    serverUrl: 'ws://localhost:3000',
    lastConnected: new Date(Date.now() - 10000),
    reconnectAttempts: 0
  },
  
  disconnected: {
    status: 'disconnected' as const,
    serverUrl: 'ws://localhost:3000',
    lastConnected: new Date(Date.now() - 30000),
    reconnectAttempts: 3
  },
  
  error: {
    status: 'error' as const,
    serverUrl: 'ws://localhost:3000',
    lastConnected: new Date(Date.now() - 60000),
    reconnectAttempts: 5,
    error: 'Connection refused'
  }
};

// Helper function to simulate game state updates
export const simulateGameStateUpdate = (currentState: GameState): GameState => {
  const newState = { ...currentState };
  
  // Simulate boss taking damage
  if (newState.boss && newState.boss.isAlive) {
    newState.boss.currentHealth = Math.max(0, newState.boss.currentHealth - 50);
    
    // Update boss phase based on health
    const healthPercent = (newState.boss.currentHealth / newState.boss.maxHealth) * 100;
    if (healthPercent > 60) {
      newState.boss.phase = 1;
    } else if (healthPercent > 30) {
      newState.boss.phase = 2;
    } else {
      newState.boss.phase = 3;
    }
    
    // Check if boss dies
    if (newState.boss.currentHealth <= 0) {
      newState.boss.isAlive = false;
      newState.status = 'finished';
    }
  }
  
  // Simulate player movement
  newState.players.forEach((player, playerId) => {
    if (player.isAlive) {
      // Random small movement
      const moveChance = Math.random();
      if (moveChance < 0.1) { // 10% chance to move
        const newX = Math.max(0, Math.min(15, player.position.x + (Math.random() < 0.5 ? 1 : -1)));
        const newY = Math.max(0, Math.min(11, player.position.y + (Math.random() < 0.5 ? 1 : -1)));
        newState.players.set(playerId, {
          ...player,
          position: { x: newX, y: newY },
          lastCommandAt: new Date()
        });
      }
    }
  });
  
  newState.lastTickAt = new Date();
  return newState;
};

// Mock asset loading states
export const mockAssetLoadingStates = {
  notStarted: {
    isLoading: false,
    progress: 0,
    loadedAssets: 0,
    totalAssets: 0,
    errors: []
  },
  
  loading: {
    isLoading: true,
    progress: 45,
    loadedAssets: 12,
    totalAssets: 27,
    errors: []
  },
  
  completed: {
    isLoading: false,
    progress: 100,
    loadedAssets: 27,
    totalAssets: 27,
    errors: []
  },
  
  withErrors: {
    isLoading: false,
    progress: 85,
    loadedAssets: 23,
    totalAssets: 27,
    errors: [
      'Failed to load: assets/Pack1/Units/Blue Units/Warrior/Warrior_Idle.png',
      'Failed to load: assets/Pack2/Effects/Explosion/Explosions.png'
    ]
  }
};
