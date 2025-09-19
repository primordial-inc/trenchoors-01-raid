// Shared utilities and types for the pumpfun game
export const VERSION = '1.0.0';

// Legacy config (keeping for compatibility)
export interface LegacyGameConfig {
  width: number;
  height: number;
  fps: number;
}

export const DEFAULT_CONFIG: LegacyGameConfig = {
  width: 800,
  height: 600,
  fps: 60
};

// Export new types and events
export * from './types/GameTypes';
export * from './events/SocketEvents';
