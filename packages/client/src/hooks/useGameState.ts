import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '@pumpfun-game/shared';
import { createMockGameState, simulateGameStateUpdate } from '../utils/MockData';

export interface ConnectionState {
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  serverUrl: string;
  lastConnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

export interface GameStateHook {
  gameState: GameState | null;
  connectionState: ConnectionState;
  isLoading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendCommand: (command: any) => void;
  useMockData: boolean;
  setUseMockData: (useMock: boolean) => void;
}

const DEFAULT_SERVER_URL = 'ws://localhost:3000';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

export const useGameState = (serverUrl: string = DEFAULT_SERVER_URL): GameStateHook => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    serverUrl,
    reconnectAttempts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(true); // Start with mock data for testing
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const mockDataIntervalRef = useRef<number | null>(null);

  // Initialize mock data when useMockData is true
  useEffect(() => {
    if (useMockData) {
      const initialMockState = createMockGameState();
      setGameState(initialMockState);
      setIsLoading(false);
      setError(null);
      
      // Simulate game state updates every 2 seconds
      mockDataIntervalRef.current = setInterval(() => {
        setGameState(prevState => {
          if (prevState) {
            return simulateGameStateUpdate(prevState);
          }
          return prevState;
        });
      }, 2000);
      
      return () => {
        if (mockDataIntervalRef.current) {
          clearInterval(mockDataIntervalRef.current);
        }
      };
    }
  }, [useMockData]);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (useMockData || socketRef.current?.connected) {
      return;
    }

    setConnectionState(prev => ({ ...prev, status: 'connecting' }));
    setIsLoading(true);
    setError(null);

    try {
      const socket = io(serverUrl, {
        transports: ['websocket'],
        timeout: 5000,
        reconnection: false // We'll handle reconnection manually
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to game server');
        setConnectionState({
          status: 'connected',
          serverUrl,
          lastConnected: new Date(),
          reconnectAttempts: 0
        });
        setIsLoading(false);
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from game server:', reason);
        setConnectionState(prev => ({
          ...prev,
          status: 'disconnected',
          error: reason
        }));
        setIsLoading(false);
        
        // Attempt reconnection if not manually disconnected
        if (reason !== 'io client disconnect') {
          attemptReconnection();
        }
      });

      socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setConnectionState(prev => ({
          ...prev,
          status: 'error',
          error: err.message
        }));
        setIsLoading(false);
        setError(`Connection failed: ${err.message}`);
        
        // Attempt reconnection
        attemptReconnection();
      });

      socket.on('gameStateUpdate', (newGameState: GameState) => {
        console.log('Received game state update:', newGameState);
        setGameState(newGameState);
        setIsLoading(false);
        setError(null);
      });

      socket.on('bossMechanic', (mechanic: any) => {
        console.log('Boss mechanic triggered:', mechanic);
        // Handle mechanic events (could trigger visual effects)
      });

      socket.on('adminMessage', (message: string) => {
        console.log('Admin message:', message);
        // Handle admin announcements
      });

      socket.on('playerDied', (playerId: string) => {
        console.log('Player died:', playerId);
        // Handle player death events
      });

    } catch (err) {
      console.error('Failed to create socket connection:', err);
      setError(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      }));
    }
  }, [serverUrl, useMockData]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnectionState(prev => ({
      ...prev,
      status: 'disconnected'
    }));
  }, []);

  // Send command to server
  const sendCommand = useCallback((command: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('command', command);
    } else if (useMockData) {
      console.log('Mock command sent:', command);
      // In mock mode, we could simulate command processing
    } else {
      console.warn('Cannot send command: not connected to server');
    }
  }, [useMockData]);

  // Attempt reconnection with exponential backoff
  const attemptReconnection = useCallback(() => {
    if (useMockData) return;
    
    setConnectionState(prev => {
      if (prev.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        return {
          ...prev,
          status: 'error',
          error: 'Max reconnection attempts reached'
        };
      }
      
      const delay = RECONNECT_DELAY * Math.pow(2, prev.reconnectAttempts);
      console.log(`Attempting reconnection in ${delay}ms (attempt ${prev.reconnectAttempts + 1})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
      
      return {
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1
      };
    });
  }, [connect, useMockData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (mockDataIntervalRef.current) {
        clearInterval(mockDataIntervalRef.current);
      }
    };
  }, [disconnect]);

  // Auto-connect on mount (unless using mock data)
  useEffect(() => {
    if (!useMockData) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect, useMockData]);

  return {
    gameState,
    connectionState,
    isLoading,
    error,
    connect,
    disconnect,
    sendCommand,
    useMockData,
    setUseMockData
  };
};
