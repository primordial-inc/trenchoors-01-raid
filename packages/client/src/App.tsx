import { GameContainer } from './components/GameContainer';
import type { GameError } from './types/ClientTypes';

function App() {
  const handleError = (error: GameError) => {
    console.error('Game error:', error);
    // In a real app, you might want to send this to an error reporting service
  };

  const handleGameStateUpdate = (gameState: any) => {
    console.log('Game state updated:', gameState);
    // Handle game state updates if needed
  };

  return (
    <GameContainer
      config={{
        serverUrl: 'ws://localhost:3000',
        useMockData: false, // Set to true for development without server
        showFPS: true,
        enablePerformanceMonitoring: true
      }}
      onError={handleError}
      onGameStateUpdate={handleGameStateUpdate}
    />
  );
}

export default App;
