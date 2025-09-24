import * as PIXI from 'pixi.js';
import type { GridConfig, GridClickEvent, GridDimensions } from '../types/GridTypes';
import type { GridPosition, Player, Boss, EntityInfo } from '../types/GameTypes';

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
  
  // Entity layers
  private playerLayer: PIXI.Container;
  private bossLayer: PIXI.Container;
  private uiLayer: PIXI.Container;
  
  // Entity management
  private players = new Map<string, PIXI.Graphics>();
  private playerLabels = new Map<string, PIXI.Text>();
  private boss: PIXI.Graphics | null = null;
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
    
    // Create visual elements
    this.background = new PIXI.Graphics();
    this.gridLines = new PIXI.Graphics();
    this.sideLabels = new PIXI.Container();
    
    // Create entity layers
    this.playerLayer = new PIXI.Container();
    this.bossLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();
    
    // Add to container (order matters for rendering)
    this.container.addChild(this.background);
    this.container.addChild(this.gridLines);
    this.container.addChild(this.sideLabels);
    this.container.addChild(this.playerLayer);
    this.container.addChild(this.bossLayer);
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
      this.initializeGrid();
      console.log('✅ Grid initialized');
      
      // Setup interaction
      console.log('🖱️ Setting up interaction...');
      this.setupInteraction();
      console.log('✅ Interaction setup complete');
      
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
  private initializeGrid(): void {
    // Clear existing elements
    this.background.clear();
    this.gridLines.clear();
    this.sideLabels.removeChildren();
    this.cells = [];

    const labelArea = this.getLabelArea();
    
    // Draw background
    this.background.fill({ color: this.config.backgroundColor });
    this.background.rect(0, 0, this.config.width, this.config.height);

    // Draw grid cells
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
   * Draw grid cells
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
  updateConfig(newConfig: Partial<GridConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.calculateCellSize();
    this.initializeGrid();
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
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.app.renderer.resize(width, height);
    this.calculateCellSize();
    this.initializeGrid();
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
   * Spawn a player entity
   */
  spawnPlayer(id: string, position: GridPosition, color: string, name: string): void {
    this.removePlayer(id); // Remove existing player if any

    const screenPos = this.gridToScreen(position);
    
    // Create player circle
    const playerGraphic = new PIXI.Graphics();
    playerGraphic.fill({ color: this.parseColor(color) });
    playerGraphic.circle(0, 0, this.cellSize * 0.3);
    playerGraphic.fill();
    
    // Add border for dead players
    playerGraphic.stroke({ color: 0x000000, width: 2 });
    playerGraphic.circle(0, 0, this.cellSize * 0.3);
    
    playerGraphic.x = screenPos.x;
    playerGraphic.y = screenPos.y;
    playerGraphic.interactive = true;
    playerGraphic.cursor = 'pointer';
    
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
    this.players.set(id, playerGraphic);
    this.playerLabels.set(id, label);
    
    // Add to stage
    this.playerLayer.addChild(playerGraphic);
    this.uiLayer.addChild(label);
    
    // Setup click handler
    playerGraphic.on('pointerdown', (event) => {
      event.stopPropagation();
      if (this.entityClickHandler) {
        // Find player data - we'll need to store this separately or pass it in
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
      this.players.delete(id);
    }
    
    if (label) {
      this.uiLayer.removeChild(label);
      this.playerLabels.delete(id);
    }
    
    this.render();
  }

  /**
   * Spawn boss entity
   */
  spawnBoss(position: GridPosition): void {
    this.removeBoss(); // Remove existing boss if any

    const screenPos = this.gridToScreen(position);
    
    // Create boss diamond shape
    this.boss = new PIXI.Graphics();
    
    const bossSize = this.cellSize * 0.4;
    
    // Draw diamond shape manually
    this.boss.beginFill(0xff0000);
    this.boss.lineStyle(3, 0x000000);
    this.boss.moveTo(-bossSize, 0);
    this.boss.lineTo(0, -bossSize);
    this.boss.lineTo(bossSize, 0);
    this.boss.lineTo(0, bossSize);
    this.boss.lineTo(-bossSize, 0);
    this.boss.endFill();
    
    this.boss.x = screenPos.x;
    this.boss.y = screenPos.y;
    this.boss.interactive = true;
    this.boss.cursor = 'pointer';
    
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
    
    // Add to stage
    this.bossLayer.addChild(this.boss);
    this.uiLayer.addChild(this.bossHealthBar);
    this.uiLayer.addChild(this.bossLabel);
    
    // Setup click handler
    this.boss.on('pointerdown', (event) => {
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
    
    // Update boss appearance based on phase
    this.boss.clear();
    const phaseColor = this.getBossPhaseColor(phase);
    
    // Draw diamond shape manually
    this.boss.beginFill(phaseColor);
    this.boss.lineStyle(3, 0x000000);
    this.boss.moveTo(-bossSize, 0);
    this.boss.lineTo(0, -bossSize);
    this.boss.lineTo(bossSize, 0);
    this.boss.lineTo(0, bossSize);
    this.boss.lineTo(-bossSize, 0);
    this.boss.endFill();
    
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
   * Parse color string to number
   */
  private parseColor(color: string): number {
    const colorMap: Record<string, number> = {
      'blue': 0x0000ff,
      'red': 0xff0000,
      'yellow': 0xffff00,
      'green': 0x00ff00,
      'purple': 0x800080,
      'orange': 0xffa500,
      'pink': 0xffc0cb,
      'cyan': 0x00ffff,
      'black': 0x000000,
      'white': 0xffffff
    };
    return colorMap[color.toLowerCase()] || 0x808080; // Default to gray
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
   * Destroy the battlefield
   */
  destroy(): void {
    console.log('🧹 Destroying GridBattlefield...');
    
    try {
      // Clear all entities first
      this.clearAllEntities();
      
      // Remove canvas from DOM if it exists and is still a child
      if (this.app.canvas && this.app.canvas.parentNode) {
        console.log('🗑️ Removing canvas from DOM...');
        try {
          this.app.canvas.parentNode.removeChild(this.app.canvas);
        } catch (error) {
          console.warn('⚠️ Could not remove canvas from DOM (may have been removed already):', error);
        }
      }
      
      // Destroy PIXI application
      this.app.destroy(true);
      
      console.log('✅ GridBattlefield destroyed');
    } catch (error) {
      console.error('❌ Error during battlefield destruction:', error);
    }
  }
}
