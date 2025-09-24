import { Application, Container, Sprite, Graphics, Text } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { GameState } from '@pumpfun-game/shared';
import { DEFAULT_GRID_CONFIG, gridToPixels, getCellSize } from '../utils/GridUtils';
import type { GridConfig } from '../utils/GridUtils';

export interface RendererConfig {
	canvasWidth: number;
	canvasHeight: number;
	backgroundColor?: number;
	antialias?: boolean;
	resolution?: number;
	gridConfig?: GridConfig;
}

export interface PerformanceStats {
	fps: number;
	frameTime: number;
	drawCalls: number;
	sprites: number;
}

export class GameRenderer {
	private app: Application;
	private config: RendererConfig;
	private gridConfig: GridConfig;
	private isAppInitialized: boolean = false; // 🔧 FIX: Track initialization state

	// Container layers for organized rendering
	private terrainLayer!: Container;
	private gameObjectLayer!: Container;
	private mechanicsLayer!: Container;
	private effectsLayer!: Container;
	private uiLayer!: Container;

	// Game state
	private currentGameState: GameState | null = null;

	// Performance monitoring
	private performanceStats: PerformanceStats = {
		fps: 0,
		frameTime: 0,
		drawCalls: 0,
		sprites: 0
	};

	// FPS display
	private fpsDisplay: Text | null = null;

	// Sprite containers for different game objects
	private playerSprites: Map<string, Sprite> = new Map();
	private bossSprite: Sprite | null = null;
	private terrainSprites: Sprite[] = [];
	private mechanicSprites: Sprite[] = [];
	private terrainInitialized: boolean = false;

