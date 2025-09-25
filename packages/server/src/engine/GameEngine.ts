import { GameConfig, DEFAULT_GAME_CONFIG } from '@pumpfun-game/shared';
import { GameStateManager } from './GameState';
import { CommandRouter } from '../input/CommandRouter';
import { SocketManager } from '../networking/SocketManager';
import { MechanicsManager, DEFAULT_MECHANICS_CONFIG } from './mechanics';

export class GameEngine {
  private gameState: GameStateManager;
  private commandRouter: CommandRouter;
  private socketManager: SocketManager | null = null;
  private mechanicsManager: MechanicsManager;
  private config: GameConfig;
  private tickInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(gameState: GameStateManager, commandRouter: CommandRouter, config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config;
    this.gameState = gameState;
    this.commandRouter = commandRouter;
    this.mechanicsManager = new MechanicsManager(DEFAULT_MECHANICS_CONFIG);
  }

  // Initialize with socket manager
  public initialize(socketManager: SocketManager): void {
    this.socketManager = socketManager;
  }

  // Game lifecycle
  public start(): void {
    if (this.isRunning) {
      console.log('Game engine is already running');
      return;
    }

    console.log('Starting game engine with config:', this.config);
    this.isRunning = true;

    // Start the game
    this.gameState.startGame();
    
    // Spawn boss if not already spawned
    if (!this.gameState.getBoss()) {
      const boss = this.gameState.spawnBoss();
      this.socketManager?.broadcastBossSpawned(boss);
    }

    // Start tick loop
    this.startTickLoop();

    // Broadcast game started
    this.socketManager?.broadcastGameStarted();
    
    console.log('Game engine started successfully');
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log('Game engine is not running');
      return;
    }

    console.log('Stopping game engine');
    this.isRunning = false;

    // Stop tick loop
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    // End the game
    this.gameState.endGame();

    // Broadcast game ended
    this.socketManager?.broadcastGameEnded({
      reason: 'Game stopped by admin',
      timestamp: new Date()
    });

