import { Server } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@pumpfun-game/shared';
import { GameStateManager } from '../engine/GameState';
import { CommandRouter } from '../input/CommandRouter';
import { DummyInput } from '../input/DummyInput';

export class SocketManager {
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private gameState: GameStateManager;
  private commandRouter: CommandRouter;
  private dummyInput: DummyInput;
  private connectedSockets: Map<string, string> = new Map(); // socketId -> playerId

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    gameState: GameStateManager,
    commandRouter: CommandRouter
  ) {
    this.io = io;
    this.gameState = gameState;
    this.commandRouter = commandRouter;
    this.dummyInput = new DummyInput(commandRouter);
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Send current game state to newly connected client
      this.sendGameStateToSocket(socket);
      
      // Handle player commands
      socket.on('joinGame', (playerName: string) => {
        this.handleJoinGame(socket, playerName);
      });

      socket.on('move', (direction: 'up' | 'down' | 'left' | 'right') => {
        this.handleMove(socket, direction);
      });

      socket.on('attack', () => {
        this.handleAttack(socket);
      });

      socket.on('heroism', () => {
        this.handleHeroism(socket);
      });

      socket.on('respawn', () => {
        this.handleRespawn(socket);
      });

      // Legacy button click handler (for compatibility)
      socket.on('buttonClick', () => {
        this.handleButtonClick(socket);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinGame(socket: any, playerName: string): void {
    const command = this.dummyInput.handleJoinCommand(playerName);
    
    if (command.playerId) {
      this.connectedSockets.set(socket.id, command.playerId);
      socket.data.playerId = command.playerId;
    }

    // Broadcast updated game state to all clients
    this.broadcastGameState();
  }

  private handleMove(socket: any, direction: 'up' | 'down' | 'left' | 'right'): void {
    const playerId = this.connectedSockets.get(socket.id);
    if (!playerId) {
      socket.emit('adminMessage', 'You must join the game first');
      return;
    }

    this.dummyInput.handleMoveCommand(playerId, direction);
    this.broadcastGameState();
  }

  private handleAttack(socket: any): void {
    const playerId = this.connectedSockets.get(socket.id);
    if (!playerId) {
      socket.emit('adminMessage', 'You must join the game first');
      return;
    }

    this.dummyInput.handleAttackCommand(playerId);
    this.broadcastGameState();
  }

  private handleHeroism(socket: any): void {
    const playerId = this.connectedSockets.get(socket.id);
    this.dummyInput.handleHeroismCommand(playerId);
    // Heroism doesn't need to broadcast game state immediately unless activated
  }

  private handleRespawn(socket: any): void {
    const playerId = this.connectedSockets.get(socket.id);
    if (!playerId) {
      socket.emit('adminMessage', 'You must join the game first');
      return;
    }

    this.dummyInput.handleRespawnCommand(playerId);
    this.broadcastGameState();
  }

  private handleButtonClick(socket: any): void {
    // Legacy compatibility - create a new player
    const command = this.dummyInput.handleButtonClick();
    
    if (command.playerId) {
      this.connectedSockets.set(socket.id, command.playerId);
      socket.data.playerId = command.playerId;
    }

    // Broadcast updated game state to all clients
    this.broadcastGameState();
  }

  private handleDisconnect(socket: any): void {
    console.log('Client disconnected:', socket.id);
    
    const playerId = this.connectedSockets.get(socket.id);
    if (playerId) {
      // Remove player from game
      this.gameState.removePlayer(playerId);
      this.connectedSockets.delete(socket.id);
      
      // Broadcast updated game state
      this.broadcastGameState();
    }
  }

  private sendGameStateToSocket(socket: any): void {
    const gameState = this.gameState.serialize();
    
    // Send current game state
    socket.emit('gameStateUpdate', gameState);
    
    // Send existing players (for legacy compatibility)
    const players = this.gameState.getPlayers();
    const legacyKnights = players.map(player => ({
      id: player.id,
      x: player.position.x,
      y: player.position.y,
      color: player.color,
      frameIndex: player.frameIndex
    }));
    
    socket.emit('existingTiles', legacyKnights);
  }

  public broadcastGameState(mechanicsData?: any): void {
    const gameState = this.gameState.serialize(mechanicsData);
    
    // Broadcast to all connected clients
    this.io.emit('gameStateUpdate', gameState);
    
    // Legacy compatibility - broadcast individual player updates
    const players = this.gameState.getPlayers();
    players.forEach(player => {
      const legacyKnight = {
        id: player.id,
        x: player.position.x,
        y: player.position.y,
        color: player.color,
        frameIndex: player.frameIndex
      };
      
      this.io.emit('knightSpawned', legacyKnight);
    });
  }

  // Public methods for external control
  public broadcastPlayerJoined(player: any): void {
    this.io.emit('playerJoined', player);
  }

  public broadcastPlayerLeft(playerId: string): void {
    this.io.emit('playerLeft', playerId);
  }

  public broadcastPlayerMoved(playerId: string, position: any): void {
    this.io.emit('playerMoved', playerId, position);
  }

  public broadcastPlayerAttacked(playerId: string, target: any): void {
    this.io.emit('playerAttacked', playerId, target);
  }

  public broadcastPlayerDied(playerId: string): void {
    this.io.emit('playerDied', playerId);
  }

  public broadcastBossSpawned(boss: any): void {
    this.io.emit('bossSpawned', boss);
  }

  public broadcastBossDamaged(damage: number, newHealth: number): void {
    this.io.emit('bossDamaged', damage, newHealth);
  }

  public broadcastBossDied(): void {
    this.io.emit('bossDied');
  }

  public broadcastBossMechanic(mechanic: any): void {
    this.io.emit('bossMechanic', mechanic);
  }

  public broadcastGameStarted(): void {
    this.io.emit('gameStarted');
  }

  public broadcastGamePaused(): void {
    this.io.emit('gamePaused');
  }

  public broadcastGameResumed(): void {
    this.io.emit('gameResumed');
  }

  public broadcastGameEnded(result: any): void {
    this.io.emit('gameEnded', result);
  }

  public broadcastAdminMessage(message: string): void {
    this.io.emit('adminMessage', message);
  }

  public getConnectedPlayerCount(): number {
    return this.connectedSockets.size;
  }

  public getConnectedPlayers(): string[] {
    return Array.from(this.connectedSockets.values());
  }
}