	constructor(config: RendererConfig) {
		this.config = config;
		this.gridConfig = config.gridConfig || {
			...DEFAULT_GRID_CONFIG,
			canvasWidth: config.canvasWidth,
			canvasHeight: config.canvasHeight
		};

		console.log('🎮 Creating PIXI Application...');

		try {
			// 🔧 FIX: Create PIXI Application (v8 approach)
			console.log('🎮 Calling new Application()...');
			this.app = new Application();
			console.log('🎮 PIXI Application created successfully');
			console.log('🎮 Created app:', this.app);
			console.log('🎮 App type:', typeof this.app);
			console.log('🎮 App constructor:', this.app?.constructor?.name);
			console.log('🎮 App has stage:', !!this.app?.stage);
		} catch (error) {
			console.error('🎮 ❌ Failed to create PIXI Application with named import:', error);
			console.log('🎮 Trying PIXI.Application fallback...');
			
			try {
				this.app = new PIXI.Application();
				console.log('🎮 PIXI Application created successfully with fallback');
			} catch (fallbackError) {
				console.error('🎮 ❌ Failed to create PIXI Application with fallback:', fallbackError);
				throw new Error(`Failed to create PIXI Application: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}

		// 🔧 FIX: Validate app creation
		if (!this.app) {
			console.error('🎮 ❌ PIXI Application is null/undefined');
			throw new Error('PIXI Application creation returned null/undefined');
		}
		
		console.log('🎮 Final app check:', {
			hasApp: !!this.app,
			appType: typeof this.app,
			appConstructor: this.app?.constructor?.name,
			appStage: !!this.app?.stage
		});

		console.log('🎮 PIXI Application created successfully - ready for initialization');
	}

	/**
	 * Initialize PIXI Application
	 */
	private async initializeApp(): Promise<void> {
		// 🔧 FIX: Don't re-initialize if already done
		if (this.isAppInitialized) {
			console.log('🎮 App already initialized, skipping...');
			return;
		}

		try {
			console.log('🎮 Initializing PIXI Application...');
			
			// 🔧 FIX: Validate app exists before initialization
			if (!this.app) {
				throw new Error('PIXI Application is null/undefined before initialization');
			}

			const initConfig = {
				width: this.config.canvasWidth,
				height: this.config.canvasHeight,
				backgroundColor: this.config.backgroundColor || 0x2C3E50,
				antialias: this.config.antialias !== false,
				resolution: this.config.resolution || window.devicePixelRatio || 1,
				autoDensity: true
			};

			console.log('🎮 Init config:', initConfig);

			await this.app.init(initConfig);

			console.log('🎮 ✅ PIXI Application initialized successfully');
			console.log('🎮 App state after init:', {
				hasCanvas: !!this.app.canvas,
				canvasWidth: this.app.canvas?.width,
				canvasHeight: this.app.canvas?.height,
				hasStage: !!this.app.stage,
				stageChildren: this.app.stage?.children?.length || 0
			});

			this.isAppInitialized = true;

			// Now that the app is initialized, create the layers
			this.createLayers();
			this.setupPerformanceMonitoring();
			this.setupFPSDisplay();

			console.log('🎮 ✅ PIXI layers and systems setup complete');
		} catch (error) {
			console.error('🎮 ❌ Failed to initialize PIXI Application:', error);
			console.error('🎮 Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				app: this.app,
				config: this.config
			});
			throw error;
		}
	}

	/**
	 * Create rendering layers
	 */
	private createLayers(): void {
		console.log('🎨 Creating rendering layers...');

		// Ensure app and stage are initialized
		if (!this.app || !this.app.stage) {
			console.error('🎨 ❌ App or stage not initialized when creating layers');
			throw new Error('PIXI App or stage not initialized');
		}

		// Create layer containers
		this.terrainLayer = new Container();
		this.gameObjectLayer = new Container();
		this.mechanicsLayer = new Container();
		this.effectsLayer = new Container();
		this.uiLayer = new Container();

		console.log('🎨 Adding layers to stage...');
		// Add layers to stage in order
		this.app.stage.addChild(this.terrainLayer);
		this.app.stage.addChild(this.gameObjectLayer);
		this.app.stage.addChild(this.mechanicsLayer);
		this.app.stage.addChild(this.effectsLayer);
		this.app.stage.addChild(this.uiLayer);

		// Set layer names for debugging
		this.terrainLayer.name = 'TerrainLayer';
		this.gameObjectLayer.name = 'GameObjectLayer';
		this.mechanicsLayer.name = 'MechanicsLayer';
		this.effectsLayer.name = 'EffectsLayer';
		this.uiLayer.name = 'UILayer';

		// 🔧 FIX: Ensure all layers are visible and have proper alpha
		this.terrainLayer.visible = true;
		this.terrainLayer.alpha = 1;
		this.gameObjectLayer.visible = true;
		this.gameObjectLayer.alpha = 1;
		this.mechanicsLayer.visible = true;
		this.mechanicsLayer.alpha = 1;
		this.effectsLayer.visible = true;
		this.effectsLayer.alpha = 1;
		this.uiLayer.visible = true;
		this.uiLayer.alpha = 1;

		console.log('🎨 Layers created successfully with visibility settings');

		// Add a test rectangle to verify PixiJS is working
		this.addTestRectangle();

		// Add grid overlay for debugging
		this.addGridOverlay();
	}

	/**
	 * Setup performance monitoring
	 */
	private setupPerformanceMonitoring(): void {
		let lastTime = performance.now();
		let frameCount = 0;

		this.app.ticker.add(() => {
			const currentTime = performance.now();
			const deltaTime = currentTime - lastTime;

			frameCount++;

			// Update FPS every second
			if (frameCount % 60 === 0) {
				this.performanceStats.fps = Math.round(1000 / deltaTime);
				this.performanceStats.frameTime = deltaTime;
				this.performanceStats.sprites = this.app.stage.children.length;

				// Update FPS display
				if (this.fpsDisplay) {
					this.fpsDisplay.text = `FPS: ${this.performanceStats.fps}`;
				}
			}

			lastTime = currentTime;
		});
	}

	/**
	 * Setup FPS display
	 */
	private setupFPSDisplay(): void {
		if (!this.uiLayer) {
			console.error('🎮 ❌ UI layer not initialized for FPS display');
			return;
		}

		this.fpsDisplay = new Text({
			text: 'FPS: 0',
			style: {
				fontFamily: 'Arial',
				fontSize: 12,
				fill: 0xFFFFFF,
				align: 'left'
			}
		});

		this.fpsDisplay.x = 10;
		this.fpsDisplay.y = 10;

		this.uiLayer.addChild(this.fpsDisplay);
		console.log('🎮 FPS display added to UI layer');
	}

	/**
	 * Add a test rectangle to verify PixiJS is working
	 */
	private addTestRectangle(): void {
		console.log('🧪 Adding test rectangle to verify PixiJS is working...');

		if (!this.uiLayer) {
			console.error('🧪 ❌ UI layer not initialized');
			return;
		}

		const testRect = new Graphics();
		testRect.beginFill(0xFF0000); // Red color
		testRect.drawRect(50, 50, 100, 100);
		testRect.endFill();

		// Add to UI layer so it's always visible
		this.uiLayer.addChild(testRect);

		console.log('🧪 Test rectangle added to UI layer');
		console.log('🧪 UI layer children count:', this.uiLayer.children.length);
		console.log('🧪 Stage children count:', this.app.stage.children.length);
	}

	/**
	 * Add grid overlay for debugging coordinate system
	 */
	private addGridOverlay(): void {
		console.log('📐 Adding grid overlay for debugging...');

		if (!this.uiLayer) {
			console.error('📐 ❌ UI layer not initialized');
			return;
		}

		const cellSize = getCellSize(this.gridConfig);
		const gridGraphics = new Graphics();

		// Draw vertical lines
		for (let x = 0; x <= this.gridConfig.gridWidth; x++) {
			const pixelX = gridToPixels(x, 0, this.gridConfig).x;
			gridGraphics.lineStyle(1, 0x00FF00, 0.3); // Green lines with transparency
			gridGraphics.moveTo(pixelX, 0);
			gridGraphics.lineTo(pixelX, this.config.canvasHeight);
		}

		// Draw horizontal lines
		for (let y = 0; y <= this.gridConfig.gridHeight; y++) {
			const pixelY = gridToPixels(0, y, this.gridConfig).y;
			gridGraphics.lineStyle(1, 0x00FF00, 0.3); // Green lines with transparency
			gridGraphics.moveTo(0, pixelY);
			gridGraphics.lineTo(this.config.canvasWidth, pixelY);
		}

		// Add to UI layer
		this.uiLayer.addChild(gridGraphics);

		console.log('📐 Grid overlay added with', this.gridConfig.gridWidth, 'x', this.gridConfig.gridHeight, 'cells');
		console.log('📐 Cell size:', cellSize);
	}

	/**
	 * Get PIXI Application instance
	 */
	getApp(): Application {
		return this.app;
	}

	/**
	 * Get canvas element
	 */
	async getCanvas(): Promise<HTMLCanvasElement> {
		console.log('🎮 Getting canvas element...');
		
		// 🔧 FIX: Validate app exists
		if (!this.app) {
			console.error('🎮 ❌ PIXI Application is null/undefined in getCanvas()');
			throw new Error('PIXI Application not created');
		}

		// console.log('🎮 App state before canvas access:', {
		// 	hasApp: !!this.app,
		// 	isInitialized: this.isAppInitialized,
		// 	hasCanvas: this.app ? !!this.app.canvas : false
		// });
		
		// 🔧 FIX: Initialize app if not already done
		if (!this.isAppInitialized) {
			console.log('🎮 App not initialized, initializing now...');
			await this.initializeApp();
		}
		
		// 🔧 FIX: Validate canvas exists after initialization
		if (!this.app.canvas) {
			console.error('🎮 ❌ Canvas still not available after initialization');
			console.error('🎮 App state:', {
				app: this.app,
				isInitialized: this.isAppInitialized,
				appType: typeof this.app,
				hasCanvas: !!this.app.canvas
			});
			throw new Error('Failed to initialize PIXI Application canvas');
		}
		
		console.log('🎮 ✅ Canvas element retrieved successfully');
		console.log('🎮 Canvas details:', {
			width: this.app.canvas.width,
			height: this.app.canvas.height,
			clientWidth: this.app.canvas.clientWidth,
			clientHeight: this.app.canvas.clientHeight
		});
		
		return this.app.canvas;
	}

	/**
	 * Get performance stats
	 */
	getPerformanceStats(): PerformanceStats {
		return { ...this.performanceStats };
	}

	/**
	 * Update game state and render
	 */
	async updateGameState(gameState: GameState): Promise<void> {
		console.log('🎮 Updating game state:', gameState);
		console.log('🎮 Current renderer state:', {
			appInitialized: this.isAppInitialized,
			canvasAttached: !!this.app?.canvas?.parentElement,
			stageChildren: this.app?.stage?.children?.length || 0,
			terrainInitialized: this.terrainInitialized
		});

		this.currentGameState = gameState;
		
		// 🔧 FIX: Ensure app is initialized before rendering
		if (!this.isAppInitialized) {
			console.log('🎮 App not initialized for game state update, initializing...');
			await this.initializeApp();
		}
		
		await this.renderGameState();
	}

	/**
	 * Render current game state
	 */
	private async renderGameState(): Promise<void> {
		if (!this.currentGameState) {
			console.log('❌ No game state to render');
			return;
		}

		console.log('🎨 Starting game state render...');
		console.log('🎨 Terrain initialized:', this.terrainInitialized);

		// 🔧 FIX: Always render terrain to ensure it's visible
		console.log('🌍 Rendering terrain...');
		await this.renderTerrain();
		this.terrainInitialized = true;
		console.log('🌍 Terrain rendering complete');

		console.log('👹 Rendering boss...');
		await this.renderBoss();
		console.log('👹 Boss rendering complete');

		console.log('👥 Rendering players...');
		await this.renderPlayers();
		console.log('👥 Players rendering complete');

		console.log('⚡ Rendering mechanics...');
		await this.renderMechanics();
		console.log('⚡ Mechanics rendering complete');

		console.log('🎨 Game state render complete!');
	}

	/**
	 * Render terrain background
	 */
	private async renderTerrain(): Promise<void> {
		console.log('🌍 Starting terrain rendering...');
		console.log('🌍 Grid config:', this.gridConfig);

		// Clear existing terrain sprites
		this.terrainSprites.forEach(sprite => sprite.destroy());
		this.terrainSprites = [];
		this.terrainLayer.removeChildren();

		const cellSize = getCellSize(this.gridConfig);
		console.log('🌍 Cell size:', cellSize);

		// 🔧 FIX: Create simple colored terrain instead of loading textures
		for (let x = 0; x < this.gridConfig.gridWidth; x++) {
			for (let y = 0; y < this.gridConfig.gridHeight; y++) {
				const pixelPos = gridToPixels(x, y, this.gridConfig);

				// Create a simple colored rectangle for each cell
				const terrainCell = new Graphics();
				terrainCell.beginFill(0x34495E, 0.8); // Dark blue-gray with transparency
				terrainCell.lineStyle(1, 0x2C3E50, 0.5); // Subtle border
				terrainCell.drawRect(
					pixelPos.x - cellSize.width / 2,
					pixelPos.y - cellSize.height / 2,
					cellSize.width,
					cellSize.height
				);
				terrainCell.endFill();

				this.terrainLayer.addChild(terrainCell);
				this.terrainSprites.push(terrainCell as any); // Type assertion for compatibility

				if (x < 3 && y < 3) { // Log first few cells
					console.log(`🌍 ✅ Created terrain cell at (${x}, ${y}) pixel (${pixelPos.x}, ${pixelPos.y})`);
				}
			}
		}

		console.log(`🌍 Terrain rendering complete: ${this.terrainLayer.children.length} cells created`);
		console.log(`🌍 Terrain layer children count: ${this.terrainLayer.children.length}`);
	}

	/**
	 * Render boss
	 */
	private async renderBoss(): Promise<void> {
		if (!this.currentGameState?.boss) {
			console.log('👹 No boss to render');
			return;
		}

		console.log('👹 Rendering boss at position:', this.currentGameState.boss.position);

		// Clear existing boss sprite
		if (this.bossSprite) {
			this.bossSprite.destroy();
			this.bossSprite = null;
		}

		const boss = this.currentGameState.boss;
		const pixelPos = gridToPixels(boss.position.x, boss.position.y, this.gridConfig);
		console.log('👹 Boss pixel position:', pixelPos);

		// 🔧 FIX: Create a distinctive fallback boss sprite
		const cellSize = getCellSize(this.gridConfig);
		const bossSize = Math.min(cellSize.width, cellSize.height) * 1.2; // 120% of cell size

		const bossSprite = new Graphics();
		bossSprite.beginFill(0x8E44AD); // Purple base
		bossSprite.lineStyle(3, 0xF39C12, 1); // Gold border
		bossSprite.drawRect(
			pixelPos.x - bossSize / 2,
			pixelPos.y - bossSize / 2,
			bossSize,
			bossSize
		);
		bossSprite.endFill();

		// Add crown pattern
		bossSprite.beginFill(0xF39C12); // Gold
		bossSprite.drawRect(pixelPos.x - bossSize * 0.3, pixelPos.y - bossSize * 0.4, bossSize * 0.6, bossSize * 0.2);
		bossSprite.endFill();

		this.gameObjectLayer.addChild(bossSprite);
		this.bossSprite = bossSprite as any; // Type assertion

		console.log('👹 Boss sprite created:', {
			x: pixelPos.x,
			y: pixelPos.y,
			size: bossSize,
			gridPos: boss.position
		});
		console.log('👹 Boss sprite added to game object layer');
	}

	/**
	 * Render players
	 */
	private async renderPlayers(): Promise<void> {
		if (!this.currentGameState?.players) {
			console.log('👥 No players to render');
			return;
		}

		console.log('👥 Rendering players...');

		// Clear existing player sprites
		this.playerSprites.forEach(sprite => sprite.destroy());
		this.playerSprites.clear();

		const players = Array.from(this.currentGameState.players.values());
		console.log(`👥 Found ${players.length} players to render`);

		for (const player of players) {
			if (!player.isAlive) {
				console.log(`👥 Skipping dead player: ${player.name}`);
				continue;
			}

			console.log(`👥 Rendering player: ${player.name} (${player.color}) at position:`, player.position);
			const pixelPos = gridToPixels(player.position.x, player.position.y, this.gridConfig);
			console.log(`👥 Player pixel position:`, pixelPos);

			// 🔧 FIX: Create distinctive fallback player sprites
			const cellSize = getCellSize(this.gridConfig);
			const playerSize = Math.min(cellSize.width, cellSize.height) * 0.7; // 70% of cell size
			const playerColor = getPlayerColor(player.color);

			const playerSprite = new Graphics();
			playerSprite.lineStyle(2, 0xFFFFFF, 1); // White border

			// Create different shapes based on player color
			switch (player.color) {
				case 'blue':
					playerSprite.beginFill(playerColor);
					playerSprite.drawCircle(pixelPos.x, pixelPos.y, playerSize / 2);
					break;
				case 'red':
					playerSprite.beginFill(playerColor);
					// Diamond shape
					playerSprite.drawPolygon([
						pixelPos.x, pixelPos.y - playerSize / 2,
						pixelPos.x + playerSize / 2, pixelPos.y,
						pixelPos.x, pixelPos.y + playerSize / 2,
						pixelPos.x - playerSize / 2, pixelPos.y
					]);
					break;
				case 'yellow':
					playerSprite.beginFill(playerColor);
					// Triangle shape
					playerSprite.drawPolygon([
						pixelPos.x, pixelPos.y - playerSize / 2,
						pixelPos.x - playerSize / 2, pixelPos.y + playerSize / 2,
						pixelPos.x + playerSize / 2, pixelPos.y + playerSize / 2
					]);
					break;
				case 'black':
					playerSprite.beginFill(playerColor);
					playerSprite.drawRect(
						pixelPos.x - playerSize / 2,
						pixelPos.y - playerSize / 2,
						playerSize,
						playerSize
					);
					break;
				default:
					playerSprite.beginFill(playerColor);
					playerSprite.drawCircle(pixelPos.x, pixelPos.y, playerSize / 2);
			}
			playerSprite.endFill();

			this.gameObjectLayer.addChild(playerSprite);
			this.playerSprites.set(player.id, playerSprite as any); // Type assertion

			console.log(`👥 Player sprite created for ${player.name}:`, {
				x: pixelPos.x,
				y: pixelPos.y,
				size: playerSize,
				color: player.color,
				gridPos: player.position
			});
			console.log(`👥 Player sprite added to game object layer for ${player.name}`);
		}

		console.log(`👥 Player rendering complete. Total player sprites: ${this.playerSprites.size}`);
	}

	/**
	 * Render boss mechanics
	 */
	private async renderMechanics(): Promise<void> {
		// Clear existing mechanic sprites
		this.mechanicSprites.forEach(sprite => sprite.destroy());
		this.mechanicSprites = [];
		this.mechanicsLayer.removeChildren();

		// TODO: Implement mechanic rendering based on active mechanics
		// This would include lava waves, meteor strikes, pillar phases, etc.
	}

	/**
	 * Resize renderer
	 */
	resize(width: number, height: number): void {
		if (this.isAppInitialized && this.app.renderer) {
			this.app.renderer.resize(width, height);
			this.gridConfig = {
				...this.gridConfig,
				canvasWidth: width,
				canvasHeight: height
			};

			// Re-render with new dimensions
			if (this.currentGameState) {
				this.renderGameState();
			}
		}
	}

	/**
	 * Destroy renderer and cleanup
	 */
	destroy(): void {
		console.log('🎮 Destroying GameRenderer...');
		
		// Cleanup sprites
		this.playerSprites.forEach(sprite => sprite.destroy());
		this.playerSprites.clear();

		if (this.bossSprite) {
			this.bossSprite.destroy();
			this.bossSprite = null;
		}

		this.terrainSprites.forEach(sprite => sprite.destroy());
		this.terrainSprites = [];

		this.mechanicSprites.forEach(sprite => sprite.destroy());
		this.mechanicSprites = [];

		// Destroy PIXI app
		if (this.app) {
			this.app.destroy(true);
		}

		this.isAppInitialized = false;
		console.log('🎮 GameRenderer destroyed');
	}

	/**
	 * Enable/disable FPS display
	 */
	setFPSDisplayVisible(visible: boolean): void {
		if (this.fpsDisplay) {
			this.fpsDisplay.visible = visible;
		}
	}

	/**
	 * Get current game state
	 */
	getCurrentGameState(): GameState | null {
		return this.currentGameState;
	}

	/**
	 * 🔧 FIX: Debug method to expose renderer state
	 */
	debugRenderer(): void {
		console.log('🎮 GameRenderer Debug Info:', {
			appInitialized: this.isAppInitialized,
			hasCanvas: !!this.app?.canvas,
			canvasSize: this.app?.canvas ? {
				width: this.app.canvas.width,
				height: this.app.canvas.height
			} : null,
			stageChildren: this.app?.stage?.children?.length || 0,
			layers: {
				terrain: this.terrainLayer?.children?.length || 0,
				gameObjects: this.gameObjectLayer?.children?.length || 0,
				mechanics: this.mechanicsLayer?.children?.length || 0,
				effects: this.effectsLayer?.children?.length || 0,
				ui: this.uiLayer?.children?.length || 0
			},
			sprites: {
				players: this.playerSprites.size,
				boss: this.bossSprite ? 1 : 0,
				terrain: this.terrainSprites.length,
				mechanics: this.mechanicSprites.length
			},
			gameState: this.currentGameState ? {
				hasPlayers: this.currentGameState.players?.size > 0,
				hasBoss: !!this.currentGameState.boss,
				playerCount: this.currentGameState.players?.size || 0
			} : null,
			gridConfig: this.gridConfig
		});

		// 🔧 FIX: Add detailed layer visibility debugging
		console.log('🔍 LAYER VISIBILITY CHECK:');
		if (this.app?.stage) {
			this.app.stage.children.forEach((layer, index) => {
				console.log(`Layer ${index} (${layer.name}):`, {
					visible: layer.visible,
					alpha: layer.alpha,
					children: layer.children.length,
					bounds: layer.getBounds(),
					position: { x: layer.x, y: layer.y },
					scale: { x: layer.scale.x, y: layer.scale.y }
				});
			});
		}

		// 🔧 FIX: Check individual sprite visibility
		console.log('🔍 SPRITE VISIBILITY CHECK:');
		if (this.gameObjectLayer) {
			this.gameObjectLayer.children.forEach((sprite, index) => {
				console.log(`GameObject ${index}:`, {
					type: sprite.constructor.name,
					visible: sprite.visible,
					alpha: sprite.alpha,
					position: { x: sprite.x, y: sprite.y },
					bounds: sprite.getBounds(),
					hasTexture: !!(sprite as any).texture
				});
			});
		}

		if (this.terrainLayer) {
			console.log('🔍 TERRAIN CHECK:');
			console.log(`Terrain children: ${this.terrainLayer.children.length}`);
			if (this.terrainLayer.children.length > 0) {
				const firstTerrain = this.terrainLayer.children[0];
				console.log('First terrain cell:', {
					type: firstTerrain.constructor.name,
					visible: firstTerrain.visible,
					alpha: firstTerrain.alpha,
					bounds: firstTerrain.getBounds()
				});
			}
		}
	}

	/**
	 * 🔧 FIX: Force re-render method
	 */
	forceRerender(): void {
		if (this.currentGameState) {
			console.log('🎮 Force re-rendering game state...');
			this.renderGameState();
		} else {
			console.warn('🎮 No game state to re-render');
		}
	}

	/**
	 * 🔧 FIX: Force all layers and sprites to be visible
	 */
	forceVisibility(): void {
		console.log('🔍 FORCING ALL LAYERS AND SPRITES VISIBLE...');
		
		// Force all layers visible
		if (this.terrainLayer) {
			this.terrainLayer.visible = true;
			this.terrainLayer.alpha = 1;
			console.log('✅ Terrain layer forced visible');
		}
		
		if (this.gameObjectLayer) {
			this.gameObjectLayer.visible = true;
			this.gameObjectLayer.alpha = 1;
			console.log('✅ Game object layer forced visible');
		}
		
		if (this.mechanicsLayer) {
			this.mechanicsLayer.visible = true;
			this.mechanicsLayer.alpha = 1;
		}
		
		if (this.effectsLayer) {
			this.effectsLayer.visible = true;
			this.effectsLayer.alpha = 1;
		}
		
		if (this.uiLayer) {
			this.uiLayer.visible = true;
			this.uiLayer.alpha = 1;
		}

		// Force all sprites visible
		this.terrainSprites.forEach((sprite) => {
			if (sprite) {
				sprite.visible = true;
				sprite.alpha = 1;
			}
		});
		console.log(`✅ ${this.terrainSprites.length} terrain sprites forced visible`);

		this.playerSprites.forEach((sprite) => {
			if (sprite) {
				sprite.visible = true;
				sprite.alpha = 1;
			}
		});
		console.log(`✅ ${this.playerSprites.size} player sprites forced visible`);

		if (this.bossSprite) {
			this.bossSprite.visible = true;
			this.bossSprite.alpha = 1;
			console.log('✅ Boss sprite forced visible');
		}

		console.log('🔍 FORCE VISIBILITY COMPLETE');
	}
}

// Helper function to get player color
function getPlayerColor(color: string): number {
	const colors: { [key: string]: number } = {
		blue: 0x3498DB,
		red: 0xE74C3C,
		yellow: 0xF1C40F,
		black: 0x2C3E50
	};
	return colors[color] || 0x95A5A6;
}