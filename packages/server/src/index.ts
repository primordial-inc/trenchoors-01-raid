// Server for the pumpfun game
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameEngine } from './engine/GameEngine';
import { GameStateManager } from './engine/GameState';
import { CommandRouter } from './input/CommandRouter';
import { SocketManager } from './networking/SocketManager';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@pumpfun-game/shared';

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

app.use(cors());
app.use(express.json());

// Initialize game components
const gameState = new GameStateManager();
const commandRouter = new CommandRouter(gameState);
const socketManager = new SocketManager(io, gameState, commandRouter);
const gameEngine = new GameEngine(gameState, commandRouter);

// Initialize game engine with socket manager
gameEngine.initialize(socketManager);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    gameRunning: gameEngine.isGameRunning(),
    playerCount: gameState.getPlayerCount(),
    gameStatus: gameState.getStatus()
  });
});

// Admin endpoints
app.get('/admin/game-state', (req: Request, res: Response) => {
  const mechanicsData = gameEngine.getMechanicsManager().serialize();
  res.json(gameState.serialize(mechanicsData));
});

app.post('/admin/start-game', (req: Request, res: Response) => {
  try {
    gameEngine.start();
    res.json({ success: true, message: 'Game started' });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/admin/stop-game', (req: Request, res: Response) => {
  try {
    gameEngine.stop();
    res.json({ success: true, message: 'Game stopped' });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/admin/reset-game', (req: Request, res: Response) => {
  try {
    gameEngine.reset();
    res.json({ success: true, message: 'Game reset' });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/admin/pause-game', (req: Request, res: Response) => {
  try {
    gameEngine.pause();
    res.json({ success: true, message: 'Game paused' });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/admin/resume-game', (req: Request, res: Response) => {
  try {
    gameEngine.resume();
    res.json({ success: true, message: 'Game resumed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Configuration endpoints
app.post('/admin/config/tick-rate', (req: Request, res: Response) => {
  try {
    const { tickRate } = req.body;
    if (typeof tickRate !== 'number') {
      return res.status(400).json({ success: false, message: 'tickRate must be a number' });
    }
    
    gameEngine.updateTickRate(tickRate);
    res.json({ success: true, message: `Tick rate updated to ${tickRate}ms` });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`Health check: http://localhost:${PORT}/health`);
	console.log(`Admin panel: http://localhost:${PORT}/admin/game-state`);
	console.log(`Game status: ${gameState.getStatus()}`);
	console.log(`Use the admin CLI to control the game: npm run admin`);
});

server.on('error', (err: any) => {
	if (err.code === 'EADDRINUSE') {
		console.error(`Port ${PORT} is already in use. Please kill the process using this port or use a different port.`);
		console.error('You can kill the process with: lsof -ti:3000 | xargs kill -9');
		process.exit(1);
	} else {
		console.error('Server error:', err);
		process.exit(1);
	}
});
