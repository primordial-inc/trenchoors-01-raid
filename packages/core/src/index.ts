// Core game logic for the pumpfun game
import { GameConfig, DEFAULT_CONFIG } from '@pumpfun-game/shared';

export class GameEngine {
  private config: GameConfig;
  
  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
  }
  
  public start(): void {
    console.log('Game engine started with config:', this.config);
  }
  
  public stop(): void {
    console.log('Game engine stopped');
  }
}
