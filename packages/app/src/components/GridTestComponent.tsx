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
  
  // Terrain controls
  const [terrainType, setTerrainType] = useState<'mixed' | 'terrain_flat'>('mixed');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  
  // Sprite loading status
  const [spritesLoaded, setSpritesLoaded] = useState<boolean>(false);
  const [spriteLoadingStatus, setSpriteLoadingStatus] = useState<string>('Loading sprites...');
  
  // Server connection
  const { gameState, connectionStatus, error, setBattlefieldRef } = useGameState();
  
  // Manual mode state
  const [, setManualPlayers] = useState<Map<string, { position: GridPosition; color: string; name: string; isAlive: boolean }>>(new Map());
  const [manualBoss, setManualBoss] = useState<{ position: GridPosition; health: number; maxHealth: number; phase: number; isAlive: boolean } | null>(null);
  const [playerCounter, setPlayerCounter] = useState(1);
  
  // Mechanic system state
  const [activeWarnings, setActiveWarnings] = useState<string[]>([]);

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

  // Monitor sprite loading status and set battlefield reference
  useEffect(() => {
    if (battlefieldRef.current && isLoaded) {
      console.log('🎬 Setting battlefield reference for server events');
      // Set battlefield reference for animation triggers
      setBattlefieldRef(battlefieldRef.current);
      
      // Check if sprites are loaded
      const checkSpriteStatus = () => {
        // For now, assume sprites are loaded after battlefield initialization
        // In a real implementation, you'd check the sprite entity manager status
        setSpritesLoaded(true);
        setSpriteLoadingStatus('✅ Sprites loaded successfully');
      };

      // Check after a short delay to allow sprite loading
      const timer = setTimeout(checkSpriteStatus, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, setBattlefieldRef]);

  // Additional effect to ensure battlefield ref is set when mode changes to server
  useEffect(() => {
    if (mode === 'server' && battlefieldRef.current && isLoaded) {
      console.log('🌐 Server mode: Ensuring battlefield reference is set');
      setBattlefieldRef(battlefieldRef.current);
    }
  }, [mode, isLoaded, setBattlefieldRef]);

  // Terrain control functions
  const regenerateTerrain = useCallback(async () => {
    if (battlefieldRef.current) {
      try {
        await battlefieldRef.current.regenerateTerrain(terrainType);
        console.log(`🔄 Regenerated terrain: ${terrainType}`);
      } catch (error) {
        console.error('❌ Failed to regenerate terrain:', error);
      }
    }
  }, [terrainType]);

  const toggleGrid = useCallback(() => {
    if (battlefieldRef.current) {
      battlefieldRef.current.updateConfig({ showGrid: !showGrid });
      setShowGrid(!showGrid);
    }
  }, [showGrid]);

  // Manual mode functions
  const spawnPlayer = useCallback(async () => {
    if (!battlefieldRef.current || !spritesLoaded) return;

    const playerId = `player_${playerCounter}`;
    const colors = ['blue', 'red', 'yellow', 'green', 'purple', 'orange', 'pink', 'cyan'];
    const color = colors[(playerCounter - 1) % colors.length];
    const position: GridPosition = { x: Math.floor(Math.random() * 16), y: Math.floor(Math.random() * 12) };

    try {
      await battlefieldRef.current.spawnPlayer(playerId, position, color, `Player ${playerCounter}`);
      setManualPlayers(prev => new Map(prev).set(playerId, { position, color, name: `Player ${playerCounter}`, isAlive: true }));
      setPlayerCounter(prev => prev + 1);
    } catch (error) {
      console.error('Failed to spawn player:', error);
    }
  }, [playerCounter, spritesLoaded]);

  const spawnBoss = useCallback(async () => {
    if (!battlefieldRef.current || !spritesLoaded) return;

    const position: GridPosition = { x: 8, y: 6 };
    
    try {
      await battlefieldRef.current.spawnBoss(position);
      battlefieldRef.current.updateBoss(100, 100, 1, true);
      setManualBoss({ position, health: 100, maxHealth: 100, phase: 1, isAlive: true });
    } catch (error) {
      console.error('Failed to spawn boss:', error);
    }
  }, [spritesLoaded]);

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

  // Mechanic testing functions
  const testMeteorStrike = useCallback(() => {
    if (!battlefieldRef.current) return;
    
    // Create 2x2 meteor impact zones around a random position
    const centerX = Math.floor(Math.random() * 14) + 1; // Avoid edges
    const centerY = Math.floor(Math.random() * 10) + 1;
    
    const impactZones: GridPosition[] = [
      { x: centerX, y: centerY },
      { x: centerX + 1, y: centerY },
      { x: centerX, y: centerY + 1 },
      { x: centerX + 1, y: centerY + 1 }
    ];
    
    const warningId = battlefieldRef.current.showMeteorWarning(impactZones, 4000);
    setActiveWarnings(prev => [...prev, warningId]);
    console.log(`⚡ Meteor strike warning created: ${warningId} at (${centerX}, ${centerY})`);
    
    // Simulate activation after 4 seconds
    setTimeout(() => {
      battlefieldRef.current?.activateMeteorStrike(impactZones);
      setActiveWarnings(prev => prev.filter(id => id !== warningId));
    }, 4000);
  }, []);

  const testLavaWaveColumn = useCallback(() => {
    if (!battlefieldRef.current) return;
    
    const column = Math.floor(Math.random() * 16);
    const warningId = battlefieldRef.current.showLavaWaveWarning(column, 5000);
    setActiveWarnings(prev => [...prev, warningId]);
    console.log(`🌊 Lava wave column warning created: ${warningId} for column ${column}`);
    
    // Simulate activation after 5 seconds
    setTimeout(() => {
      battlefieldRef.current?.activateLavaWave(column);
      setActiveWarnings(prev => prev.filter(id => id !== warningId));
    }, 5000);
  }, []);

  const testLavaWaveRow = useCallback(() => {
    if (!battlefieldRef.current) return;
    
    const row = Math.floor(Math.random() * 12);
    const warningId = battlefieldRef.current.showLavaWaveWarningRow(row, 5000);
    setActiveWarnings(prev => [...prev, warningId]);
    console.log(`🌊 Lava wave row warning created: ${warningId} for row ${row}`);
    
    // Simulate activation after 5 seconds
    setTimeout(() => {
      battlefieldRef.current?.activateLavaWave(undefined, row);
      setActiveWarnings(prev => prev.filter(id => id !== warningId));
    }, 5000);
  }, []);

  const clearAllMechanics = useCallback(() => {
    if (!battlefieldRef.current) return;
    
    battlefieldRef.current.clearAllMechanicWarnings();
    battlefieldRef.current.clearAllMechanicEffects();
    setActiveWarnings([]);
    console.log('🗑️ Cleared all mechanic warnings and effects');
  }, []);

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

      {/* Terrain Controls */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h3 style={{ color: 'white', marginBottom: '10px' }}>🌍 Terrain Controls</h3>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label style={{ color: 'white', fontSize: '14px' }}>Terrain:</label>
            <select
              value={terrainType}
              onChange={(e) => setTerrainType(e.target.value as 'mixed' | 'terrain_flat')}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                border: '1px solid #bdc3c7',
                backgroundColor: 'white',
                color: '#2c3e50'
              }}
            >
              <option value="mixed">Mixed Terrain</option>
              <option value="terrain_flat">Flat Terrain</option>
            </select>
          </div>
          
          <button
            onClick={regenerateTerrain}
            style={{
              padding: '8px 16px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Regenerate
          </button>
          
          <button
            onClick={toggleGrid}
            style={{
              padding: '8px 16px',
              backgroundColor: showGrid ? '#3498db' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📐 {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
        </div>
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
          
          {/* Debug Info */}
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#95a5a6',
            backgroundColor: '#2c3e50',
            padding: '8px',
            borderRadius: '4px'
          }}>
            <div>Battlefield Loaded: {isLoaded ? '✅' : '❌'}</div>
            <div>Battlefield Ref: {battlefieldRef.current ? '✅' : '❌'}</div>
            <div>Sprites Loaded: {spritesLoaded ? '✅' : '❌'}</div>
            
            {/* Debug Test Button */}
            {battlefieldRef.current && (
              <button 
                onClick={() => {
                  console.log('🧪 Testing mechanic directly on battlefield');
                  const centerX = 8;
                  const centerY = 6;
                  const impactZones = [
                    { x: centerX, y: centerY },
                    { x: centerX + 1, y: centerY },
                    { x: centerX, y: centerY + 1 },
                    { x: centerX + 1, y: centerY + 1 }
                  ];
                  battlefieldRef.current?.showMeteorWarning(impactZones, 3000);
                  setTimeout(() => {
                    battlefieldRef.current?.activateMeteorStrike(impactZones);
                  }, 3000);
                }}
                style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                🧪 Test Mechanic
              </button>
            )}
          </div>
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
          {/* Sprite Loading Status */}
          {isLoaded && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>🎭 Sprite Status</h3>
              <div style={{ 
                backgroundColor: spritesLoaded ? '#27ae60' : '#f39c12', 
                color: 'white', 
                padding: '10px', 
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                {spriteLoadingStatus}
              </div>
            </div>
          )}

          {/* Manual Mode Controls */}
          {mode === 'manual' && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>🎮 Manual Controls</h3>
              
              {/* Entity Controls */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#f39c12', marginBottom: '10px' }}>👥 Entity Management</h4>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={spawnPlayer} 
                    disabled={!spritesLoaded}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: spritesLoaded ? '#27ae60' : '#95a5a6', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: spritesLoaded ? 'pointer' : 'not-allowed'
                    }}
                  >
                    👤 Spawn Player
                  </button>
                  <button 
                    onClick={spawnBoss} 
                    disabled={!spritesLoaded}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: spritesLoaded ? '#e74c3c' : '#95a5a6', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: spritesLoaded ? 'pointer' : 'not-allowed'
                    }}
                  >
                    👹 Spawn Boss
                  </button>
                  <button onClick={damageBoss} disabled={!manualBoss} style={{ padding: '8px 16px', backgroundColor: manualBoss ? '#f39c12' : '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px', cursor: manualBoss ? 'pointer' : 'not-allowed' }}>
                    ⚔️ Damage Boss (-20)
                  </button>
                  <button onClick={clearAllEntities} style={{ padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    🗑️ Clear All Entities
                  </button>
                  <button 
                    onClick={() => {
                      // Test animation system
                      if (battlefieldRef.current) {
                        const playerIds = battlefieldRef.current.getPlayerIds();
                        if (playerIds.length > 0) {
                          const playerId = playerIds[0];
                          console.log('🧪 Testing attack animation for:', playerId);
                          battlefieldRef.current.triggerPlayerAttack(playerId);
                        } else {
                          console.log('🧪 No players found to test animation');
                        }
                      }
                    }}
                    style={{ padding: '8px 16px', backgroundColor: '#9b59b6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🧪 Test Attack
                  </button>
                </div>
              </div>

              {/* Mechanic Controls */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#e74c3c', marginBottom: '10px' }}>⚡ Boss Mechanics</h4>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={testMeteorStrike}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#e74c3c', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer'
                    }}
                  >
                    🚀 Meteor Strike (4s)
                  </button>
                  <button 
                    onClick={testLavaWaveColumn}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#ff8800', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer'
                    }}
                  >
                    🌊 Lava Column (5s)
                  </button>
                  <button 
                    onClick={testLavaWaveRow}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#ff6600', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer'
                    }}
                  >
                    🌊 Lava Row (5s)
                  </button>
                  <button 
                    onClick={clearAllMechanics}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#95a5a6', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Clear Mechanics
                  </button>
                </div>
                
                {/* Active Warnings Status */}
                {activeWarnings.length > 0 && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '8px 16px', 
                    backgroundColor: '#f39c12', 
                    color: 'white', 
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    ⚠️ Active Warnings: {activeWarnings.length}
                  </div>
                )}
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