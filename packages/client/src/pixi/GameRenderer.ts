import { Application, Container, Sprite, Graphics, Text } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { GameState } from '@pumpfun-game/shared';
import { DEFAULT_GRID_CONFIG, gridToPixels, getCellSize } from '../utils/GridUtils';
import type { GridConfig } from '../utils/GridUtils';
import { spriteLoader } from '../assets/SpriteLoader';

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
		console.log('🎮 Application class:', Application);
		console.log('🎮 Application type:', typeof Application);
		console.log('🎮 Application constructor:', Application?.constructor?.name);
		console.log('🎮 PIXI.Application:', PIXI.Application);
		console.log('🎮 PIXI.Application type:', typeof PIXI.Application);

		try {
			// Create empty PIXI Application (v8 approach)
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
				console.log('🎮 Created app:', this.app);
				console.log('🎮 App type:', typeof this.app);
			} catch (fallbackError) {
				console.error('🎮 ❌ Failed to create PIXI Application with fallback:', fallbackError);
				console.error('🎮 Error details:', {
					message: error instanceof Error ? error.message : 'Unknown error',
					stack: error instanceof Error ? error.stack : undefined,
					errorType: typeof error,
					Application: Application,
					PIXIApplication: PIXI.Application
				});
				throw new Error(`Failed to create PIXI Application: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}

		if (!this.app) {
			console.error('🎮 ❌ PIXI Application is null/undefined');
			console.error('🎮 This should not happen if Application creation succeeded');
			throw new Error('PIXI Application creation returned null/undefined');
		}
		
		console.log('🎮 Final app check:', {
			hasApp: !!this.app,
			appType: typeof this.app,
			appConstructor: this.app?.constructor?.name,
			appStage: !!this.app?.stage
		});

    console.log('🎮 PIXI Application created:', {
      hasApp: !!this.app,
      appType: typeof this.app,
      appConstructor: this.app?.constructor?.name
    });

		// Note: App will be initialized when getCanvas() is called
		// Layers will be created after app initialization
	}

	/**
	 * Initialize PIXI Application
	 */
	private async initializeApp(): Promise<void> {
		try {
			console.log('🎮 Initializing PIXI Application...');
			console.log('🎮 Config:', {
				width: this.config.canvasWidth,
				height: this.config.canvasHeight,
				backgroundColor: this.config.backgroundColor || 0x2C3E50,
				antialias: this.config.antialias || true,
				resolution: this.config.resolution || window.devicePixelRatio || 1,
				autoDensity: true
			});

			await this.app.init({
				width: this.config.canvasWidth,
				height: this.config.canvasHeight,
				backgroundColor: this.config.backgroundColor || 0x2C3E50,
				antialias: this.config.antialias || true,
				resolution: this.config.resolution || window.devicePixelRatio || 1,
				autoDensity: true
			});

			console.log('🎮 ✅ PIXI Application initialized successfully');
			console.log('🎮 App state after init:', {
				hasCanvas: !!this.app.canvas,
				canvasWidth: this.app.canvas?.width,
				canvasHeight: this.app.canvas?.height
			});

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

		console.log('🎨 Layers created successfully');

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
				// Note: drawCalls is not available in newer PIXI versions
				// this.performanceStats.drawCalls = this.app.renderer.gl.drawCalls || 0;
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
    console.log('🎮 App state:', {
      hasApp: !!this.app,
      hasCanvas: this.app ? !!this.app.canvas : false
    });
    console.log('🎮 this.app:', this.app);
    console.log('🎮 this.app type:', typeof this.app);
    
    // Ensure app is initialized before returning canvas
    if (!this.app) {
      console.error('🎮 ❌ PIXI Application is null/undefined in getCanvas()');
      throw new Error('PIXI Application not created');
    }
    
    // Always initialize the app to ensure canvas is available
    if (!this.app.canvas) {
      console.log('🎮 Canvas not available, initializing app...');
      await this.initializeApp();
    }
    
    if (!this.app.canvas) {
      console.error('🎮 ❌ Canvas still not available after initialization');
      throw new Error('Failed to initialize PIXI Application canvas');
    }
    
    // Create layers if not already created
    if (!this.terrainLayer) {
      console.log('🎮 Creating layers...');
      this.createLayers();
      this.setupPerformanceMonitoring();
      this.setupFPSDisplay();
    }
    
    console.log('🎮 Canvas element retrieved successfully');
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
			appInitialized: !!this.app,
			canvasAttached: !!this.app?.canvas?.parentElement,
			stageChildren: this.app?.stage?.children?.length || 0,
			terrainInitialized: this.terrainInitialized
		});

		this.currentGameState = gameState;
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

		// Only render terrain once
		if (!this.terrainInitialized) {
			console.log('🌍 Rendering terrain...');
			await this.renderTerrain();
			this.terrainInitialized = true;
			console.log('🌍 Terrain rendering complete');
		}

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

		let successCount = 0;
		let fallbackCount = 0;

		// Create terrain tiles for each grid cell
		for (let x = 0; x < this.gridConfig.gridWidth; x++) {
			for (let y = 0; y < this.gridConfig.gridHeight; y++) {
				const pixelPos = gridToPixels(x, y, this.gridConfig);

				// Load terrain texture
				try {
					console.log(`🌍 Loading terrain for cell (${x}, ${y}) at pixel (${pixelPos.x}, ${pixelPos.y})`);
					const terrainResult = await spriteLoader.loadSprite('terrain_tile1');

					if (terrainResult.success && terrainResult.texture) {
						const terrainSprite = new Sprite(terrainResult.texture);
						terrainSprite.x = pixelPos.x - cellSize.width / 2;
						terrainSprite.y = pixelPos.y - cellSize.height / 2;
						terrainSprite.width = cellSize.width;
						terrainSprite.height = cellSize.height;

						this.terrainLayer.addChild(terrainSprite);
						this.terrainSprites.push(terrainSprite);
						successCount++;

						if (successCount <= 3) { // Log first few successful loads
							console.log(`🌍 ✅ Successfully created terrain sprite at (${x}, ${y})`);
						}
					} else {
						console.warn(`🌍 ❌ Failed to load terrain texture for (${x}, ${y}):`, terrainResult.error);
						// Create a fallback colored rectangle
						const fallbackSprite = new Graphics();
						fallbackSprite.beginFill(0x2C3E50);
						fallbackSprite.drawRect(pixelPos.x - cellSize.width / 2, pixelPos.y - cellSize.height / 2, cellSize.width, cellSize.height);
						fallbackSprite.endFill();
						this.terrainLayer.addChild(fallbackSprite);
						fallbackCount++;
					}
				} catch (error) {
					console.error(`🌍 ❌ Error loading terrain sprite for (${x}, ${y}):`, error);
					fallbackCount++;
				}
			}
		}

		console.log(`🌍 Terrain rendering complete: ${successCount} successful, ${fallbackCount} fallbacks`);
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
		this.gameObjectLayer.removeChildren();

		const boss = this.currentGameState.boss;
		const pixelPos = gridToPixels(boss.position.x, boss.position.y, this.gridConfig);
		console.log('👹 Boss pixel position:', pixelPos);

		// Load boss texture
		try {
			console.log('👹 Loading boss texture...');
			const bossResult = await spriteLoader.loadSprite('boss_castle');

			if (bossResult.success && bossResult.texture) {
				console.log('👹 ✅ Boss texture loaded successfully');
				this.bossSprite = new Sprite(bossResult.texture);
				this.bossSprite.x = pixelPos.x - this.bossSprite.width / 2;
				this.bossSprite.y = pixelPos.y - this.bossSprite.height / 2;

				// Scale boss sprite to fit cell size
				const cellSize = getCellSize(this.gridConfig);
				const scale = Math.min(cellSize.width / this.bossSprite.width, cellSize.height / this.bossSprite.height);
				this.bossSprite.scale.set(scale);

				console.log('👹 Boss sprite created:', {
					x: this.bossSprite.x,
					y: this.bossSprite.y,
					scale: scale,
					width: this.bossSprite.width,
					height: this.bossSprite.height
				});

				this.gameObjectLayer.addChild(this.bossSprite);
				console.log('👹 Boss sprite added to game object layer');
			} else {
				console.warn('👹 ❌ Failed to load boss texture:', bossResult.error);
				// Create a fallback boss sprite
				const fallbackBoss = new Graphics();
				fallbackBoss.beginFill(0x8E44AD);
				const cellSize = getCellSize(this.gridConfig);
				fallbackBoss.drawRect(pixelPos.x - cellSize.width / 2, pixelPos.y - cellSize.height / 2, cellSize.width, cellSize.height);
				fallbackBoss.endFill();
				this.gameObjectLayer.addChild(fallbackBoss);
				console.log('👹 Fallback boss sprite created');
			}
		} catch (error) {
			console.error('👹 ❌ Error loading boss sprite:', error);
		}
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

			// Determine sprite key based on player color
			let spriteKey: keyof typeof import('../assets/AssetConfig').SPRITE_CONFIGS;
			switch (player.color) {
				case 'blue':
					spriteKey = 'player_blue_warrior';
					break;
				case 'red':
					spriteKey = 'player_red_warrior';
					break;
				case 'yellow':
					spriteKey = 'player_yellow_warrior';
					break;
				case 'black':
					spriteKey = 'player_black_warrior';
					break;
				default:
					spriteKey = 'player_blue_warrior';
			}

			console.log(`👥 Using sprite key: ${spriteKey}`);

			// Load player texture
			try {
				const playerResult = await spriteLoader.loadSprite(spriteKey);

				if (playerResult.success && playerResult.texture) {
					console.log(`👥 ✅ Player texture loaded for ${player.name}`);
					const playerSprite = new Sprite(playerResult.texture);
					playerSprite.x = pixelPos.x - playerSprite.width / 2;
					playerSprite.y = pixelPos.y - playerSprite.height / 2;

					// Scale player sprite to fit cell size
					const cellSize = getCellSize(this.gridConfig);
					const scale = Math.min(cellSize.width / playerSprite.width, cellSize.height / playerSprite.height) * 0.8;
					playerSprite.scale.set(scale);

					console.log(`👥 Player sprite created for ${player.name}:`, {
						x: playerSprite.x,
						y: playerSprite.y,
						scale: scale,
						width: playerSprite.width,
						height: playerSprite.height
					});

					this.gameObjectLayer.addChild(playerSprite);
					this.playerSprites.set(player.id, playerSprite);
					console.log(`👥 Player sprite added to game object layer for ${player.name}`);
				} else {
					console.warn(`👥 ❌ Failed to load player texture for ${player.name}:`, playerResult.error);
					// Create a fallback player sprite
					const fallbackPlayer = new Graphics();
					const playerColor = getPlayerColor(player.color);
					fallbackPlayer.beginFill(playerColor);
					const cellSize = getCellSize(this.gridConfig);
					const size = Math.min(cellSize.width, cellSize.height) * 0.6;
					fallbackPlayer.drawCircle(pixelPos.x, pixelPos.y, size / 2);
					fallbackPlayer.endFill();
					this.gameObjectLayer.addChild(fallbackPlayer);
					console.log(`👥 Fallback player sprite created for ${player.name}`);
				}
			} catch (error) {
				console.error(`👥 ❌ Error loading player sprite for ${player.name}:`, error);
			}
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

	/**
	 * Destroy renderer and cleanup
	 */
	destroy(): void {
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
		this.app.destroy(true);
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
