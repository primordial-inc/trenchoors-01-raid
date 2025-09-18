// Server for the pumpfun game
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameEngine } from '@pumpfun-game/core';

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

app.use(cors());
app.use(express.json());

const gameEngine = new GameEngine();

// Global counter for the button test
let globalCounter = 0;

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current counter value to newly connected client
  socket.emit('counterUpdate', globalCounter);
  
  // Listen for button clicks from clients
  socket.on('buttonClick', () => {
    globalCounter++;
    console.log(`Counter incremented to: ${globalCounter}`);
    
    // Broadcast updated counter to all connected clients
    io.emit('counterUpdate', globalCounter);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	gameEngine.start();
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
