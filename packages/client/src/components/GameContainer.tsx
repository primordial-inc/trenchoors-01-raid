import React, { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { assetManager } from '../assets/AssetManager';
import { GameCanvas } from './GameCanvas';
import { PlayerList } from './PlayerList';
import { BossStatus } from './BossStatus';
import { MechanicWarnings } from './MechanicWarnings';
import { LoadingScreen } from './LoadingScreen';
import { ErrorBoundary } from './ErrorBoundary';
import type { ClientConfig, GameError } from '../types/ClientTypes';
import { getResponsiveConfig } from '../config/RenderConfig';

interface GameContainerProps {
  config?: Partial<ClientConfig>;
  onError?: (error: GameError) => void;
  onGameStateUpdate?: (gameState: any) => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  config = {},
  onError,
  onGameStateUpdate
}) => {
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [assetLoadingError, setAssetLoadingError] = useState<string | null>(null);
  const [renderConfig] = useState(() => getResponsiveConfig());
  
  // Use game state hook
  const {
    gameState,
    connectionState,
    error: gameError,
    useMockData,
    setUseMockData
  } = useGameState(config.serverUrl || 'ws://localhost:3000');

  // Convert server game state to client game state
  const clientGameState = gameState ? {
    ...gameState,
    createdAt: typeof gameState.createdAt === 'string' ? new Date(gameState.createdAt) : gameState.createdAt,
    lastTickAt: gameState.lastTickAt ? (typeof gameState.lastTickAt === 'string' ? new Date(gameState.lastTickAt) : gameState.lastTickAt) : undefined,
    players: new Map(Array.from(gameState.players.entries()).map(([id, player]) => [
      id,
      {
        ...player,
        joinedAt: typeof player.joinedAt === 'string' ? new Date(player.joinedAt) : player.joinedAt,
        lastCommandAt: player.lastCommandAt ? (typeof player.lastCommandAt === 'string' ? new Date(player.lastCommandAt) : player.lastCommandAt) : undefined,
        isVisible: true,
        lastUpdateTime: Date.now()
      }
    ])),
    boss: gameState.boss ? {
      ...gameState.boss,
      lastAttackAt: gameState.boss.lastAttackAt ? (typeof gameState.boss.lastAttackAt === 'string' ? new Date(gameState.boss.lastAttackAt) : gameState.boss.lastAttackAt) : undefined,
      isVisible: true,
      lastUpdateTime: Date.now()
    } : null,
    heroismBoost: gameState.heroismBoost ? {
      ...gameState.heroismBoost,
      startTime: typeof gameState.heroismBoost.startTime === 'string' ? new Date(gameState.heroismBoost.startTime) : gameState.heroismBoost.startTime,
      endTime: typeof gameState.heroismBoost.endTime === 'string' ? new Date(gameState.heroismBoost.endTime) : gameState.heroismBoost.endTime
    } : null
  } : null;

  // Load assets on mount (non-blocking)
  useEffect(() => {
    const loadAssets = async () => {
      try {
        console.log('🎨 Starting asset loading...');
        await assetManager.loadCriticalAssets();
        console.log('🎨 Asset loading completed successfully');
        setIsAssetsLoaded(true);
      } catch (error) {
        console.error('🎨 Asset loading failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load assets';
        setAssetLoadingError(errorMessage);
        onError?.({
          type: 'asset_loading',
          message: errorMessage,
          timestamp: new Date()
        });
        // Still set assets as loaded so the game can continue with fallbacks
        setIsAssetsLoaded(true);
      }
    };

    // Start asset loading but don't block the UI
    loadAssets();
    
    // Set assets as loaded immediately so the game can start with fallbacks
    setIsAssetsLoaded(true);
  }, [onError]);

  // Handle game state updates
  useEffect(() => {
    if (gameState) {
      onGameStateUpdate?.(gameState);
    }
  }, [gameState, onGameStateUpdate]);

  // Handle game errors
  useEffect(() => {
    if (gameError) {
      onError?.({
        type: 'game_state',
        message: gameError,
        timestamp: new Date()
      });
    }
  }, [gameError, onError]);

  // Show loading screen while assets are loading
  if (!isAssetsLoaded) {
    return (
      <LoadingScreen
        progress={{
          total: assetManager.getTotalAssets(),
          loaded: assetManager.getLoadedAssets(),
          failed: 0,
          progress: assetManager.getLoadingProgress(),
          errors: assetManager.getErrors()
        }}
        message="Loading game assets..."
      />
    );
  }

  // Show error screen if asset loading failed
  if (assetLoadingError) {
    return (
      <div className="error-screen">
        <h2>Asset Loading Error</h2>
        <p>{assetLoadingError}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={(error) => onError?.({
      type: 'rendering',
      message: error.message,
      details: error.stack,
      timestamp: new Date()
    })}>
      <div className="game-container">
        {/* Top announcement bar */}
        <div className="announcement-bar">
          <MechanicWarnings
            mechanic={null} // TODO: Get from game state
            warningTime={5000}
          />
        </div>

        {/* Main game area */}
        <div className="game-main">
          {/* Left sidebar - Player list */}
          <div className="sidebar left">
            <PlayerList
              players={gameState?.players || new Map()}
              maxPlayers={50}
            />
          </div>

          {/* Center - Game canvas */}
          <div className="game-canvas-container">
            <GameCanvas
              gameState={clientGameState}
              config={renderConfig}
              onError={(error) => onError?.({
                type: 'rendering',
                message: error.message,
                details: error.stack,
                timestamp: new Date()
              })}
            />
          </div>

          {/* Right sidebar - Boss status */}
          <div className="sidebar right">
            <BossStatus
              boss={clientGameState?.boss || null}
              heroismBoost={clientGameState?.heroismBoost || null}
            />
          </div>
        </div>

        {/* Connection status */}
        <div className={`connection-status ${connectionState.status}`}>
          <span className="status-indicator"></span>
          <span className="status-text">
            {connectionState.status === 'connected' ? 'Connected' :
             connectionState.status === 'connecting' ? 'Connecting...' :
             connectionState.status === 'disconnected' ? 'Disconnected' :
             connectionState.status === 'error' ? 'Connection Error' : 'Unknown'}
          </span>
          {connectionState.error && (
            <span className="error-text">{connectionState.error}</span>
          )}
        </div>

        {/* Mock data toggle (development only) */}
        {import.meta.env.DEV && (
          <div className="dev-controls">
            <label>
              <input
                type="checkbox"
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
              />
              Use Mock Data
            </label>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