    console.log('Game engine stopped');
  }

  public pause(): void {
    if (!this.isRunning) {
      console.log('Game engine is not running');
      return;
    }

    console.log('Pausing game engine');
    this.gameState.pauseGame();
    this.socketManager?.broadcastGamePaused();
  }

  public resume(): void {
    if (!this.isRunning) {
      console.log('Game engine is not running');
      return;
    }

    console.log('Resuming game engine');
    this.gameState.resumeGame();
    this.socketManager?.broadcastGameResumed();
  }

  public reset(): void {
    console.log('Resetting game engine');
    
    // Stop current game
    this.stop();
    
    // Reset game state
    this.gameState.resetGame();
    
    // Clear command history
    this.commandRouter.clearCommandHistory();
    
    // Broadcast reset
    this.socketManager?.broadcastAdminMessage('Game has been reset');
    
    console.log('Game engine reset complete');
  }

  // Tick system
  private startTickLoop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }

    this.tickInterval = setInterval(() => {
      this.tick();
    }, this.config.tickRate);
  }

  private tick(): void {
    if (!this.isRunning || this.gameState.getStatus() !== 'active') {
      return;
    }

    // Update last tick time
    this.gameState.getState().lastTickAt = new Date();

    // Update boss phase based on health
    this.updateBossPhase();

    // Process boss mechanics
    this.processBossMechanics();

    // Check player safety against mechanics
    this.checkPlayerSafety();

    // Check win/lose conditions
    this.checkGameConditions();

    // Broadcast updated game state with mechanics data
    const mechanicsData = this.mechanicsManager.serialize();
    this.socketManager?.broadcastGameState(mechanicsData);
  }

  private updateBossPhase(): void {
    const boss = this.gameState.getBoss();
    if (!boss || !boss.isAlive) return;

    const healthPercentage = boss.currentHealth / boss.maxHealth;
    let newPhase: number;

    if (healthPercentage > 0.6) {
      newPhase = 1;
    } else if (healthPercentage > 0.3) {
      newPhase = 2;
    } else {
      newPhase = 3;
    }

    if (newPhase !== boss.phase) {
      boss.phase = newPhase;
      this.mechanicsManager.setBossPhase(newPhase);
      console.log(`Boss entered phase ${newPhase}`);
    }
  }

  private processBossMechanics(): void {
    const boss = this.gameState.getBoss();
    if (!boss || !boss.isAlive) {
      console.log('🔍 Boss mechanics check: No boss or boss not alive');
      return;
    }

    console.log(`🔍 Boss mechanics check: Boss phase ${this.mechanicsManager.getBossPhase()}, Active mechanics: ${this.mechanicsManager.getMechanicCount()}`);

    // Update existing mechanics
    this.mechanicsManager.updateMechanics();

    // Check if we should trigger a new mechanic
    if (this.mechanicsManager.shouldTriggerMechanic()) {
      console.log('⚡ Triggering new mechanic...');
      const newMechanic = this.mechanicsManager.triggerRandomMechanic();
      if (newMechanic) {
        console.log(`🎯 Boss mechanic triggered: ${newMechanic.getName()}`);
        console.log(`📡 Broadcasting mechanic data:`, {
          id: newMechanic.getId(),
          type: newMechanic.getType(),
          warningTime: newMechanic.getWarningTimeRemaining(),
          data: newMechanic.serialize().data
        });
        
        // Broadcast mechanic warning
        this.socketManager?.broadcastAdminMessage(newMechanic.getWarningMessage());
        
        // Broadcast mechanic data to clients
        this.socketManager?.broadcastBossMechanic({
          id: newMechanic.getId(),
          type: newMechanic.getType(),
          name: newMechanic.getName(),
          description: newMechanic.getDescription(),
          warningTime: newMechanic.getWarningTimeRemaining(),
          duration: newMechanic.getTimeRemaining(),
          data: newMechanic.serialize().data
        });
      } else {
        console.log('❌ Failed to create new mechanic');
      }
    } else {
      console.log('⏳ Not time for new mechanic yet');
    }
  }

  private checkPlayerSafety(): void {
    const players = this.gameState.getAlivePlayers();
    
    for (const player of players) {
      // Give new players a grace period (5 seconds) before they can be killed by mechanics
      const gracePeriod = 5000; // 5 seconds
      const timeSinceJoin = Date.now() - player.joinedAt.getTime();
      
      if (timeSinceJoin < gracePeriod) {
        continue; // Skip safety check for new players
      }
      
      if (!this.mechanicsManager.checkPlayerSafety(player)) {
        // Player is in danger from a mechanic
        console.log(`Player ${player.name} is in danger from boss mechanics!`);
        
        // Kill the player
        this.gameState.killPlayer(player.id);
        
        // Broadcast player death
        this.socketManager?.broadcastPlayerDied(player.id);
        
        // Broadcast respawn instruction
        this.socketManager?.broadcastAdminMessage(`Player ${player.name} died! Use respawn to return to the fight.`);
      }
    }
  }

  private getBossAttackCooldown(phase: number): number {
    switch (phase) {
      case 1: return 12000; // 12 seconds
      case 2: return 8000;  // 8 seconds
      case 3: return 5000;  // 5 seconds
      default: return 12000;
    }
  }

  private checkGameConditions(): void {
    const boss = this.gameState.getBoss();
    const alivePlayers = this.gameState.getAlivePlayers();
    const totalPlayers = this.gameState.getPlayerCount();

    // Check if boss is dead (players win)
    if (boss && !boss.isAlive) {
      this.handleBossDeath();
      return;
    }

    // Check if all players are dead (boss wins) - but only if there were players to begin with
    if (totalPlayers > 0 && alivePlayers.length === 0) {
      this.handleAllPlayersDead();
      return;
    }
  }

  private handleBossDeath(): void {
    console.log('Boss defeated! Players win!');
    
    // Calculate rewards
    const players = this.gameState.getPlayers();
    const sortedPlayers = players.sort((a, b) => b.damage - a.damage);
    
    const result = {
      winner: 'Players',
      reason: 'Boss defeated',
      timestamp: new Date(),
      topDamageDealers: sortedPlayers.slice(0, 3).map(p => ({
        name: p.name,
        damage: p.damage
      }))
    };

    this.socketManager?.broadcastBossDied();
    this.socketManager?.broadcastGameEnded(result);
    
    // End the game
    this.gameState.endGame();
  }

  private handleAllPlayersDead(): void {
    console.log('All players dead! Boss wins!');
    
    const result = {
      winner: 'Boss',
      reason: 'All players defeated',
      timestamp: new Date()
    };

    this.socketManager?.broadcastGameEnded(result);
    
    // End the game
    this.gameState.endGame();
  }

  // Getters
  public getGameState(): GameStateManager {
    return this.gameState;
  }

  public getCommandRouter(): CommandRouter {
    return this.commandRouter;
  }

  public isGameRunning(): boolean {
    return this.isRunning;
  }

  public getConfig(): GameConfig {
    return this.config;
  }

  public getMechanicsManager(): MechanicsManager {
    return this.mechanicsManager;
  }

  public triggerMechanic() {
    const boss = this.gameState.getBoss();
    if (!boss || !boss.isAlive) {
      console.log('❌ Cannot trigger mechanic: No boss or boss not alive');
      return null;
    }

    console.log('🎯 Manually triggering mechanic...');
    const newMechanic = this.mechanicsManager.triggerRandomMechanic();
    if (newMechanic) {
      console.log(`🎯 Manual mechanic triggered: ${newMechanic.getName()}`);
      console.log(`📡 Broadcasting mechanic data:`, {
        id: newMechanic.getId(),
        type: newMechanic.getType(),
        warningTime: newMechanic.getWarningTimeRemaining(),
        data: newMechanic.serialize().data
      });
      
      // Broadcast mechanic warning
      this.socketManager?.broadcastAdminMessage(newMechanic.getWarningMessage());
      
      // Broadcast mechanic data to clients
      this.socketManager?.broadcastBossMechanic({
        id: newMechanic.getId(),
        type: newMechanic.getType(),
        name: newMechanic.getName(),
        description: newMechanic.getDescription(),
        warningTime: newMechanic.getWarningTimeRemaining(),
        duration: newMechanic.getTimeRemaining(),
        data: newMechanic.serialize().data
      });
      
      return newMechanic;
    } else {
      console.log('❌ Failed to create manual mechanic');
      return null;
    }
  }

  // Configuration updates
  public updateTickRate(newTickRate: number): void {
    if (newTickRate < 100 || newTickRate > 5000) {
      throw new Error('Tick rate must be between 100ms and 5000ms');
    }

    this.config.tickRate = newTickRate;
    
    // Restart tick loop if running
    if (this.isRunning) {
      this.startTickLoop();
    }
  }

  public updateMaxPlayers(newMaxPlayers: number): void {
    if (newMaxPlayers < 1 || newMaxPlayers > 100) {
      throw new Error('Max players must be between 1 and 100');
    }

    this.config.maxPlayers = newMaxPlayers;
  }

  public forceTriggerMechanic(): void {
    console.log('🚀 Force triggering mechanic (bypassing all checks)...');
    const mechanic = this.mechanicsManager.forceTriggerRandomMechanic();
    if (mechanic) {
      console.log(`✅ Force triggered mechanic: ${mechanic.getType()}`);
      // Broadcast mechanic data to clients
      this.socketManager?.broadcastBossMechanic({
        id: mechanic.getId(),
        type: mechanic.getType(),
        name: mechanic.getName(),
        description: mechanic.getDescription(),
        warningTime: mechanic.getWarningTimeRemaining(),
        duration: mechanic.getTimeRemaining(),
        data: mechanic.serialize().data
      });
    } else {
      console.log('❌ Failed to force trigger mechanic');
    }
  }
}
