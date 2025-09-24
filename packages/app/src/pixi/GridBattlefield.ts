import * as PIXI from 'pixi.js';
import type { GridConfig, GridClickEvent, GridDimensions } from '../types/GridTypes';

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
  
  // Configuration
  private config: GridConfig;
  
  // Event handlers
  private clickHandler?: (event: GridClickEvent) => void;

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
    
    // Add to container
    this.container.addChild(this.background);
    this.container.addChild(this.gridLines);
    this.container.addChild(this.sideLabels);
  }

  /**
   * Initialize the battlefield
   */
  async init(container: HTMLElement, width: number = 800, height: number = 600): Promise<void> {
    this.config.width = width;
    this.config.height = height;
    
    // Initialize PIXI app
    await this.app.init({
      width,
      height,
      backgroundColor: this.config.backgroundColor,
      antialias: true,
    });

    // Mount to container
    container.appendChild(this.app.canvas);
    
    // Add main container to stage
    this.app.stage.addChild(this.container);
    
    // Calculate optimal cell size
    this.calculateCellSize();
    
    // Initialize grid
    this.initializeGrid();
    
    // Setup interaction
    this.setupInteraction();
    
    // Render initial state
    this.render();
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
   * Destroy the battlefield
   */
  destroy(): void {
    this.app.destroy(true);
  }
}
