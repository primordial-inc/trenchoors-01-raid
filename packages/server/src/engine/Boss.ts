import { Boss as BossType, Position } from '@pumpfun-game/shared';
import { v4 as uuidv4 } from 'uuid';

export class BossEntity {
  private boss: BossType;

  constructor(name: string, position: Position, maxHealth: number) {
    this.boss = {
      id: uuidv4(),
      name,
      position,
      maxHealth,
      currentHealth: maxHealth,
      phase: 1,
      isAlive: true,
      lastAttackAt: new Date()
    };
  }

  // Getters
  getId(): string {
    return this.boss.id;
  }

  getName(): string {
    return this.boss.name;
  }

  getPosition(): Position {
    return { ...this.boss.position };
  }

  getMaxHealth(): number {
    return this.boss.maxHealth;
  }

  getCurrentHealth(): number {
    return this.boss.currentHealth;
  }

  getHealthPercentage(): number {
    return (this.boss.currentHealth / this.boss.maxHealth) * 100;
  }

  getPhase(): number {
    return this.boss.phase;
  }

  isAlive(): boolean {
    return this.boss.isAlive;
  }

  getLastAttackAt(): Date | undefined {
    return this.boss.lastAttackAt;
  }

  // Actions
  takeDamage(damage: number): boolean {
    if (!this.boss.isAlive) return false;

    this.boss.currentHealth = Math.max(0, this.boss.currentHealth - damage);
    
    // Update phase based on health percentage
    const healthPercentage = this.boss.currentHealth / this.boss.maxHealth;
    if (healthPercentage > 0.6) {
      this.boss.phase = 1;
    } else if (healthPercentage > 0.3) {
      this.boss.phase = 2;
    } else {
      this.boss.phase = 3;
    }

    // Check if boss died
    if (this.boss.currentHealth <= 0) {
      this.boss.isAlive = false;
    }

    return true;
  }

  heal(amount: number): boolean {
    if (!this.boss.isAlive) return false;

    this.boss.currentHealth = Math.min(this.boss.maxHealth, this.boss.currentHealth + amount);
    return true;
  }

  // Boss mechanics (placeholder for now)
  canPerformAttack(): boolean {
    if (!this.boss.isAlive) return false;
    
    const now = new Date();
    const lastAttack = this.boss.lastAttackAt;
    
    if (!lastAttack) return true;
    
    // Different attack cooldowns based on phase
    const cooldown = this.boss.phase === 1 ? 12000 : this.boss.phase === 2 ? 8000 : 5000;
    return (now.getTime() - lastAttack.getTime()) >= cooldown;
  }

  performAttack(): void {
    if (!this.canPerformAttack()) return;
    
    this.boss.lastAttackAt = new Date();
  }

  // Phase-specific behavior
  getAttackCooldown(): number {
    switch (this.boss.phase) {
      case 1: return 12000; // 12 seconds
      case 2: return 8000;  // 8 seconds
      case 3: return 5000;  // 5 seconds
      default: return 12000;
    }
  }

  getMechanicCount(): number {
    switch (this.boss.phase) {
      case 1: return 1; // Single mechanic
      case 2: return 2; // Two mechanics
      case 3: return 3; // Multiple mechanics
      default: return 1;
    }
  }

  // Serialization
  toBossType(): BossType {
    return { ...this.boss };
  }

  // Static factory method
  static fromBossType(bossData: BossType): BossEntity {
    const boss = new BossEntity(bossData.name, bossData.position, bossData.maxHealth);
    boss.boss = { ...bossData };
    return boss;
  }
}
