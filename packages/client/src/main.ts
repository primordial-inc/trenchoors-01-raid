import * as PIXI from 'pixi.js';
import { io } from 'socket.io-client';

// Connect to the server
const socket = io('http://localhost:3000');

// Get DOM elements
const buttonElement = document.getElementById('incrementBtn') as HTMLButtonElement;
const statusElement = document.getElementById('status') as HTMLDivElement;
const canvasContainer = document.getElementById('canvas-container') as HTMLDivElement;

// Check if elements exist
if (!buttonElement || !statusElement || !canvasContainer) {
	console.error('Required DOM elements not found!');
	console.error('buttonElement:', buttonElement);
	console.error('statusElement:', statusElement);
	console.error('canvasContainer:', canvasContainer);
	throw new Error('Required DOM elements are missing');
}

// PixiJS setup
const app = new PIXI.Application({
	width: 2048, // 16 * 128 = 2048
	height: 1536, // 12 * 128 = 1536
	backgroundColor: 0x2c3e50, // Dark blue background
	antialias: true,
});

// Add canvas to DOM
canvasContainer.appendChild(app.view as HTMLCanvasElement);

// Grid system
const CELL_SIZE = 128; // 128px per cell (larger for knight sprites)

// Array to store all spawned tiles
const spawnedTiles: PIXI.Sprite[] = [];

// Knight textures storage
let knightTextures: { [key: string]: PIXI.Texture } = {};

// Load knight assets
async function loadKnightAssets(): Promise<void> {
	try {
		console.log('Loading knight assets...');

		// Load all knight colors from Pack2
		const knightColors = ['Blue', 'Red', 'Yellow', 'Purple'];
		const loadPromises = knightColors.map(async (color) => {
			const texture = await PIXI.Assets.load(`assets/Pack2/Factions/Knights/Troops/Pawn/${color}/Pawn_${color}.png`);
			knightTextures[color.toLowerCase()] = texture;
			console.log(`✅ Loaded ${color} knight texture`);
		});

		await Promise.all(loadPromises);
		console.log('🎉 All knight assets loaded successfully!');

	} catch (error) {
		console.error('❌ Failed to load knight assets:', error);
		// Create fallback textures if loading fails
		createFallbackTextures();
	}
}

// Create fallback textures if asset loading fails
function createFallbackTextures(): void {
	console.log('Creating fallback knight textures...');

	const colors = ['blue', 'red', 'yellow', 'purple'];
	const colorValues = [0x1e3a8a, 0xdc2626, 0xeab308, 0xa855f7];

	colors.forEach((color, index) => {
		const graphics = new PIXI.Graphics();

		// Create 192x192 knight sprite
		graphics.beginFill(colorValues[index]);
		graphics.drawRect(0, 0, 192, 192);
		graphics.endFill();

		// Add knight helmet
		graphics.beginFill(0xfbbf24);
		graphics.drawCircle(96, 60, 25);
		graphics.endFill();

		// Add knight body
		graphics.beginFill(colorValues[index]);
		graphics.drawRect(70, 85, 52, 80);
		graphics.endFill();

		// Add knight base
		graphics.beginFill(0x374151);
		graphics.drawRect(60, 165, 72, 20);
		graphics.endFill();

		// Add some details
		graphics.beginFill(0xffffff);
		graphics.drawRect(85, 95, 22, 15);
		graphics.endFill();

		// Generate texture
		const texture = app.renderer.generateTexture(graphics, {
			width: 192,
			height: 192,
			scaleMode: PIXI.SCALE_MODES.NEAREST
		});

		knightTextures[color] = texture;
	});

	console.log('✅ Fallback textures created');
}

// Convert grid coordinates to pixel positions
function gridToPixels(gridX: number, gridY: number): { x: number; y: number } {
	return {
		x: gridX * CELL_SIZE,
		y: gridY * CELL_SIZE
	};
}

// Get random grid position (used by server, not client)
// function getRandomGridPosition(): { x: number; y: number } {
//   return {
//     x: Math.floor(Math.random() * GRID_WIDTH),
//     y: Math.floor(Math.random() * GRID_HEIGHT)
//   };
// }

