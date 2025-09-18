// Shared utilities and types for the pumpfun game
export const VERSION = '1.0.0';

export interface GameConfig {
  width: number;
  height: number;
  fps: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  fps: 60
};
