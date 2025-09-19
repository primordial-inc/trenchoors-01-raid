import { Command, CommandResult, Player, Position, GRID_WIDTH, GRID_HEIGHT } from '@pumpfun-game/shared';
import { GameStateManager } from '../engine/GameState';
import { PlayerEntity } from '../engine/Player';
import { HeroismManager } from '../engine/HeroismManager';
import { v4 as uuidv4 } from 'uuid';

export class CommandRouter {
  private gameState: GameStateManager;
  private heroismManager: HeroismManager;
  private commandHistory: Command[] = [];
  private playerCooldowns: Map<string, Date> = new Map();

  constructor(gameState: GameStateManager) {
    this.gameState = gameState;
    this.heroismManager = new HeroismManager(gameState);
  }

  // Process a command and return the result
  processCommand(command: Command): CommandResult {
    // Add to history
    this.commandHistory.push(command);

    // Check cooldown
    if (command.playerId && this.isPlayerOnCooldown(command.playerId)) {
      return {
        success: false,
        message: 'Command cooldown active. Please wait before issuing another command.'
      };
    }

    let result: CommandResult;

    switch (command.type) {
      case 'join':
        result = this.handleJoinCommand(command);
        break;
      case 'move':
        result = this.handleMoveCommand(command);
        break;
      case 'attack':
        result = this.handleAttackCommand(command);
        break;
      case 'heroism':
        result = this.handleHeroismCommand(command);
        break;
      case 'respawn':
        result = this.handleRespawnCommand(command);
        break;
      default:
        result = {
          success: false,
          message: 'Unknown command type'
        };
    }

    // Set cooldown if command was successful and has a player
    if (result.success && command.playerId) {
      this.setPlayerCooldown(command.playerId);
    }

    return result;
  }

