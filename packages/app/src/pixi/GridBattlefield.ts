import * as PIXI from 'pixi.js';
import type { GridConfig, GridClickEvent, GridDimensions } from '../types/GridTypes';
import type { GridPosition, Player, Boss, EntityInfo } from '../types/GameTypes';
import { SpriteSheetManager } from '../assets/SpriteSheetManager';
import { TerrainManager, type TerrainPattern } from './TerrainManager';
import { SpriteEntityManager } from './SpriteEntityManager';
import { SpriteAnimationController } from './SpriteAnimationController';
import { AnimationStateManager } from './AnimationStateManager';
import { MovementTweener } from './MovementTweener';
import { MechanicWarningSystem } from './MechanicWarningSystem';
import { MechanicEffects } from './MechanicEffects';

export class GridBattlefield {
  private app: PIXI.Application;
  private container: PIXI.Container;

  // Grid configuration
  private readonly GRID_WIDTH = 16;  // A-P columns
  private readonly GRID_HEIGHT = 12; // 1-12 rows
  private cellSize: number;

  // Visual elements
  private gridLines: PIXI.Graphics;
  private sideLabels: PIXI.Container;
  private background: PIXI.Graphics;
  private cells: PIXI.Graphics[][];
  
  // Terrain system
  private spriteManager: SpriteSheetManager;
  private terrainManager: TerrainManager;
  private terrainLayer: PIXI.Container;
  private terrainPattern: TerrainPattern | null = null;

  // Entity sprite system
  private spriteEntityManager: SpriteEntityManager;
  private animationStateManager: AnimationStateManager;
  private movementTweener: MovementTweener;

  // Entity layers
  private playerLayer: PIXI.Container;
  private bossLayer: PIXI.Container;
  private uiLayer: PIXI.Container;

  // Mechanic systems
  private mechanicWarningSystem: MechanicWarningSystem | null = null;
  private mechanicEffects: MechanicEffects | null = null;
  private mechanicWarningLayer: PIXI.Container;
  private mechanicCountdownLayer: PIXI.Container;
  private mechanicEffectsLayer: PIXI.Container;

  // Entity management (now using animated sprites)
  private players = new Map<string, PIXI.AnimatedSprite>();
  private playerLabels = new Map<string, PIXI.Text>();
  private boss: PIXI.AnimatedSprite | null = null;
  private bossHealthBar: PIXI.Graphics | null = null;
  private bossLabel: PIXI.Text | null = null;

  // Configuration
  private config: GridConfig;

  // Event handlers
  private clickHandler?: (event: GridClickEvent) => void;
  private entityClickHandler?: (entity: EntityInfo) => void;

  constructor(config: Partial<GridConfig> = {}) {
    this.config = {
      width: 800,
      height: 600,
      cellSize: 40,
      showLabels: true,
      showGrid: true,
      backgroundColor: 0x79917d,
      gridColor: 0x3498db,
      labelColor: 0xffffff,
      ...config
    };

    this.cellSize = this.config.cellSize;
    this.cells = [];

    // Initialize PIXI app
    this.app = new PIXI.Application();

    // Create main container
    this.container = new PIXI.Container();

    // Initialize sprite and terrain managers
    this.spriteManager = new SpriteSheetManager();
    this.terrainManager = new TerrainManager(this.spriteManager);
    
    // Initialize animation systems
    const animationController = new SpriteAnimationController();
    this.spriteEntityManager = new SpriteEntityManager(this.spriteManager, animationController);
    this.animationStateManager = new AnimationStateManager(animationController);
    this.movementTweener = new MovementTweener();

    // Create visual elements
    this.background = new PIXI.Graphics();
    this.gridLines = new PIXI.Graphics();
    this.sideLabels = new PIXI.Container();
    this.terrainLayer = new PIXI.Container();

    // Create entity layers
    this.playerLayer = new PIXI.Container();
    this.bossLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();

    // Create mechanic layers
    this.mechanicWarningLayer = new PIXI.Container();
    this.mechanicCountdownLayer = new PIXI.Container();
    this.mechanicEffectsLayer = new PIXI.Container();

    // Add to container (order matters for rendering)
    this.container.addChild(this.background);
    this.container.addChild(this.terrainLayer); // Terrain sprites below grid lines
    this.container.addChild(this.gridLines);
    this.container.addChild(this.sideLabels);
    this.container.addChild(this.mechanicWarningLayer); // Warnings below entities
    this.container.addChild(this.playerLayer);
    this.container.addChild(this.bossLayer);
    this.container.addChild(this.mechanicEffectsLayer); // Effects above entities
    this.container.addChild(this.mechanicCountdownLayer); // Countdown above entities
    this.container.addChild(this.uiLayer);
  }

