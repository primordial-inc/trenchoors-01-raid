import { GameStateManager } from './GameState';

export interface HeroismParticipant {
  playerId: string;
  timestamp: Date;
}

export class HeroismManager {
  private gameState: GameStateManager;
  private participants: Map<string, HeroismParticipant> = new Map();
  private readonly requiredParticipants = 5;
  private readonly timeWindow = 10000; // 10 seconds
  private readonly cooldown = 300000; // 5 minutes
  private lastActivation: Date | null = null;

  constructor(gameState: GameStateManager) {
    this.gameState = gameState;
  }

  public processHeroismCommand(playerId: string): { success: boolean; message: string; activated: boolean } {
    const now = new Date();

    // Check cooldown
    if (this.lastActivation && (now.getTime() - this.lastActivation.getTime()) < this.cooldown) {
      const remainingCooldown = Math.ceil((this.cooldown - (now.getTime() - this.lastActivation.getTime())) / 1000);
      return {
        success: false,
        message: `Heroism is on cooldown for ${remainingCooldown} more seconds`,
        activated: false
      };
    }

    // Check if already active
    if (this.gameState.isHeroismBoostActive()) {
      return {
        success: false,
        message: 'Heroism boost is already active!',
        activated: false
      };
    }

    // Add participant
    this.participants.set(playerId, {
      playerId,
      timestamp: now
    });

    // Clean up old participants outside time window
    this.cleanupOldParticipants();

    const currentCount = this.participants.size;
    const needed = this.requiredParticipants - currentCount;

    if (currentCount >= this.requiredParticipants) {
      // Activate heroism boost
      const participantIds = Array.from(this.participants.keys());
      const success = this.gameState.activateHeroismBoost(participantIds);
      
      if (success) {
        this.lastActivation = now;
        this.participants.clear();
        
        return {
          success: true,
          message: `🔥 HEROISM ACTIVATED! ${participantIds.length} players united for 5x damage boost!`,
          activated: true
        };
      } else {
        return {
          success: false,
          message: 'Failed to activate heroism boost',
          activated: false
        };
      }
    } else {
      return {
        success: true,
        message: `Heroism: ${currentCount}/${this.requiredParticipants} players. Need ${needed} more!`,
        activated: false
      };
    }
  }

  private cleanupOldParticipants(): void {
    const now = new Date();
    const cutoff = now.getTime() - this.timeWindow;

    for (const [playerId, participant] of this.participants) {
      if (participant.timestamp.getTime() < cutoff) {
        this.participants.delete(playerId);
      }
    }
  }

  public getCurrentParticipants(): number {
    this.cleanupOldParticipants();
    return this.participants.size;
  }

  public getRequiredParticipants(): number {
    return this.requiredParticipants;
  }

  public getTimeRemaining(): number {
    if (this.participants.size === 0) return 0;
    
    const oldestParticipant = Math.min(
      ...Array.from(this.participants.values()).map(p => p.timestamp.getTime())
    );
    
    const timeRemaining = this.timeWindow - (Date.now() - oldestParticipant);
    return Math.max(0, timeRemaining);
  }

  public getCooldownRemaining(): number {
    if (!this.lastActivation) return 0;
    
    const timeSinceActivation = Date.now() - this.lastActivation.getTime();
    const cooldownRemaining = this.cooldown - timeSinceActivation;
    return Math.max(0, cooldownRemaining);
  }

  public reset(): void {
    this.participants.clear();
    this.lastActivation = null;
  }
}