  private handleJoinCommand(command: Command): CommandResult {
    const { playerName } = command.data;
    
    if (!playerName || typeof playerName !== 'string') {
      return {
        success: false,
        message: 'Invalid player name'
      };
    }

    // Check if game is accepting new players
    if (this.gameState.getStatus() !== 'waiting' && this.gameState.getStatus() !== 'active') {
      return {
        success: false,
        message: 'Game is not accepting new players'
      };
    }

    // Check if player already exists
    const existingPlayers = this.gameState.getPlayers();
    const existingPlayer = existingPlayers.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    
    if (existingPlayer) {
      return {
        success: false,
        message: 'Player with this name already exists'
      };
    }

    // Find empty position
    const emptyPosition = this.gameState.getRandomEmptyPosition();
    if (!emptyPosition) {
      return {
        success: false,
        message: 'No available spawn positions'
      };
    }

    // Create player
    const colors = ['blue', 'red', 'yellow', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const player = new PlayerEntity(playerName, emptyPosition, randomColor);

    // Add to game state
    const success = this.gameState.addPlayer(player.toPlayerType());
    
    if (!success) {
      return {
        success: false,
        message: 'Game is full or player could not be added'
      };
    }

    return {
      success: true,
      message: `Player ${playerName} joined the game`,
      data: {
        player: player.toPlayerType(),
        position: emptyPosition
      }
    };
  }

  private handleMoveCommand(command: Command): CommandResult {
    const { direction } = command.data;
    const { playerId } = command;

    if (!playerId) {
      return {
        success: false,
        message: 'Player ID required for move command'
      };
    }

    if (!direction || !['up', 'down', 'left', 'right'].includes(direction)) {
      return {
        success: false,
        message: 'Invalid direction. Use: up, down, left, right'
      };
    }

    const player = this.gameState.getPlayer(playerId);
    if (!player) {
      return {
        success: false,
        message: 'Player not found'
      };
    }

    if (!player.isAlive) {
      return {
        success: false,
        message: 'Dead players cannot move'
      };
    }

    // Check if game is active
    if (this.gameState.getStatus() !== 'active') {
      return {
        success: false,
        message: 'Game is not active'
      };
    }

    // Calculate new position
    const currentPos = player.position;
    let newPosition: Position = { ...currentPos };

    switch (direction) {
      case 'up':
        newPosition.y = Math.max(0, newPosition.y - 1);
        break;
      case 'down':
        newPosition.y = Math.min(GRID_HEIGHT - 1, newPosition.y + 1);
        break;
      case 'left':
        newPosition.x = Math.max(0, newPosition.x - 1);
        break;
      case 'right':
        newPosition.x = Math.min(GRID_WIDTH - 1, newPosition.x + 1);
        break;
    }

    // Check if position changed
    if (newPosition.x === currentPos.x && newPosition.y === currentPos.y) {
      return {
        success: false,
        message: 'Cannot move in that direction'
      };
    }

    // Check if new position is occupied
    if (this.gameState.isPositionOccupied(newPosition, playerId)) {
      return {
        success: false,
        message: 'Position is occupied'
      };
    }

    // Update player position
    const success = this.gameState.updatePlayerPosition(playerId, newPosition);
    
    if (!success) {
      return {
        success: false,
        message: 'Failed to move player'
      };
    }

    return {
      success: true,
      message: `Player moved ${direction}`,
      data: {
        playerId,
        newPosition,
        direction
      }
    };
  }

  private handleAttackCommand(command: Command): CommandResult {
    const { playerId } = command;

    if (!playerId) {
      return {
        success: false,
        message: 'Player ID required for attack command'
      };
    }

    const player = this.gameState.getPlayer(playerId);
    if (!player) {
      return {
        success: false,
        message: 'Player not found'
      };
    }

    if (!player.isAlive) {
      return {
        success: false,
        message: 'Dead players cannot attack'
      };
    }

    // Check if game is active
    if (this.gameState.getStatus() !== 'active') {
      return {
        success: false,
        message: 'Game is not active'
      };
    }

    const boss = this.gameState.getBoss();
    if (!boss || !boss.isAlive) {
      return {
        success: false,
        message: 'No boss to attack'
      };
    }

    // Calculate base damage (10-25)
    const baseDamage = Math.floor(Math.random() * 16) + 10;
    
    // Apply heroism multiplier
    const heroismMultiplier = this.gameState.getHeroismMultiplier();
    const damage = Math.floor(baseDamage * heroismMultiplier);
    
    // Apply damage to boss
    const bossDamaged = this.gameState.damageBoss(damage);
    
    if (!bossDamaged) {
      return {
        success: false,
        message: 'Failed to damage boss'
      };
    }

    // Update player damage
    this.gameState.updatePlayerDamage(playerId, damage);

    return {
      success: true,
      message: `Attacked boss for ${damage} damage`,
      data: {
        playerId,
        damage,
        bossHealth: this.gameState.getBoss()?.currentHealth || 0
      }
    };
  }

  private handleHeroismCommand(command: Command): CommandResult {
    // Heroism can be called by any player, but we need a player ID to track participation
    const { playerId } = command;
    
    if (!playerId) {
      return {
        success: false,
        message: 'Player ID required for heroism command'
      };
    }

    const result = this.heroismManager.processHeroismCommand(playerId);
    
    return {
      success: result.success,
      message: result.message,
      data: {
        activated: result.activated,
        participants: this.heroismManager.getCurrentParticipants(),
        required: this.heroismManager.getRequiredParticipants(),
        timeRemaining: this.heroismManager.getTimeRemaining(),
        cooldownRemaining: this.heroismManager.getCooldownRemaining()
      }
    };
  }

  private handleRespawnCommand(command: Command): CommandResult {
    const { playerId } = command;

    if (!playerId) {
      return {
        success: false,
        message: 'Player ID required for respawn command'
      };
    }

    const player = this.gameState.getPlayer(playerId);
    if (!player) {
      return {
        success: false,
        message: 'Player not found'
      };
    }

    if (player.isAlive) {
      return {
        success: false,
        message: 'Player is already alive'
      };
    }

    // Check if game is active
    if (this.gameState.getStatus() !== 'active') {
      return {
        success: false,
        message: 'Game is not active'
      };
    }

    // Find empty position for respawn
    const emptyPosition = this.gameState.getRandomEmptyPosition();
    if (!emptyPosition) {
      return {
        success: false,
        message: 'No available respawn positions'
      };
    }

    // Respawn the player
    const success = this.gameState.respawnPlayer(playerId);
    if (!success) {
      return {
        success: false,
        message: 'Failed to respawn player'
      };
    }

    // Update player position
    this.gameState.updatePlayerPosition(playerId, emptyPosition);

    return {
      success: true,
      message: `Player ${player.name} respawned at (${emptyPosition.x}, ${emptyPosition.y})`,
      data: {
        playerId,
        newPosition: emptyPosition
      }
    };
  }

  private isPlayerOnCooldown(playerId: string): boolean {
    const cooldownTime = this.playerCooldowns.get(playerId);
    if (!cooldownTime) return false;

    const now = new Date();
    const cooldownDuration = 200; // 200ms cooldown
    return (now.getTime() - cooldownTime.getTime()) < cooldownDuration;
  }

  private setPlayerCooldown(playerId: string): void {
    this.playerCooldowns.set(playerId, new Date());
  }

  // Utility methods
  getCommandHistory(): Command[] {
    return [...this.commandHistory];
  }

  clearCommandHistory(): void {
    this.commandHistory = [];
  }

  getPlayerCooldowns(): Map<string, Date> {
    return new Map(this.playerCooldowns);
  }
}
