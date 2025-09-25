import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, ConnectionStatus } from '../types/GameTypes';
import type { GridBattlefield } from '../pixi/GridBattlefield';

interface UseGameStateReturn {
  gameState: GameState | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  setBattlefieldRef: (battlefield: GridBattlefield | null) => void;
}

export function useGameState(serverUrl: string = 'http://localhost:3000'): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const battlefieldRef = useRef<GridBattlefield | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) {
      console.log('Already connected to server');
      return;
    }

    console.log('🔌 Connecting to game server...');
    setConnectionStatus('connecting');
    setError(null);

    try {
      const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      // Debug: Log all socket events
      const originalEmit = socket.emit;
      socket.emit = function(event: string, ...args: any[]) {
        console.log(`📤 Socket emit: ${event}`, args);
        return originalEmit.call(this, event, ...args);
      };

      // Debug: Log all incoming events
      socket.onAny((event: string, ...args: any[]) => {
        console.log(`📥 Socket received: ${event}`, args);
      });

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Connected to game server');
        setConnectionStatus('connected');
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        setConnectionStatus('disconnected');
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          setError('Server disconnected');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        setConnectionStatus('disconnected');
        setError(`Connection failed: ${error.message}`);
      });

      // Game state events
      socket.on('gameStateUpdate', (state: any) => {
        console.log('📡 Game state update received:', state);
        
        // Transform server state to client format
        const transformedState: GameState = {
          status: state.status || 'waiting',
          players: state.players ? Object.values(state.players).map((player: any) => ({
            id: player.id,
            name: player.name,
            position: { x: player.position.x, y: player.position.y },
            color: player.color || 'blue',
            isAlive: player.isAlive !== false,
            damage: player.damage || 0,
            deaths: player.deaths || 0
          })) : [],
          boss: state.boss ? {
            position: { x: state.boss.position.x, y: state.boss.position.y },
            currentHealth: state.boss.currentHealth || 0,
            maxHealth: state.boss.maxHealth || 100,
            phase: state.boss.phase || 1,
            isAlive: state.boss.isAlive !== false
          } : null,
          gridWidth: state.gridWidth || 16,
          gridHeight: state.gridHeight || 12,
          tickRate: state.tickRate || 10
        };
        
        setGameState(transformedState);
      });

      // Player events
      socket.on('playerJoined', (player: any) => {
        console.log('👤 Player joined:', player);
        // Game state will be updated via gameStateUpdate
      });

      socket.on('playerMoved', (playerId: string, position: any) => {
        console.log('🚶 Player moved:', playerId, position);
        console.log('🎬 Battlefield ref available:', !!battlefieldRef.current);
        
        // 🔥 FIX: Don't update game state immediately if we're going to animate
        // Instead, let the animation complete first, then update
        
        if (battlefieldRef.current) {
          console.log('🎬 Starting smooth movement animation...');
          
          // Start the smooth movement animation
          battlefieldRef.current.movePlayerSmooth(playerId, { x: position.x, y: position.y })
            .then(() => {
              console.log('🎬 Smooth movement completed, updating game state');
              
              // 🔥 ONLY update game state AFTER animation completes
              setGameState(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  players: prev.players.map(p => 
                    p.id === playerId 
                      ? { ...p, position: { x: position.x, y: position.y } }
                      : p
                  )
                };
              });
            })
            .catch((error) => {
              console.error('🎬 Smooth movement failed:', error);
              
              // Fallback: update game state immediately if animation fails
              setGameState(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  players: prev.players.map(p => 
                    p.id === playerId 
                      ? { ...p, position: { x: position.x, y: position.y } }
                      : p
                  )
                };
              });
            });
        } else {
          console.warn('🎬 Battlefield ref not available, updating state immediately');
          
          // Fallback: update immediately if no battlefield reference
          setGameState(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map(p => 
                p.id === playerId 
                  ? { ...p, position: { x: position.x, y: position.y } }
                  : p
              )
            };
          });
        }
      });


      socket.on('playerDied', (playerId: string) => {
        console.log('💀 Player died:', playerId);
        
        // Update player state in current state
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map(p => 
              p.id === playerId 
                ? { ...p, isAlive: false }
                : p
            )
          };
        });
        
        // 🎬 NEW: Trigger death animation
        if (battlefieldRef.current) {
          battlefieldRef.current.setPlayerDead(playerId);
        }
      });

      // 🎬 NEW: Player attack event
      socket.on('playerAttacked', (playerId: string, target: any) => {
        console.log('⚔️ Player attacked:', playerId, target);
        console.log('🎬 Battlefield ref available for attack:', !!battlefieldRef.current);
        
        // 🎬 NEW: Trigger attack animation
        if (battlefieldRef.current) {
          console.log('🎬 Calling triggerPlayerAttack...');
          battlefieldRef.current.triggerPlayerAttack(playerId);
        } else {
          console.warn('🎬 Battlefield ref not available for attack animation');
        }
      });

      // 🎬 NEW: Player respawned event
      socket.on('playerRespawned', (playerId: string) => {
        console.log('❤️ Player respawned:', playerId);
        
        // Update player state in current state
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map(p => 
              p.id === playerId 
                ? { ...p, isAlive: true }
                : p
            )
          };
        });
        
        // 🎬 NEW: Trigger alive animation
        if (battlefieldRef.current) {
          battlefieldRef.current.setPlayerAlive(playerId);
        }
      });

      // Boss events
      socket.on('bossSpawned', (boss: any) => {
        console.log('👹 Boss spawned:', boss);
        setGameState(prev => prev ? {
          ...prev,
          boss: {
            position: { x: boss.position.x, y: boss.position.y },
            currentHealth: boss.currentHealth || boss.maxHealth || 100,
            maxHealth: boss.maxHealth || 100,
            phase: boss.phase || 1,
            isAlive: true
          }
        } : null);
      });

      socket.on('bossDamaged', (damage: number, newHealth: number) => {
        console.log('⚔️ Boss damaged:', damage, newHealth);
        setGameState(prev => prev && prev.boss ? {
          ...prev,
          boss: {
            ...prev.boss,
            currentHealth: newHealth,
            isAlive: newHealth > 0
          }
        } : prev);
        
        // 🎬 NEW: Trigger boss attack animation (when taking damage)
        if (battlefieldRef.current) {
          battlefieldRef.current.triggerBossAttack();
        }
      });

      socket.on('bossDied', () => {
        console.log('💀 Boss died');
        setGameState(prev => prev && prev.boss ? {
          ...prev,
          boss: {
            ...prev.boss,
            isAlive: false,
            currentHealth: 0
          }
        } : prev);
        
        // 🎬 NEW: Trigger boss death animation
        if (battlefieldRef.current) {
          battlefieldRef.current.setBossDead();
        }
      });

      // Game events
      socket.on('gameStarted', () => {
        console.log('🎮 Game started');
        setGameState(prev => prev ? { ...prev, status: 'active' } : null);
      });

      socket.on('gameEnded', (result: any) => {
        console.log('🏁 Game ended:', result);
        setGameState(prev => prev ? { ...prev, status: 'finished' } : null);
      });

      // Boss mechanic events
      socket.on('bossMechanic', (mechanic: any) => {
      console.log('⚡ Boss mechanic triggered:', mechanic);
      console.log('🎬 Battlefield ref available for mechanic:', !!battlefieldRef.current);
      console.log('📊 Full mechanic data structure:', JSON.stringify(mechanic, null, 2));
        
        if (!battlefieldRef.current) {
          console.warn('⚠️ Battlefield ref not available for mechanic warning');
          return;
        }
        
        // Extract mechanic data from server format
        const mechanicData = mechanic.data || {};
        const warningDuration = mechanic.warningTime || 4000;
        
        switch (mechanic.type) {
          case 'meteor_strike':
            // Server sends mechanic.data.targets (array of positions)
            const targets = mechanicData.targets || [];
            console.log('🚀 Showing meteor strike warning:', targets);
            
            // Safety check: only show warning if we have valid targets
            if (targets.length > 0 && targets.every((target: any) => target && typeof target.x === 'number' && typeof target.y === 'number')) {
              battlefieldRef.current.showMeteorWarning(targets, warningDuration);
            } else {
              console.warn('⚠️ Invalid meteor targets received:', targets);
              return;
            }
            
            // Auto-trigger activation after warning duration
            setTimeout(() => {
              console.log('💥 Auto-activating meteor strike:', targets);
              battlefieldRef.current?.activateMeteorStrike(targets);
            }, warningDuration);
            break;
            
          case 'lava_wave':
            // Server sends mechanic.data.direction and mechanic.data.rowOrColumn
            const { direction, rowOrColumn } = mechanicData;
            console.log('🌊 Showing lava wave warning:', { direction, rowOrColumn });
            
            // Safety check: ensure we have valid direction and position
            if (!direction || typeof rowOrColumn !== 'number') {
              console.warn('⚠️ Invalid lava wave data received:', { direction, rowOrColumn });
              return;
            }
            
            if (direction === 'vertical' && rowOrColumn !== undefined) {
              battlefieldRef.current.showLavaWaveWarning(rowOrColumn, warningDuration);
              // Auto-trigger activation after warning duration
              setTimeout(() => {
                console.log('🌊 Auto-activating lava wave column:', rowOrColumn);
                battlefieldRef.current?.activateLavaWave(rowOrColumn);
              }, warningDuration);
            } else if (direction === 'horizontal' && rowOrColumn !== undefined) {
              battlefieldRef.current.showLavaWaveWarningRow(rowOrColumn, warningDuration);
              // Auto-trigger activation after warning duration
              setTimeout(() => {
                console.log('🌊 Auto-activating lava wave row:', rowOrColumn);
                battlefieldRef.current?.activateLavaWave(undefined, rowOrColumn);
              }, warningDuration);
            }
            break;
        }
      });

      


      // Admin events
      socket.on('adminMessage', (message: string) => {
        console.log('📢 Admin message:', message);
      });

      // Legacy events (for compatibility)
      socket.on('existingTiles', (knights: any[]) => {
        console.log('🏰 Existing tiles:', knights);
      });

      socket.on('knightSpawned', (knight: any) => {
        console.log('🏰 Knight spawned:', knight);
      });

    } catch (error) {
      console.error('❌ Failed to create socket connection:', error);
      setConnectionStatus('disconnected');
      setError(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting from server...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionStatus('disconnected');
    setGameState(null);
    setError(null);
  };

  const setBattlefieldRef = (battlefield: GridBattlefield | null) => {
    battlefieldRef.current = battlefield;
    console.log('🎬 Battlefield reference set for animation triggers');
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [serverUrl]);

  // Handle window focus/blur for reconnection
  useEffect(() => {
    const handleFocus = () => {
      if (connectionStatus === 'disconnected') {
        console.log('🔄 Window focused, attempting to reconnect...');
        connect();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [connectionStatus]);

  return {
    gameState,
    connectionStatus,
    error,
    connect,
    disconnect,
    setBattlefieldRef
  };
}
