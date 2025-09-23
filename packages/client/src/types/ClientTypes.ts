import * as PIXI from 'pixi.js';
import type { GameState, Player, Boss, Position } from '@pumpfun-game/shared';

// Re-export shared types for convenience
export type { GameState, Player, Boss, Position, Command, CommandResult } from '@pumpfun-game/shared';

// Client-specific extensions
export interface ClientPlayer extends Player {
  sprite?: PIXI.Sprite;
  isVisible: boolean;
  lastUpdateTime: number;
}

export interface ClientBoss extends Boss {
  sprite?: PIXI.Sprite;
  isVisible: boolean;
  lastUpdateTime: number;
}

export interface ClientGameState extends Omit<GameState, 'players' | 'boss'> {
  players: Map<string, ClientPlayer>;
  boss: ClientBoss | null;
}

// Rendering types
export interface RenderConfig {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: number;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  padding: number;
}

export interface SpriteAnimation {
  frames: PIXI.Texture[];
  currentFrame: number;
  frameRate: number;
  loop: boolean;
  isPlaying: boolean;
}

// UI Component types
export interface PlayerListProps {
  players: Map<string, ClientPlayer>;
  maxPlayers: number;
}

export interface BossStatusProps {
  boss: ClientBoss | null;
  heroismBoost: any; // From shared types
}

export interface MechanicWarningProps {
  mechanic: MechanicData | null;
  warningTime: number;
}

// Mechanic types
export interface MechanicData {
  type: 'lava_wave' | 'meteor_strike' | 'pillar_phase' | 'chain_lightning' | 'poison_pools' | 'shockwave';
  isActive: boolean;
  warningTime: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  data: any; // Mechanic-specific data
}

export interface LavaWaveData {
  direction: 'horizontal' | 'vertical';
  row?: number;
  column?: number;
}

export interface MeteorStrikeData {
  positions: Position[];
  blastRadius: number;
}

export interface PillarPhaseData {
  pillars: Position[];
  safeRadius: number;
}

// Asset loading types
export interface AssetLoadingProgress {
  total: number;
  loaded: number;
  failed: number;
  progress: number; // 0-1
  errors: string[];
}

// Connection types
export type ConnectionStatus = 'connected' | 'disconnecting' | 'disconnected' | 'error' | 'connecting';

export interface ConnectionInfo {
  status: ConnectionStatus;
  serverUrl: string;
  lastConnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

// Game events
export interface GameEvent {
  type: 'player_joined' | 'player_moved' | 'player_attacked' | 'boss_damaged' | 'player_died' | 'boss_died' | 'mechanic_triggered' | 'heroism_activated';
  data: any;
  timestamp: Date;
}

// Performance monitoring
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  sprites: number;
  memory: number;
}

// Error handling
export interface GameError {
  type: 'connection' | 'rendering' | 'asset_loading' | 'game_state' | 'unknown';
  message: string;
  details?: any;
  timestamp: Date;
}

// Configuration types
export interface ClientConfig {
  serverUrl: string;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  useMockData: boolean;
  showFPS: boolean;
  enablePerformanceMonitoring: boolean;
}

export const DEFAULT_CLIENT_CONFIG: ClientConfig = {
  serverUrl: 'ws://localhost:3000',
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  useMockData: false,
  showFPS: true,
  enablePerformanceMonitoring: true
};

// Hook return types
export interface UseGameStateReturn {
  gameState: ClientGameState | null;
  connectionInfo: ConnectionInfo;
  isLoading: boolean;
  error: GameError | null;
  connect: () => void;
  disconnect: () => void;
  sendCommand: (command: any) => void;
  useMockData: boolean;
  setUseMockData: (useMock: boolean) => void;
}

export interface UseAssetsReturn {
  loadingProgress: AssetLoadingProgress;
  isLoading: boolean;
  hasErrors: boolean;
  errors: string[];
  loadAssets: () => Promise<void>;
  loadCategory: (category: string) => Promise<void>;
  isAssetLoaded: (assetKey: string) => boolean;
}

export interface UsePixiAppReturn {
  app: PIXI.Application | null;
  canvas: HTMLCanvasElement | null;
  isInitialized: boolean;
  error: Error | null;
  performanceMetrics: PerformanceMetrics;
  initialize: (config: RenderConfig) => Promise<void>;
  destroy: () => void;
  resize: (width: number, height: number) => void;
}

// Component prop types
export interface GameContainerProps {
  config?: Partial<ClientConfig>;
  onError?: (error: GameError) => void;
  onGameStateUpdate?: (gameState: ClientGameState) => void;
}

export interface GameCanvasProps {
  gameState: ClientGameState | null;
  config: RenderConfig;
  onError?: (error: Error) => void;
}

export interface LoadingScreenProps {
  progress: AssetLoadingProgress;
  message?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error) => void;
}

// Utility types
export type AssetKey = keyof typeof import('../assets/AssetConfig').SPRITE_CONFIGS;
export type AssetCategory = keyof typeof import('../assets/AssetConfig').ASSET_CATEGORIES;

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
  loop?: boolean;
}

export interface SpriteAnimationConfig extends AnimationConfig {
  frames: string[]; // Asset keys
  frameRate: number;
}

// Visual effect types
export interface VisualEffect {
  type: 'explosion' | 'damage_number' | 'heal' | 'buff' | 'debuff';
  position: Position;
  duration: number;
  data: any;
}

export interface DamageNumberEffect {
  damage: number;
  isCritical: boolean;
  color: number;
}

export interface ExplosionEffect {
  radius: number;
  intensity: number;
  color: number;
}