  /**
   * Initialize the battlefield
   */
  async init(container: HTMLElement, width: number = 800, height: number = 600): Promise<void> {
    try {
      console.log('🎮 Initializing GridBattlefield...', { width, height });

      this.config.width = width;
      this.config.height = height;

      // Initialize PIXI app
      console.log('🎨 Initializing PIXI app...');
      await this.app.init({
        width,
        height,
        backgroundColor: this.config.backgroundColor,
        antialias: true,
      });
      console.log('✅ PIXI app initialized');

      // Mount to container
      console.log('📱 Mounting canvas to container...');
      container.appendChild(this.app.canvas);
      console.log('✅ Canvas mounted');

      // Add main container to stage
      console.log('🎭 Adding container to stage...');
      this.app.stage.addChild(this.container);
      console.log('✅ Container added to stage');

      // Calculate optimal cell size
      console.log('📏 Calculating cell size...');
      this.calculateCellSize();
      console.log('✅ Cell size calculated:', this.cellSize);

      // Initialize grid
      console.log('🗂️ Initializing grid...');
      await this.initializeGrid();
      console.log('✅ Grid initialized');

      // Setup interaction
      console.log('🖱️ Setting up interaction...');
      this.setupInteraction();
      console.log('✅ Interaction setup complete');

      // Initialize mechanic systems
      console.log('⚡ Initializing mechanic systems...');
      this.initializeMechanicSystems();
      console.log('✅ Mechanic systems initialized');

      // Render initial state
      console.log('🎨 Rendering initial state...');
      this.render();
      console.log('✅ Initial render complete');

      console.log('🎉 GridBattlefield initialization complete!');

    } catch (error) {
      console.error('❌ Failed to initialize GridBattlefield:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal cell size based on available space
   */
  private calculateCellSize(): void {
    const labelArea = this.getLabelArea();
    const availableWidth = this.config.width - labelArea.left - labelArea.right;
    const availableHeight = this.config.height - labelArea.top - labelArea.bottom;

    const maxCellWidth = availableWidth / this.GRID_WIDTH;
    const maxCellHeight = availableHeight / this.GRID_HEIGHT;

    this.cellSize = Math.min(maxCellWidth, maxCellHeight, this.config.cellSize);
  }

  /**
   * Get label area dimensions
   */
  private getLabelArea(): { top: number; bottom: number; left: number; right: number } {
    const labelSize = this.config.showLabels ? 30 : 0;
    return {
      top: labelSize,
      bottom: labelSize,
      left: labelSize,
      right: labelSize
    };
  }

  /**
   * Initialize grid visual elements
   */
  private async initializeGrid(): Promise<void> {
    // Clear existing elements
    this.background.clear();
    this.gridLines.clear();
    this.sideLabels.removeChildren();
    this.terrainLayer.removeChildren();
    this.cells = [];

    const labelArea = this.getLabelArea();

    // Draw background
    this.background.fill({ color: this.config.backgroundColor });
    this.background.rect(0, 0, this.config.width, this.config.height);

    // Load and draw terrain sprites
    await this.loadAndDrawTerrain(labelArea);

    // Load entity sprites
    await this.spriteEntityManager.loadEntitySprites();

    // Draw grid cells (now just for interaction, not visual)
    this.drawGridCells(labelArea);

    // Draw grid lines
    if (this.config.showGrid) {
      this.drawGridLines(labelArea);
    }

    // Draw labels
    if (this.config.showLabels) {
      this.drawLabels(labelArea);
    }
  }

  /**
   * Load terrain sprites and draw them
   */
  private async loadAndDrawTerrain(labelArea: { top: number; bottom: number; left: number; right: number }): Promise<void> {
    try {
      // Load terrain sprites
      await this.terrainManager.loadTerrainSprites();
      
      // Generate terrain pattern
      this.terrainPattern = this.terrainManager.generateRandomTerrain(
        this.GRID_WIDTH, 
        this.GRID_HEIGHT, 
        'mixed' // TODO: Make this configurable
      );
      
      // Create terrain sprites
      const terrainSprites = this.terrainManager.createTerrainSprites(
        this.terrainPattern, 
        this.cellSize
      );
      
      // Position terrain sprites accounting for label area
      terrainSprites.forEach(sprite => {
        sprite.x += labelArea.left;
        sprite.y += labelArea.top;
        this.terrainLayer.addChild(sprite);
      });
      
      console.log(`✅ Loaded ${terrainSprites.length} terrain sprites`);
    } catch (error) {
      console.error('❌ Failed to load terrain sprites:', error);
      // Fallback to solid color background
    }
  }

  /**
   * Draw grid cells (now just for interaction, not visual)
   */
  private drawGridCells(labelArea: { top: number; bottom: number; left: number; right: number }): void {
    for (let y = 0; y < this.GRID_HEIGHT; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.GRID_WIDTH; x++) {
        const cell = new PIXI.Graphics();
        cell.fill({ color: 0x2c3e50, alpha: 0.5 });
        cell.rect(
          labelArea.left + x * this.cellSize,
          labelArea.top + y * this.cellSize,
          this.cellSize,
          this.cellSize
        );
        cell.fill();

        // Make cells interactive
        cell.interactive = true;
        cell.cursor = 'pointer';

        this.container.addChild(cell);
        this.cells[y][x] = cell;
      }
    }
  }

  /**
   * Draw grid lines
   */
  private drawGridLines(labelArea: { top: number; bottom: number; left: number; right: number }): void {
    this.gridLines.clear();
    this.gridLines.stroke({ color: this.config.gridColor, width: 2 });

    // Vertical lines
    for (let x = 0; x <= this.GRID_WIDTH; x++) {
      const xPos = labelArea.left + x * this.cellSize;
      this.gridLines.moveTo(xPos, labelArea.top);
      this.gridLines.lineTo(xPos, labelArea.top + this.GRID_HEIGHT * this.cellSize);
    }

    // Horizontal lines
    for (let y = 0; y <= this.GRID_HEIGHT; y++) {
      const yPos = labelArea.top + y * this.cellSize;
      this.gridLines.moveTo(labelArea.left, yPos);
      this.gridLines.lineTo(labelArea.left + this.GRID_WIDTH * this.cellSize, yPos);
    }
  }

  /**
   * Draw coordinate labels
   */
  private drawLabels(labelArea: { top: number; bottom: number; left: number; right: number }): void {
    // Column labels (A-P) - top and bottom
    for (let x = 0; x < this.GRID_WIDTH; x++) {
      const letter = String.fromCharCode(65 + x); // A-P
      const xPos = labelArea.left + x * this.cellSize + this.cellSize / 2;

      // Top labels
      const topLabel = new PIXI.Text({
        text: letter,
        style: {
          fontSize: 16,
          fill: this.config.labelColor,
          align: 'center',
        }
      });
      topLabel.anchor.set(0.5, 0.5);
      topLabel.x = xPos;
      topLabel.y = labelArea.top / 2;
      this.sideLabels.addChild(topLabel);

      // Bottom labels
      const bottomLabel = new PIXI.Text({
        text: letter,
        style: {
          fontSize: 16,
          fill: this.config.labelColor,
          align: 'center',
        }
      });
      bottomLabel.anchor.set(0.5, 0.5);
      bottomLabel.x = xPos;
      bottomLabel.y = this.config.height - labelArea.bottom / 2;
      this.sideLabels.addChild(bottomLabel);
    }

    // Row labels (1-12) - left and right
    for (let y = 0; y < this.GRID_HEIGHT; y++) {
      const number = (y + 1).toString();
      const yPos = labelArea.top + y * this.cellSize + this.cellSize / 2;

      // Left labels
      const leftLabel = new PIXI.Text({
        text: number,
        style: {
          fontSize: 16,
          fill: this.config.labelColor,
          align: 'center',
        }
      });
      leftLabel.anchor.set(0.5, 0.5);
      leftLabel.x = labelArea.left / 2;
      leftLabel.y = yPos;
      this.sideLabels.addChild(leftLabel);

      // Right labels
      const rightLabel = new PIXI.Text({
        text: number,
        style: {
          fontSize: 16,
          fill: this.config.labelColor,
          align: 'center',
        }
      });
      rightLabel.anchor.set(0.5, 0.5);
      rightLabel.x = this.config.width - labelArea.right / 2;
      rightLabel.y = yPos;
      this.sideLabels.addChild(rightLabel);
    }
  }

  /**
   * Setup interaction handlers
   */
  private setupInteraction(): void {
    for (let y = 0; y < this.GRID_HEIGHT; y++) {
      for (let x = 0; x < this.GRID_WIDTH; x++) {
        const cell = this.cells[y][x];

        cell.on('pointerdown', () => {
          this.handleCellClick(x, y);
        });

        cell.on('pointerover', () => {
          cell.tint = 0x3498db;
        });

        cell.on('pointerout', () => {
          cell.tint = 0xffffff;
        });
      }
    }
  }

  /**
   * Handle cell click
   */
  private handleCellClick(x: number, y: number): void {
    const column = String.fromCharCode(65 + x); // A-P
    const row = y + 1; // 1-12

    const event: GridClickEvent = {
      position: { x, y },
      column,
      row
    };

    console.log(`🎯 Clicked: ${column}${row} (${x}, ${y})`);

    if (this.clickHandler) {
      this.clickHandler(event);
    }
  }

  /**
   * Set click handler
   */
  setClickHandler(handler: (event: GridClickEvent) => void): void {
    this.clickHandler = handler;
  }

  /**
   * Update configuration
   */
  async updateConfig(newConfig: Partial<GridConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.calculateCellSize();
    await this.initializeGrid();
    this.setupInteraction();
    this.render();
  }

  /**
   * Get grid dimensions
   */
  getDimensions(): GridDimensions {
    const labelArea = this.getLabelArea();
    return {
      totalWidth: this.config.width,
      totalHeight: this.config.height,
      cellSize: this.cellSize,
      labelArea
    };
  }

  /**
   * Highlight a specific cell
   */
  highlightCell(x: number, y: number, color: number = 0xe74c3c): void {
    if (x >= 0 && x < this.GRID_WIDTH && y >= 0 && y < this.GRID_HEIGHT) {
      this.cells[y][x].tint = color;
    }
  }

  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    for (let y = 0; y < this.GRID_HEIGHT; y++) {
      for (let x = 0; x < this.GRID_WIDTH; x++) {
        this.cells[y][x].tint = 0xffffff;
      }
    }
  }

  /**
   * Render the battlefield
   */
  private render(): void {
    this.app.render();
  }

  /**
   * Resize the battlefield
   */
  async resize(width: number, height: number): Promise<void> {
    this.config.width = width;
    this.config.height = height;
    this.app.renderer.resize(width, height);
    this.calculateCellSize();
    await this.initializeGrid();
    this.setupInteraction();
    this.render();
  }

  /**
   * Set entity click handler
   */
  setEntityClickHandler(handler: (entity: EntityInfo) => void): void {
    this.entityClickHandler = handler;
  }

  /**
   * Convert grid position to screen coordinates
   */
  private gridToScreen(position: GridPosition): { x: number; y: number } {
    const labelArea = this.getLabelArea();
    return {
      x: labelArea.left + position.x * this.cellSize + this.cellSize / 2,
      y: labelArea.top + position.y * this.cellSize + this.cellSize / 2
    };
  }

  /**
   * Convert screen coordinates to grid position
   */
  private screenToGrid(x: number, y: number): GridPosition | null {
    const labelArea = this.getLabelArea();
    const gridX = Math.floor((x - labelArea.left) / this.cellSize);
    const gridY = Math.floor((y - labelArea.top) / this.cellSize);

    if (gridX >= 0 && gridX < this.GRID_WIDTH && gridY >= 0 && gridY < this.GRID_HEIGHT) {
      return { x: gridX, y: gridY };
    }
    return null;
  }

  /**
   * Spawn a player entity with animated sprite
   */
  async spawnPlayer(id: string, position: GridPosition, color: string, name: string): Promise<void> {
    this.removePlayer(id); // Remove existing player if any

    try {
      // Create animated player sprite
      const playerSprite = await this.spriteEntityManager.createPlayerSprite(color, position, id);
      
      if (!playerSprite) {
        console.error(`Failed to create sprite for player: ${id}`);
        return;
      }

      // Position the sprite
      const screenPos = this.gridToScreen(position);
      playerSprite.x = screenPos.x;
      playerSprite.y = screenPos.y;
      playerSprite.interactive = true;
      playerSprite.cursor = 'pointer';

      // Create name label
      const label = new PIXI.Text({
        text: name,
        style: {
          fontSize: Math.max(10, this.cellSize * 0.15),
          fill: 0xffffff,
          align: 'center',
          stroke: { color: 0x000000, width: 1 }
        }
      });
      label.anchor.set(0.5, 0.5);
      label.x = screenPos.x;
      label.y = screenPos.y + this.cellSize * 0.4;

      // Store references
      this.players.set(id, playerSprite);
      this.playerLabels.set(id, label);

      // Initialize animation state
      this.animationStateManager.initializeEntity(id, 'player', position);

      // Add to stage
      this.playerLayer.addChild(playerSprite);
      this.uiLayer.addChild(label);

      // Setup click handler
      playerSprite.on('pointerdown', (event) => {
        event.stopPropagation();
        if (this.entityClickHandler) {
          const entityInfo: EntityInfo = {
            type: 'player',
            id,
            name,
            position,
            data: { id, name, position, color, isAlive: true, damage: 0, deaths: 0 } as Player
          };
          this.entityClickHandler(entityInfo);
        }
      });

      this.render();
      console.log(`✅ Spawned animated player: ${name} at (${position.x}, ${position.y})`);
    } catch (error) {
      console.error(`❌ Failed to spawn player: ${id}`, error);
    }
  }

  /**
   * Update player position
   */
  updatePlayerPosition(id: string, newPosition: GridPosition): void {
    const player = this.players.get(id);
    const label = this.playerLabels.get(id);

    if (player && label) {
      const screenPos = this.gridToScreen(newPosition);
      player.x = screenPos.x;
      player.y = screenPos.y;
      label.x = screenPos.x;
      label.y = screenPos.y + this.cellSize * 0.4;
      this.render();
    }
  }

  /**
   * Move player with smooth animation
   */
  async movePlayerSmooth(id: string, newPosition: GridPosition): Promise<void> {
    console.log(`🎬 movePlayerSmooth called for ${id} to position (${newPosition.x}, ${newPosition.y})`);
    
    const player = this.players.get(id);
    const label = this.playerLabels.get(id);
    
    if (!player || !label) {
      console.warn(`Player not found for smooth movement: ${id}`);
      return;
    }

    // Get current position
    const currentPosition = this.screenToGrid(player.x, player.y);
    if (!currentPosition) {
      console.warn(`Could not determine current position for player: ${id}`);
      return;
    }

    console.log(`🎬 Current position: (${currentPosition.x}, ${currentPosition.y}), Target: (${newPosition.x}, ${newPosition.y})`);

    // Start movement animation
    this.animationStateManager.startMoving(id, newPosition);

    try {
      // Perform smooth movement
      await this.movementTweener.moveEntity(id, player, currentPosition, newPosition, undefined, this.cellSize);
      
      // Update label position
      const screenPos = this.gridToScreen(newPosition);
      label.x = screenPos.x;
      label.y = screenPos.y + this.cellSize * 0.4;
      
      // Finish movement animation
      this.animationStateManager.finishMoving(id);
      
      console.log(`✅ Completed smooth movement for player: ${id}`);
    } catch (error) {
      console.error(`❌ Smooth movement failed for player: ${id}`, error);
      // Fallback to instant movement
      this.updatePlayerPosition(id, newPosition);
      this.animationStateManager.finishMoving(id);
    }
  }

  /**
   * Trigger player attack animation
   */
  triggerPlayerAttack(id: string): void {
    console.log(`⚔️ triggerPlayerAttack called for ${id}`);
    this.animationStateManager.triggerAttack(id);
  }

  /**
   * Set player as dead
   */
  setPlayerDead(id: string): void {
    this.animationStateManager.setEntityDead(id);
  }

  /**
   * Set player as alive
   */
  setPlayerAlive(id: string): void {
    this.animationStateManager.setEntityAlive(id);
  }

  /**
   * Trigger boss attack animation
   */
  triggerBossAttack(): void {
    this.animationStateManager.triggerAttack('boss');
  }

  /**
   * Set boss as dead
   */
  setBossDead(): void {
    this.animationStateManager.setEntityDead('boss');
  }

  /**
   * Set boss as alive
   */
  setBossAlive(): void {
    this.animationStateManager.setEntityAlive('boss');
  }

  /**
   * Update player state (alive/dead)
   */
  updatePlayerState(id: string, isAlive: boolean, _damage: number, _deaths: number): void {
    const player = this.players.get(id);
    const label = this.playerLabels.get(id);

    if (player && label) {
      if (isAlive) {
        player.alpha = 1.0;
        player.tint = 0xffffff;
        label.alpha = 1.0;
      } else {
        player.alpha = 0.5;
        player.tint = 0x666666; // Gray out dead players
        label.alpha = 0.7;
        label.text = `${label.text} (DEAD)`;
      }
      this.render();
    }
  }

  /**
   * Remove a player
   */
  removePlayer(id: string): void {
    const player = this.players.get(id);
    const label = this.playerLabels.get(id);

    if (player) {
      this.playerLayer.removeChild(player);
      this.spriteEntityManager.destroySprite(id);
      this.players.delete(id);
    }

    if (label) {
      this.uiLayer.removeChild(label);
      this.playerLabels.delete(id);
    }

    // Clean up animation state
    this.animationStateManager.removeEntity(id);
    this.movementTweener.stopTween(id);

    this.render();
  }

  /**
   * Spawn boss entity with animated sprite
   */
  async spawnBoss(position: GridPosition): Promise<void> {
    this.removeBoss(); // Remove existing boss if any

    try {
      // Create animated boss sprite
      const bossSprite = await this.spriteEntityManager.createBossSprite(position, 'boss');
      
      if (!bossSprite) {
        console.error(`Failed to create sprite for boss`);
        return;
      }

      // Position the sprite
      const screenPos = this.gridToScreen(position);
      bossSprite.x = screenPos.x;
      bossSprite.y = screenPos.y;
      bossSprite.interactive = true;
      bossSprite.cursor = 'pointer';

      const bossSize = this.cellSize * 0.4;

      // Create health bar background
      this.bossHealthBar = new PIXI.Graphics();
      this.bossHealthBar.fill({ color: 0x333333 });
      this.bossHealthBar.rect(-bossSize * 1.2, -bossSize * 1.5, bossSize * 2.4, 8);
      this.bossHealthBar.fill();

      this.bossHealthBar.x = screenPos.x;
      this.bossHealthBar.y = screenPos.y;

      // Create boss label
      this.bossLabel = new PIXI.Text({
        text: 'BOSS',
        style: {
          fontSize: Math.max(12, this.cellSize * 0.2),
          fill: 0xffffff,
          align: 'center',
          stroke: { color: 0x000000, width: 2 }
        }
      });
      this.bossLabel.anchor.set(0.5, 0.5);
      this.bossLabel.x = screenPos.x;
      this.bossLabel.y = screenPos.y + bossSize * 1.2;

      // Store reference
      this.boss = bossSprite;

      // Initialize animation state
      this.animationStateManager.initializeEntity('boss', 'boss', position);

      // Add to stage
      this.bossLayer.addChild(bossSprite);
      this.uiLayer.addChild(this.bossHealthBar);
      this.uiLayer.addChild(this.bossLabel);

      // Setup click handler
      bossSprite.on('pointerdown', (event) => {
        event.stopPropagation();
        if (this.entityClickHandler) {
          const entityInfo: EntityInfo = {
            type: 'boss',
            id: 'boss',
            name: 'Boss',
            position,
            data: { position, currentHealth: 100, maxHealth: 100, phase: 1, isAlive: true } as Boss
          };
          this.entityClickHandler(entityInfo);
        }
      });

      this.render();
      console.log(`✅ Spawned animated boss at (${position.x}, ${position.y})`);
    } catch (error) {
      console.error(`❌ Failed to spawn boss`, error);
    }
  }

  /**
   * Update boss health and state
   */
  updateBoss(health: number, maxHealth: number, phase: number = 1, isAlive: boolean = true): void {
    if (!this.boss || !this.bossHealthBar) return;

    // Update health bar
    const bossSize = this.cellSize * 0.4;
    const healthPercent = Math.max(0, health / maxHealth);

    // Clear and redraw health bar
    this.bossHealthBar.clear();
    this.bossHealthBar.fill({ color: 0x333333 });
    this.bossHealthBar.rect(-bossSize * 1.2, -bossSize * 1.5, bossSize * 2.4, 8);
    this.bossHealthBar.fill();

    // Health bar fill
    this.bossHealthBar.fill({ color: this.getHealthBarColor(healthPercent) });
    this.bossHealthBar.rect(-bossSize * 1.2, -bossSize * 1.5, bossSize * 2.4 * healthPercent, 8);
    this.bossHealthBar.fill();

    // Update boss sprite appearance based on phase
    const phaseColor = this.getBossPhaseColor(phase);
    this.boss.tint = phaseColor;

    // Update label with health info
    if (this.bossLabel) {
      this.bossLabel.text = `BOSS (${health}/${maxHealth}) - Phase ${phase}`;
    }

    // Gray out if dead
    if (!isAlive) {
      this.boss.alpha = 0.5;
      this.boss.tint = 0x666666;
    } else {
      this.boss.alpha = 1.0;
      this.boss.tint = 0xffffff;
    }

    this.render();
  }

  /**
   * Remove boss
   */
  removeBoss(): void {
    if (this.boss) {
      this.bossLayer.removeChild(this.boss);
      this.spriteEntityManager.destroySprite('boss');
      this.boss = null;
    }
    if (this.bossHealthBar) {
      this.uiLayer.removeChild(this.bossHealthBar);
      this.bossHealthBar = null;
    }
    if (this.bossLabel) {
      this.uiLayer.removeChild(this.bossLabel);
      this.bossLabel = null;
    }

    // Clean up animation state
    this.animationStateManager.removeEntity('boss');
    this.movementTweener.stopTween('boss');

    this.render();
  }

  /**
   * Clear all entities
   */
  clearAllEntities(): void {
    // Remove all players
    for (const [id] of this.players) {
      this.removePlayer(id);
    }

    // Remove boss
    this.removeBoss();
  }

  /**
   * Get health bar color based on health percentage
   */
  private getHealthBarColor(healthPercent: number): number {
    if (healthPercent > 0.6) return 0x00ff00; // Green
    if (healthPercent > 0.3) return 0xffff00; // Yellow
    return 0xff0000; // Red
  }

  /**
   * Get boss color based on phase
   */
  private getBossPhaseColor(phase: number): number {
    switch (phase) {
      case 1: return 0xff0000; // Red
      case 2: return 0xff6600; // Orange
      case 3: return 0x9900ff; // Purple
      default: return 0xff0000;
    }
  }


  /**
   * Get all player IDs
   */
  getPlayerIds(): string[] {
    return Array.from(this.players.keys());
  }

  /**
   * Get entity at position
   */
  getEntityAtPosition(position: GridPosition): EntityInfo | null {
    // Check players
    for (const [id, player] of this.players) {
      const label = this.playerLabels.get(id);
      if (label) {
        const playerPos = this.screenToGrid(player.x, player.y);
        if (playerPos && playerPos.x === position.x && playerPos.y === position.y) {
          return {
            type: 'player',
            id,
            name: label.text,
            position,
            data: { id, name: label.text, position, color: 'blue', isAlive: true, damage: 0, deaths: 0 } as Player
          };
        }
      }
    }

    // Check boss
    if (this.boss) {
      const bossPos = this.screenToGrid(this.boss.x, this.boss.y);
      if (bossPos && bossPos.x === position.x && bossPos.y === position.y) {
        return {
          type: 'boss',
          id: 'boss',
          name: 'Boss',
          position,
          data: { position, currentHealth: 100, maxHealth: 100, phase: 1, isAlive: true } as Boss
        };
      }
    }

    return null;
  }

  /**
   * Regenerate terrain with new pattern
   */
  async regenerateTerrain(terrainType: string = 'mixed'): Promise<void> {
    const labelArea = this.getLabelArea();
    
    // Clear existing terrain
    this.terrainLayer.removeChildren();
    
    // Generate new terrain pattern
    this.terrainPattern = this.terrainManager.generateRandomTerrain(
      this.GRID_WIDTH, 
      this.GRID_HEIGHT, 
      terrainType
    );
    
    // Create new terrain sprites
    const terrainSprites = this.terrainManager.createTerrainSprites(
      this.terrainPattern, 
      this.cellSize
    );
    
    // Position terrain sprites accounting for label area
    terrainSprites.forEach(sprite => {
      sprite.x += labelArea.left;
      sprite.y += labelArea.top;
      this.terrainLayer.addChild(sprite);
    });
    
    console.log(`🔄 Regenerated terrain with ${terrainSprites.length} sprites`);
  }

  /**
   * Initialize mechanic systems
   */
  private initializeMechanicSystems(): void {
    const labelArea = this.getLabelArea();
    
    // Initialize mechanic warning system
    this.mechanicWarningSystem = new MechanicWarningSystem(
      this.mechanicWarningLayer,
      this.mechanicCountdownLayer,
      this.cellSize,
      labelArea
    );
    
    // Initialize mechanic effects system
    this.mechanicEffects = new MechanicEffects(
      this.mechanicEffectsLayer,
      this.cellSize,
      labelArea
    );
  }

  /**
   * Show meteor warning
   */
  showMeteorWarning(impactZones: GridPosition[], warningDuration: number): string {
    if (!this.mechanicWarningSystem) {
      console.warn('Mechanic warning system not initialized');
      return '';
    }
    
    return this.mechanicWarningSystem.addMeteorWarning(impactZones, warningDuration);
  }

  /**
   * Show lava wave warning (column)
   */
  showLavaWaveWarning(column: number, warningDuration: number): string {
    if (!this.mechanicWarningSystem) {
      console.warn('Mechanic warning system not initialized');
      return '';
    }
    
    return this.mechanicWarningSystem.addLavaWaveWarning(column, warningDuration);
  }

  /**
   * Show lava wave warning (row)
   */
  showLavaWaveWarningRow(row: number, warningDuration: number): string {
    if (!this.mechanicWarningSystem) {
      console.warn('Mechanic warning system not initialized');
      return '';
    }
    
    return this.mechanicWarningSystem.addLavaWaveWarningRow(row, warningDuration);
  }

  /**
   * Activate meteor strike
   */
  activateMeteorStrike(impactZones: GridPosition[]): void {
    if (!this.mechanicEffects) {
      console.warn('Mechanic effects system not initialized');
      return;
    }
    
    // Create explosion effects for each impact zone
    impactZones.forEach(position => {
      this.mechanicEffects!.createMeteorExplosion(position);
    });
    
    console.log(`💥 Activated meteor strike on ${impactZones.length} zones`);
  }

  /**
   * Activate lava wave
   */
  activateLavaWave(column?: number, row?: number): void {
    if (!this.mechanicEffects) {
      console.warn('Mechanic effects system not initialized');
      return;
    }
    
    if (column !== undefined) {
      // Vertical lava wave
      this.mechanicEffects.createLavaWaveFlow(column, 'vertical');
      console.log(`🌊 Activated lava wave on column ${column}`);
    } else if (row !== undefined) {
      // Horizontal lava wave
      this.mechanicEffects.createLavaWaveFlow(row, 'horizontal');
      console.log(`🌊 Activated lava wave on row ${row}`);
    }
  }

  /**
   * Clear mechanic warning
   */
  clearMechanicWarning(warningId: string): void {
    if (!this.mechanicWarningSystem) {
      console.warn('Mechanic warning system not initialized');
      return;
    }
    
    this.mechanicWarningSystem.removeWarning(warningId);
  }

  /**
   * Clear all mechanic warnings
   */
  clearAllMechanicWarnings(): void {
    if (!this.mechanicWarningSystem) {
      console.warn('Mechanic warning system not initialized');
      return;
    }
    
    this.mechanicWarningSystem.clearAllWarnings();
  }

  /**
   * Clear all mechanic effects
   */
  clearAllMechanicEffects(): void {
    if (!this.mechanicEffects) {
      console.warn('Mechanic effects system not initialized');
      return;
    }
    
    this.mechanicEffects.clearAllEffects();
  }

  /**
   * Get active mechanic warning count
   */
  getActiveMechanicWarningCount(): number {
    return this.mechanicWarningSystem?.getActiveWarningCount() || 0;
  }

  /**
   * Get active mechanic effect count
   */
  getActiveMechanicEffectCount(): number {
    return this.mechanicEffects?.getActiveEffectCount() || 0;
  }

  /**
   * Destroy the battlefield
   */
  destroy(): void {
    console.log('🧹 Destroying GridBattlefield...');

    try {
      // Clear all entities first
      this.clearAllEntities();

      // Clean up mechanic systems
      if (this.mechanicWarningSystem) {
        this.mechanicWarningSystem.destroy();
        this.mechanicWarningSystem = null;
      }
      
      if (this.mechanicEffects) {
        this.mechanicEffects.destroy();
        this.mechanicEffects = null;
      }

      // Clean up terrain resources
      if (this.terrainManager) {
        this.terrainManager.destroy();
      }
      
      // Clean up sprite entity resources
      if (this.spriteEntityManager) {
        this.spriteEntityManager.destroy();
      }
      
      // Clean up animation systems
      if (this.animationStateManager) {
        this.animationStateManager.destroy();
      }
      
      if (this.movementTweener) {
        this.movementTweener.destroy();
      }
      
      if (this.spriteManager) {
        this.spriteManager.destroyAll();
      }

      // Remove canvas from DOM safely
      if (this.app.canvas && this.app.canvas.parentNode) {
        console.log('🗑️ Removing canvas from DOM...');
        try {
          // Check if the parent still contains the canvas before removing
          if (this.app.canvas.parentNode.contains(this.app.canvas)) {
            this.app.canvas.parentNode.removeChild(this.app.canvas);
          } else {
            console.log('ℹ️ Canvas already removed from parent');
          }
        } catch (error) {
          // This is expected in some cleanup scenarios
          console.log('ℹ️ Canvas removal handled by React:', (error as Error).message);
        }
      }

      // Destroy PIXI application
      // Pass true to remove canvas from DOM and destroy all children
      if (this.app) {
        this.app.destroy(true);
      }

      // Clear references
      this.players.clear();
      this.playerLabels.clear();
      this.boss = null;
      this.bossHealthBar = null;
      this.bossLabel = null;

      console.log('✅ GridBattlefield destroyed');
    } catch (error) {
      console.error('❌ Error during battlefield destruction:', error);
      // Don't rethrow - cleanup should be fault-tolerant
    }
  }
}