// Create knight sprite from sprite sheet
function createKnightSprite(color: string, frameIndex: number = 0): PIXI.Sprite {
  const texture = knightTextures[color.toLowerCase()];
  if (!texture) {
    console.warn(`Knight texture for color ${color} not found, using fallback`);
    return createTileSprite(); // Fallback to simple tile
  }
  
  // Assume the sprite sheet has a grid layout
  // Let's try a 4x4 grid (16 frames total) - common for character sprites
  const framesPerRow = 4;
  const frameWidth = texture.width / framesPerRow;
  const frameHeight = texture.height / framesPerRow;
  
  // Calculate which frame to use (limit to available frames)
  const totalFrames = framesPerRow * framesPerRow;
  const actualFrameIndex = frameIndex % totalFrames;
  
  // Calculate frame position in the sprite sheet
  const col = actualFrameIndex % framesPerRow;
  const row = Math.floor(actualFrameIndex / framesPerRow);
  
  // Create frame rectangle
  const frameRect = new PIXI.Rectangle(
    col * frameWidth,
    row * frameHeight,
    frameWidth,
    frameHeight
  );
  
  // Create sprite from specific frame
  const sprite = new PIXI.Sprite(new PIXI.Texture(texture.baseTexture, frameRect));
  
  // Scale sprite to fit grid cell (maintain aspect ratio)
  const maxSize = 128;
  const aspectRatio = frameWidth / frameHeight;
  
  if (aspectRatio > 1) {
    // Wider than tall
    sprite.width = maxSize;
    sprite.height = maxSize / aspectRatio;
  } else {
    // Taller than wide or square
    sprite.height = maxSize;
    sprite.width = maxSize * aspectRatio;
  }
  
  // Center sprite in grid cell
  sprite.anchor.set(0.5, 0.5);
  
  // Remove random rotation for now to see the knight properly
  // sprite.rotation = Math.random() * Math.PI * 2;
  
  return sprite;
}

// Create a simple colored tile sprite (placeholder until we load real assets)
function createTileSprite(): PIXI.Sprite {
	const graphics = new PIXI.Graphics();
	graphics.beginFill(0x4CAF50); // Green color
	graphics.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
	graphics.endFill();

	// Add border
	graphics.lineStyle(2, 0x2E7D32);
	graphics.drawRect(0, 0, CELL_SIZE, CELL_SIZE);

	// Convert graphics to texture and create sprite
	const texture = app.renderer.generateTexture(graphics);
	const sprite = new PIXI.Sprite(texture);

	return sprite;
}

// Spawn a knight at the specified grid position
function spawnKnight(gridX: number, gridY: number, color: string = 'blue', frameIndex: number = 0): void {
	const sprite = createKnightSprite(color, frameIndex);
	const pixelPos = gridToPixels(gridX, gridY);

	// Center sprite in grid cell
	sprite.x = pixelPos.x + CELL_SIZE / 2;
	sprite.y = pixelPos.y + CELL_SIZE / 2;

	app.stage.addChild(sprite);
	spawnedTiles.push(sprite);

	console.log(`Spawned ${color} knight at grid position (${gridX}, ${gridY}) with frame ${frameIndex}`);
}

// Update connection status
function updateStatus(message: string, isConnected: boolean = true) {
	statusElement.textContent = message;
	statusElement.style.color = isConnected ? '#28a745' : '#dc3545';
}

// Socket event listeners
socket.on('connect', () => {
	console.log('Connected to server');
	updateStatus('Connected to server');
});

socket.on('disconnect', () => {
	console.log('Disconnected from server');
	updateStatus('Disconnected from server', false);
});

socket.on('existingTiles', (tiles: Array<{ id: string; x: number; y: number; color: string; frameIndex: number }>) => {
	console.log('Received existing knights:', tiles);
	// Clear existing knights
	spawnedTiles.forEach(tile => app.stage.removeChild(tile));
	spawnedTiles.length = 0;

	// Spawn all existing knights
	tiles.forEach(knightData => {
		spawnKnight(knightData.x, knightData.y, knightData.color, knightData.frameIndex);
	});
});

socket.on('knightSpawned', (knightData: { id: string; x: number; y: number; color: string; frameIndex: number }) => {
	console.log('Knight spawned:', knightData);
	spawnKnight(knightData.x, knightData.y, knightData.color, knightData.frameIndex);
});

// Button click handler
buttonElement.addEventListener('click', () => {
	console.log('Button clicked, emitting buttonClick event');
	socket.emit('buttonClick');
});

// Initialize the game
async function initializeGame() {
	updateStatus('Loading assets...', false);

	try {
		// Load knight assets
		await loadKnightAssets();

		// Update status
		updateStatus('Connected to server');

		console.log('🎮 Game initialized successfully!');
	} catch (error) {
		console.error('Failed to initialize game:', error);
		updateStatus('Failed to load assets', false);
	}
}

// Start the game
initializeGame();
