import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameRenderer } from '../pixi/GameRenderer';
import type { ClientGameState, RenderConfig } from '../types/ClientTypes';

interface GameCanvasProps {
  gameState: ClientGameState | null;
  config: RenderConfig;
  onError?: (error: Error) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  config,
  onError
}) => {
  const rendererRef = useRef<GameRenderer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Callback ref to handle canvas mounting
  const canvasCallbackRef = useCallback((node: HTMLDivElement | null) => {
    console.log('🎮 Callback ref triggered with node:', node);
    if (node && !rendererRef.current) {
      console.log('🎮 Canvas element mounted, initializing renderer...');
      initializeRenderer(node);
    } else if (!node) {
      console.log('🎮 Canvas element unmounted');
    } else if (rendererRef.current) {
      console.log('🎮 Renderer already exists, skipping initialization');
    }
  }, [config, onError]);

  const initializeRenderer = async (canvasElement: HTMLDivElement) => {
    try {
      console.log('🎮 Creating GameRenderer instance...');
      const renderer = new GameRenderer({
        canvasWidth: config.canvasWidth,
        canvasHeight: config.canvasHeight,
        backgroundColor: config.backgroundColor,
        gridConfig: {
          gridWidth: config.gridWidth,
          gridHeight: config.gridHeight,
          canvasWidth: config.canvasWidth,
          canvasHeight: config.canvasHeight,
          padding: config.padding
        }
      });

      console.log('🎮 GameRenderer created successfully');
      console.log('🎮 Getting canvas element...');
      const canvas = await renderer.getCanvas();
      console.log('🎮 Canvas element:', canvas);

      console.log('🎮 Appending canvas to container...');
      canvasElement.appendChild(canvas);
      console.log('🎮 Canvas appended successfully');
      
      rendererRef.current = renderer;
      setIsInitialized(true);
      setError(null);

      console.log('🎮 ✅ Game renderer initialized successfully');
      console.log('🎮 Canvas dimensions:', {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight
      });
      console.log('🎮 PIXI App:', renderer.getApp());
      console.log('🎮 PIXI App stage children:', renderer.getApp().stage.children.length);
      console.log('🎮 Canvas parent element:', canvas.parentElement);
    } catch (err) {
      console.error('🎮 ❌ Failed to initialize game renderer:', err);
      const error = err instanceof Error ? err : new Error('Failed to initialize renderer');
      setError(error);
      onError?.(error);
    }
  };

  // Fallback initialization if callback ref doesn't work
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!rendererRef.current && !isInitialized) {
        console.log('🎮 Fallback: Attempting to initialize renderer...');
        // Try to find the canvas element in the DOM
        const canvasElement = document.querySelector('.game-canvas') as HTMLDivElement;
        if (canvasElement) {
          console.log('🎮 Fallback: Found canvas element, initializing...');
          initializeRenderer(canvasElement);
        } else {
          console.log('🎮 Fallback: Canvas element not found in DOM');
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [config, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        console.log('🎮 Cleaning up renderer...');
        rendererRef.current.destroy();
        rendererRef.current = null;
        setIsInitialized(false);
      }
    };
  }, []);

  // Update game state when it changes
  useEffect(() => {
    console.log('🎮 Game state effect triggered:', {
      hasRenderer: !!rendererRef.current,
      hasGameState: !!gameState,
      isInitialized: isInitialized,
      gameState: gameState
    });
    
    if (rendererRef.current && gameState && isInitialized) {
      console.log('🎮 Updating game state with renderer...');
      rendererRef.current.updateGameState(gameState).catch((err) => {
        const error = err instanceof Error ? err : new Error('Failed to update game state');
        setError(error);
        onError?.(error);
        console.error('🎮 ❌ Failed to update game state:', error);
      });
    } else {
      console.log('🎮 Skipping game state update:', {
        reason: !rendererRef.current ? 'No renderer' : 
                !gameState ? 'No game state' : 
                !isInitialized ? 'Not initialized' : 'Unknown'
      });
    }
  }, [gameState, isInitialized, onError]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current) {
        const newWidth = window.innerWidth - 400; // Account for sidebars
        const newHeight = window.innerHeight - 100; // Account for header/footer
        rendererRef.current.resize(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div className="canvas-error">
        <h3>Rendering Error</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Reload Game
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={canvasCallbackRef}
      className="game-canvas"
      style={{
        width: config.canvasWidth,
        height: config.canvasHeight,
        border: '2px solid #34495E',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {!isInitialized && (
        <div 
          className="canvas-loading"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            zIndex: 1000
          }}
        >
          <div className="loading-spinner"></div>
          <p>Initializing game renderer...</p>
        </div>
      )}
    </div>
  );
};
