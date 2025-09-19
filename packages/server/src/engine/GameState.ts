import { GameState as GameStateType, Player, Boss, Position, GRID_WIDTH, GRID_HEIGHT, GameConfig, DEFAULT_GAME_CONFIG } from '@pumpfun-game/shared';
import { v4 as uuidv4 } from 'uuid';

export class GameStateManager {
  private state: GameStateType;
  private config: GameConfig;

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config;
    this.state = {
      id: uuidv4(),
      status: 'waiting',
      players: new Map(),
      boss: null,
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tickRate: config.tickRate,
      createdAt: new Date(),
      lastTickAt: undefined,
      heroismBoost: null
    };
  }

  // Getters
  getState(): GameStateType {
    return this.state;
  }

  getPlayers(): Player[] {
    return Array.from(this.state.players.values());
  }

  getPlayer(playerId: string): Player | undefined {
    return this.state.players.get(playerId);
  }

  getBoss(): Boss | null {
    return this.state.boss;
  }

  getStatus(): string {
    return this.state.status;
  }

  // Player management
  addPlayer(player: Player): boolean {
    if (this.state.players.size >= this.config.maxPlayers) {
      return false;
    }

    if (this.state.players.has(player.id)) {
      return false;
    }

    this.state.players.set(player.id, player);
    return true;
  }

  removePlayer(playerId: string): boolean {
    return this.state.players.delete(playerId);
  }

  updatePlayerPosition(playerId: string, position: Position): boolean {
    const player = this.state.players.get(playerId);
    if (!player) return false;

    // Validate position is within grid bounds
    if (position.x < 0 || position.x >= this.state.gridWidth || 
        position.y < 0 || position.y >= this.state.gridHeight) {
      return false;
    }

    player.position = position;
    player.lastCommandAt = new Date();
    return true;
  }

  updatePlayerDamage(playerId: string, damage: number): boolean {
    const player = this.state.players.get(playerId);
    if (!player) return false;

    player.damage += damage;
    return true;
  }

  killPlayer(playerId: string): boolean {
    const player = this.state.players.get(playerId);
    if (!player) return false;

    player.isAlive = false;
    player.deaths += 1;
    return true;
  }

  respawnPlayer(playerId: string): boolean {
    const player = this.state.players.get(playerId);
    if (!player) return false;

    // Respawn at random edge position
    const edge = Math.floor(Math.random() * 4);
    let position: Position;

    switch (edge) {
      case 0: // Top edge
        position = { x: Math.floor(Math.random() * this.state.gridWidth), y: 0 };
        break;
      case 1: // Right edge
        position = { x: this.state.gridWidth - 1, y: Math.floor(Math.random() * this.state.gridHeight) };
        break;
      case 2: // Bottom edge
        position = { x: Math.floor(Math.random() * this.state.gridWidth), y: this.state.gridHeight - 1 };
        break;
      case 3: // Left edge
        position = { x: 0, y: Math.floor(Math.random() * this.state.gridHeight) };
        break;
      default:
        position = { x: 0, y: 0 };
    }

    player.position = position;
    player.isAlive = true;
    return true;
  }

  // Boss management
  spawnBoss(): Boss {
    const boss: Boss = {
      id: uuidv4(),
      name: 'Dragon Boss',
      position: { x: Math.floor(this.state.gridWidth / 2), y: Math.floor(this.state.gridHeight / 2) },
      maxHealth: this.config.bossHealth,
      currentHealth: this.config.bossHealth,
      phase: 1,
      isAlive: true,
      lastAttackAt: new Date()
    };

    this.state.boss = boss;
    return boss;
  }

  damageBoss(damage: number): boolean {
    if (!this.state.boss || !this.state.boss.isAlive) return false;

    this.state.boss.currentHealth = Math.max(0, this.state.boss.currentHealth - damage);
    
    // Update boss phase based on health percentage
    const healthPercentage = this.state.boss.currentHealth / this.state.boss.maxHealth;
    if (healthPercentage > 0.6) {
      this.state.boss.phase = 1;
    } else if (healthPercentage > 0.3) {
      this.state.boss.phase = 2;
    } else {
      this.state.boss.phase = 3;
    }

    if (this.state.boss.currentHealth <= 0) {
      this.state.boss.isAlive = false;
    }

    return true;
  }

  // Game state management
  startGame(): boolean {
    if (this.state.status !== 'waiting') return false;
    
    this.state.status = 'active';
    this.state.lastTickAt = new Date();
    
    // Spawn boss if not already spawned
    if (!this.state.boss) {
      this.spawnBoss();
    }
    
    return true;
  }

  pauseGame(): boolean {
    if (this.state.status !== 'active') return false;
    
    this.state.status = 'paused';
    return true;
  }

  resumeGame(): boolean {
    if (this.state.status !== 'paused') return false;
    
    this.state.status = 'active';
    this.state.lastTickAt = new Date();
    return true;
  }

  endGame(): boolean {
    this.state.status = 'finished';
    return true;
  }

  resetGame(): void {
    this.state.players.clear();
    this.state.boss = null;
    this.state.status = 'waiting';
    this.state.lastTickAt = undefined;
  }

  // Utility methods
  getAlivePlayers(): Player[] {
    return this.getPlayers().filter(player => player.isAlive);
  }

  getPlayerCount(): number {
    return this.state.players.size;
  }

  getAlivePlayerCount(): number {
    return this.getAlivePlayers().length;
  }

  isPositionOccupied(position: Position, excludePlayerId?: string): boolean {
    for (const player of this.state.players.values()) {
      if (excludePlayerId && player.id === excludePlayerId) continue;
      if (player.position.x === position.x && player.position.y === position.y) {
        return true;
      }
    }
    return false;
  }

  getRandomEmptyPosition(): Position | null {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * this.state.gridWidth);
      const y = Math.floor(Math.random() * this.state.gridHeight);
      const position = { x, y };

      if (!this.isPositionOccupied(position)) {
        return position;
      }

      attempts++;
    }

    return null;
  }

  // Heroism boost methods
  activateHeroismBoost(participants: string[]): boolean {
    if (this.state.heroismBoost?.isActive) {
      return false; // Already active
    }

    this.state.heroismBoost = {
      isActive: true,
      multiplier: 5, // 5x damage multiplier
      duration: 30000, // 30 seconds
      startTime: new Date(),
      endTime: new Date(Date.now() + 30000),
      participants
    };

    return true;
  }

  deactivateHeroismBoost(): void {
    if (this.state.heroismBoost) {
      this.state.heroismBoost.isActive = false;
    }
  }

  isHeroismBoostActive(): boolean {
    if (!this.state.heroismBoost) return false;
    
    const now = new Date();
    if (now >= this.state.heroismBoost.endTime) {
      this.deactivateHeroismBoost();
      return false;
    }

    return this.state.heroismBoost.isActive;
  }

  getHeroismMultiplier(): number {
    return this.isHeroismBoostActive() ? (this.state.heroismBoost?.multiplier || 1) : 1;
  }

  // Serialization for client
  serialize(mechanicsData?: any): any {
    return {
      id: this.state.id,
      status: this.state.status,
      players: Array.from(this.state.players.values()),
      boss: this.state.boss,
      gridWidth: this.state.gridWidth,
      gridHeight: this.state.gridHeight,
      tickRate: this.state.tickRate,
      createdAt: this.state.createdAt,
      lastTickAt: this.state.lastTickAt,
      heroismBoost: this.state.heroismBoost,
      mechanics: mechanicsData || null
    };
  }
}
