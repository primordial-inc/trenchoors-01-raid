import React, { useEffect, useRef, useState } from 'react';
import { GridBattlefield } from '../pixi/GridBattlefield';
import { useGameState } from '../hooks/useGameState';
import type { GridClickEvent } from '../types/GridTypes';
import type { EntityInfo, GridPosition } from '../types/GameTypes';

export const GridTestComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const battlefieldRef = useRef<GridBattlefield | null>(null);
  const isInitializedRef = useRef(false);
  
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

  // Callback ref to initialize when container is mounted
  const containerCallbackRef = (element: HTMLDivElement | null) => {
    containerRef.current = element;
    
    // Initialize immediately when container is available
    if (element && !isInitializedRef.current) {
      console.log('🔄 Container mounted, scheduling initialization...');
      // Use requestAnimationFrame to ensure DOM is fully ready
      requestAnimationFrame(() => {
        if (containerRef.current && !isInitializedRef.current) {
          initializeBattlefield();
        }
      });
    }
  };

  // Initialize battlefield function
  const initializeBattlefield = async () => {
    if (isInitializedRef.current || !containerRef.current) {
      return;
    }
    
    console.log('🔄 Starting battlefield initialization...');
    isInitializedRef.current = true;

    try {
      console.log('🚀 Starting GridTest initialization...');
      
      // Clean up any existing battlefield first
      if (battlefieldRef.current) {
        console.log('🧹 Cleaning up existing battlefield...');
        battlefieldRef.current.destroy();
        battlefieldRef.current = null;
      }

      // Clear the container completely
      if (containerRef.current) {
        console.log('🗑️ Clearing container...');
        containerRef.current.innerHTML = '';
      }

      console.log('🏗️ Creating new GridBattlefield...');
      // Initialize Grid Battlefield with larger cells
      const battlefield = new GridBattlefield({
        showLabels: true,
        showGrid: true,
        cellSize: 60, // Increased from 50 to 60
        backgroundColor: 0x90EE90, // Light green
        gridColor: 0x2E8B57, // Dark green for contrast
        labelColor: 0x2E8B57, // Dark green labels
      });
      
      console.log('⚡ Initializing battlefield...');
      await battlefield.init(containerRef.current!, 1200, 800); // Increased canvas size
      console.log('✅ Battlefield initialization complete');
      
      // Set click handlers
      battlefield.setClickHandler((event: GridClickEvent) => {
        setLastClick(event);
        console.log(`🎯 Clicked: ${event.column}${event.row} (${event.position.x}, ${event.position.y})`);
        
        // Check if there's an entity at this position
        const entity = battlefield.getEntityAtPosition(event.position);
        setSelectedEntity(entity);
      });

      battlefield.setEntityClickHandler((entity: EntityInfo) => {
        setSelectedEntity(entity);
        console.log(`🎮 Entity clicked:`, entity);
      });

      battlefieldRef.current = battlefield;
      setIsLoaded(true);

    } catch (error) {
      console.error('❌ Failed to initialize Grid test:', error);
      isInitializedRef.current = false; // Reset flag on error
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (battlefieldRef.current) {
        console.log('🧹 Cleaning up battlefield on unmount...');
        battlefieldRef.current.destroy();
        battlefieldRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []);

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
  const spawnPlayer = () => {
    if (!battlefieldRef.current) return;

    const playerId = `player_${playerCounter}`;
    const colors = ['blue', 'red', 'yellow', 'green', 'purple', 'orange', 'pink', 'cyan'];
    const color = colors[(playerCounter - 1) % colors.length];
    const position: GridPosition = { x: Math.floor(Math.random() * 16), y: Math.floor(Math.random() * 12) };

    battlefieldRef.current.spawnPlayer(playerId, position, color, `Player ${playerCounter}`);
    
    setManualPlayers(prev => new Map(prev).set(playerId, { position, color, name: `Player ${playerCounter}`, isAlive: true }));
    setPlayerCounter(prev => prev + 1);
  };

  const spawnBoss = () => {
    if (!battlefieldRef.current) return;

    const position: GridPosition = { x: 8, y: 6 }; // Center of grid
    battlefieldRef.current.spawnBoss(position);
    battlefieldRef.current.updateBoss(100, 100, 1, true);
    
    setManualBoss({ position, health: 100, maxHealth: 100, phase: 1, isAlive: true });
  };

  const clearAllEntities = () => {
    if (!battlefieldRef.current) return;

    battlefieldRef.current.clearAllEntities();
    setManualPlayers(new Map());
    setManualBoss(null);
    setSelectedEntity(null);
  };

  const damageBoss = () => {
    if (!battlefieldRef.current || !manualBoss) return;

    const newHealth = Math.max(0, manualBoss.health - 20);
    const newPhase = newHealth > 66 ? 1 : newHealth > 33 ? 2 : 3;
    
    battlefieldRef.current.updateBoss(newHealth, manualBoss.maxHealth, newPhase, newHealth > 0);
    
    setManualBoss(prev => prev ? { ...prev, health: newHealth, phase: newPhase, isAlive: newHealth > 0 } : null);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#27ae60';
      case 'connecting': return '#f39c12';
      case 'disconnected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getConnectionStatusEmoji = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '8px' }}>
      {/* Always render the container div so the callback ref can work */}
      <div 
        ref={containerCallbackRef} 
        style={{ 
          border: '2px solid #2E8B57', 
          borderRadius: '4px', 
          overflow: 'hidden',
          backgroundColor: '#90EE90',
          minHeight: '700px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }} 
      >
        {!isLoaded && (
          <div style={{ color: '#2E8B57', textAlign: 'center', padding: '20px' }}>
            🔄 Initializing battlefield...
          </div>
        )}
      </div>
      
      {isLoaded && (
        <>
          {/* Mode Selection */}
          <div style={{ marginBottom: '15px', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
              <button
                onClick={() => setMode('manual')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: mode === 'manual' ? '#27ae60' : '#7f8c8d',
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
                  padding: '8px 16px',
                  backgroundColor: mode === 'server' ? '#27ae60' : '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📡 Server Mode
              </button>
            </div>
            
            {/* Connection Status */}
            {mode === 'server' && (
              <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                <span style={{ color: getConnectionStatusColor(), fontWeight: 'bold' }}>
                  {getConnectionStatusEmoji()} {connectionStatus.toUpperCase()}
                </span>
                {error && (
                  <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Game Info Panel */}
          {mode === 'server' && gameState && (
            <div style={{ 
              backgroundColor: '#34495e', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              color: 'white',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>Status: <strong>{gameState.status}</strong></div>
                <div>Players: <strong>{gameState.players.length}</strong></div>
                <div>Alive: <strong>{gameState.players.filter(p => p.isAlive).length}</strong></div>
                {gameState.boss && (
                  <div>Boss: <strong>{gameState.boss.currentHealth}/{gameState.boss.maxHealth} (Phase {gameState.boss.phase})</strong></div>
                )}
                <div>Tick Rate: <strong>{gameState.tickRate}/s</strong></div>
              </div>
            </div>
          )}

          {/* Manual Mode Controls */}
          {mode === 'manual' && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={spawnPlayer} style={{ padding: '8px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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
