import { Player as PlayerType, Position } from '@pumpfun-game/shared';
import { v4 as uuidv4 } from 'uuid';

export class PlayerEntity {
  private player: PlayerType;

  constructor(name: string, position: Position, color: string = 'blue') {
    this.player = {
      id: uuidv4(),
      name,
      position,
      color,
      frameIndex: Math.floor(Math.random() * 16), // Random frame for variety
      damage: 0,
      deaths: 0,
      isAlive: true,
      joinedAt: new Date()
    };
  }

  // Getters
  getId(): string {
    return this.player.id;
  }

  getName(): string {
    return this.player.name;
  }

  getPosition(): Position {
    return { ...this.player.position };
  }

  getColor(): string {
    return this.player.color;
  }

  getFrameIndex(): number {
    return this.player.frameIndex;
  }

  getDamage(): number {
    return this.player.damage;
  }

  getDeaths(): number {
    return this.player.deaths;
  }

  isPlayerAlive(): boolean {
    return this.player.isAlive;
  }

  getJoinedAt(): Date {
    return this.player.joinedAt;
  }

  getLastCommandAt(): Date | undefined {
    return this.player.lastCommandAt;
  }

  // Actions
  move(direction: 'up' | 'down' | 'left' | 'right', gridWidth: number, gridHeight: number): boolean {
    if (!this.player.isAlive) return false;

    const newPosition = { ...this.player.position };

    switch (direction) {
      case 'up':
        newPosition.y = Math.max(0, newPosition.y - 1);
        break;
      case 'down':
        newPosition.y = Math.min(gridHeight - 1, newPosition.y + 1);
        break;
      case 'left':
        newPosition.x = Math.max(0, newPosition.x - 1);
        break;
      case 'right':
        newPosition.x = Math.min(gridWidth - 1, newPosition.x + 1);
        break;
    }

    // Check if position actually changed
    if (newPosition.x === this.player.position.x && newPosition.y === this.player.position.y) {
      return false;
    }

    this.player.position = newPosition;
    this.player.lastCommandAt = new Date();
    return true;
  }

  attack(): number {
    if (!this.player.isAlive) return 0;

    // Random damage between 10-25
    const damage = Math.floor(Math.random() * 16) + 10;
    this.player.damage += damage;
    this.player.lastCommandAt = new Date();
    return damage;
  }

  takeDamage(damage: number): boolean {
    if (!this.player.isAlive) return false;

    // For now, any damage kills the player
    // In future, we might add health system
    this.player.isAlive = false;
    this.player.deaths += 1;
    return true;
  }

  respawn(position: Position): void {
    this.player.position = position;
    this.player.isAlive = true;
    this.player.lastCommandAt = new Date();
  }

  // Serialization
  toPlayerType(): PlayerType {
    return { ...this.player };
  }

  // Static factory method for creating from existing data
  static fromPlayerType(playerData: PlayerType): PlayerEntity {
    const player = new PlayerEntity(playerData.name, playerData.position, playerData.color);
    player.player = { ...playerData };
    return player;
  }
}
