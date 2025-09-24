import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GridBattlefield } from '../pixi/GridBattlefield';
import { useGameState } from '../hooks/useGameState';
import type { GridClickEvent } from '../types/GridTypes';
import type { EntityInfo, GridPosition } from '../types/GameTypes';

export const GridTestComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const battlefieldRef = useRef<GridBattlefield | null>(null);
  const isInitializingRef = useRef(false);
  const isMountedRef = useRef(true);
  
  // UI state
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastClick, setLastClick] = useState<GridClickEvent | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityInfo | null>(null);
  
  // Mode selection
  const [mode, setMode] = useState<'manual' | 'server'>('manual');
  
  // Server connection
  const { gameState, connectionStatus, error } = useGameState();
  
  // Manual mode state
  const [, setManualPlayers] = useState<Map<string, { position: GridPosition; color: string; name: string; isAlive: boolean }>>(new Map());
  const [manualBoss, setManualBoss] = useState<{ position: GridPosition; health: number; maxHealth: number; phase: number; isAlive: boolean } | null>(null);
  const [playerCounter, setPlayerCounter] = useState(1);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Starting cleanup...');
    
    if (battlefieldRef.current) {
      try {
        battlefieldRef.current.destroy();
        console.log('✅ Battlefield destroyed successfully');
      } catch (error) {
        console.warn('⚠️ Error during battlefield destruction:', error);
      } finally {
        battlefieldRef.current = null;
      }
    }
    
    // Don't clear innerHTML - let React handle DOM cleanup
    setIsLoaded(false);
    isInitializingRef.current = false;
  }, []);

  // Initialize battlefield function
  const initializeBattlefield = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current || !containerRef.current || !isMountedRef.current) {
      console.log('🚫 Skipping initialization - already initializing or not mounted');
      return;
    }
    
    console.log('🔄 Starting battlefield initialization...');
    isInitializingRef.current = true;

    try {
      // Clean up any existing battlefield first
      if (battlefieldRef.current) {
        console.log('🧹 Cleaning up existing battlefield...');
        battlefieldRef.current.destroy();
        battlefieldRef.current = null;
      }

      // Don't use innerHTML = '' - let React manage the DOM
      // The container should only contain the PIXI canvas, nothing else
      
      console.log('🏗️ Creating new GridBattlefield...');
      const battlefield = new GridBattlefield({
        showLabels: true,
        showGrid: true,
        cellSize: 60,
        backgroundColor: 0x90EE90,
        gridColor: 0x2E8B57,
        labelColor: 0x2E8B57,
      });
      
      console.log('⚡ Initializing battlefield...');
      await battlefield.init(containerRef.current!, 1200, 800);
      
      // Check if component is still mounted before continuing
      if (!isMountedRef.current) {
        console.log('🚫 Component unmounted during initialization, cleaning up...');
        battlefield.destroy();
        return;
      }
      
      console.log('✅ Battlefield initialization complete');
      
      // Set click handlers
      battlefield.setClickHandler((event: GridClickEvent) => {
        if (!isMountedRef.current) return;
        setLastClick(event);
        console.log(`🎯 Clicked: ${event.column}${event.row} (${event.position.x}, ${event.position.y})`);
        
        const entity = battlefield.getEntityAtPosition(event.position);
        setSelectedEntity(entity);
      });

      battlefield.setEntityClickHandler((entity: EntityInfo) => {
        if (!isMountedRef.current) return;
        setSelectedEntity(entity);
        console.log(`🎮 Entity clicked:`, entity);
      });

      battlefieldRef.current = battlefield;
      setIsLoaded(true);

    } catch (error) {
      console.error('❌ Failed to initialize Grid test:', error);
      setIsLoaded(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, []);

  // Main initialization effect
  useEffect(() => {
    console.log('🔄 Container mounted, scheduling initialization...');
    
    // Use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (containerRef.current && isMountedRef.current) {
        initializeBattlefield();
      }
    }, 0);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      isMountedRef.current = false;
      cleanup();
    };
  }, []); // Empty dependency array - only run once

  // Sync server game state with battlefield
  useEffect(() => {
    if (!battlefieldRef.current || mode !== 'server' || !gameState) return;

    const battlefield = battlefieldRef.current;

    // Clear all entities first
    battlefield.clearAllEntities();

    // Spawn players
    gameState.players.forEach(player => {
      battlefield.spawnPlayer(player.id, player.position, player.color, player.name);
      battlefield.updatePlayerState(player.id, player.isAlive, player.damage, player.deaths);
    });

    // Spawn boss if exists
    if (gameState.boss) {
      battlefield.spawnBoss(gameState.boss.position);
      battlefield.updateBoss(
        gameState.boss.currentHealth,
        gameState.boss.maxHealth,
        gameState.boss.phase,
        gameState.boss.isAlive
      );
    }
  }, [gameState, mode]);

  // Manual mode functions
  const spawnPlayer = useCallback(() => {
    if (!battlefieldRef.current) return;

    const playerId = `player_${playerCounter}`;
    const colors = ['blue', 'red', 'yellow', 'green', 'purple', 'orange', 'pink', 'cyan'];
    const color = colors[(playerCounter - 1) % colors.length];
    const position: GridPosition = { x: Math.floor(Math.random() * 16), y: Math.floor(Math.random() * 12) };

    battlefieldRef.current.spawnPlayer(playerId, position, color, `Player ${playerCounter}`);
    
    setManualPlayers(prev => new Map(prev).set(playerId, { position, color, name: `Player ${playerCounter}`, isAlive: true }));
    setPlayerCounter(prev => prev + 1);
  }, [playerCounter]);

  const spawnBoss = useCallback(() => {
    if (!battlefieldRef.current) return;

    const position: GridPosition = { x: 8, y: 6 };
    battlefieldRef.current.spawnBoss(position);
    battlefieldRef.current.updateBoss(100, 100, 1, true);
    
    setManualBoss({ position, health: 100, maxHealth: 100, phase: 1, isAlive: true });
  }, []);

  const clearAllEntities = useCallback(() => {
    if (!battlefieldRef.current) return;

    battlefieldRef.current.clearAllEntities();
    setManualPlayers(new Map());
    setManualBoss(null);
    setSelectedEntity(null);
  }, []);

  const damageBoss = useCallback(() => {
    if (!battlefieldRef.current || !manualBoss) return;

    const newHealth = Math.max(0, manualBoss.health - 20);
    const newPhase = newHealth > 66 ? 1 : newHealth > 33 ? 2 : 3;
    
    battlefieldRef.current.updateBoss(newHealth, manualBoss.maxHealth, newPhase, newHealth > 0);
    
    setManualBoss(prev => prev ? { ...prev, health: newHealth, phase: newPhase, isAlive: newHealth > 0 } : null);
  }, [manualBoss]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      {/* Mode Selection */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setMode('manual')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: mode === 'manual' ? '#3498db' : '#7f8c8d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🎮 Manual Mode
        </button>
        <button
          onClick={() => setMode('server')}
          style={{
            padding: '10px 20px',
            backgroundColor: mode === 'server' ? '#3498db' : '#7f8c8d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🌐 Server Mode
        </button>
      </div>

      {/* Connection Status */}
      {mode === 'server' && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ 
            color: connectionStatus === 'connected' ? '#27ae60' : connectionStatus === 'connecting' ? '#f39c12' : '#e74c3c',
            fontWeight: 'bold'
          }}>
            Status: {connectionStatus}
          </div>
          {error && <div style={{ color: '#e74c3c', marginTop: '5px' }}>Error: {error}</div>}
        </div>
      )}

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        style={{ 
          border: '2px solid #34495e', 
          borderRadius: '8px', 
          backgroundColor: '#2c3e50',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          minWidth: '600px'
        }}
      >
        {!isLoaded && (
          <div style={{ color: 'white', fontSize: '18px' }}>
            🔄 Loading Grid Battlefield...
          </div>
        )}
      </div>

      {isLoaded && (
        <>
          {/* Manual Mode Controls */}
          {mode === 'manual' && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Manual Controls</h3>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={spawnPlayer} style={{ padding: '8px 16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  👤 Spawn Player
                </button>
                <button onClick={spawnBoss} style={{ padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  👹 Spawn Boss
                </button>
                <button onClick={damageBoss} disabled={!manualBoss} style={{ padding: '8px 16px', backgroundColor: manualBoss ? '#f39c12' : '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px', cursor: manualBoss ? 'pointer' : 'not-allowed' }}>
                  ⚔️ Damage Boss (-20)
                </button>
                <button onClick={clearAllEntities} style={{ padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  🗑️ Clear All
                </button>
              </div>
            </div>
          )}

          {/* Click/Entity Info */}
          <div style={{ marginBottom: '10px', minHeight: '60px' }}>
            {lastClick && (
              <div style={{ color: '#f39c12', textAlign: 'center', marginBottom: '5px', fontSize: '14px' }}>
                Last Click: <strong>{lastClick.column}{lastClick.row}</strong> ({lastClick.position.x}, {lastClick.position.y})
              </div>
            )}
            
            {selectedEntity && (
              <div style={{ 
                backgroundColor: '#34495e', 
                padding: '10px', 
                borderRadius: '4px', 
                color: 'white',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {selectedEntity.type === 'player' ? '👤' : '👹'} {selectedEntity.name}
                </div>
                <div>Position: {selectedEntity.position.x}, {selectedEntity.position.y}</div>
                {selectedEntity.type === 'player' && (
                  <div>Color: {(selectedEntity.data as any).color} • Alive: {selectedEntity.data.isAlive ? 'Yes' : 'No'}</div>
                )}
                {selectedEntity.type === 'boss' && (
                  <div>Health: {(selectedEntity.data as any).currentHealth}/{(selectedEntity.data as any).maxHealth} • Phase: {(selectedEntity.data as any).phase}</div>
                )}
              </div>
            )}
          </div>

          <div style={{ color: 'white', textAlign: 'center', marginTop: '10px', fontSize: '12px' }}>
            Click any cell to see coordinates • Click entities for info • Grid: 16×12 (A-P, 1-12)
          </div>
        </>
      )}
    </div>
  );
};