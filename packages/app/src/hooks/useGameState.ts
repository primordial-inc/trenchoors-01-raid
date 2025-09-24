import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, ConnectionStatus } from '../types/GameTypes';

interface UseGameStateReturn {
  gameState: GameState | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export function useGameState(serverUrl: string = 'http://localhost:3000'): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

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
        // Update player position in current state
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
    disconnect
  };
}
