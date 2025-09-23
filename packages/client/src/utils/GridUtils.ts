import type { Position } from '@pumpfun-game/shared';

export interface GridConfig {
  gridWidth: number;
  gridHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  padding?: number;
}

export interface PixelPosition {
  x: number;
  y: number;
}

// Default grid configuration
export const DEFAULT_GRID_CONFIG: GridConfig = {
  gridWidth: 16,
  gridHeight: 12,
  canvasWidth: 800,
  canvasHeight: 600,
  padding: 20
};

/**
 * Convert grid coordinates to pixel coordinates
 * @param gridX Grid X coordinate (0-based)
 * @param gridY Grid Y coordinate (0-based)
 * @param config Grid configuration
 * @returns Pixel position
 */
export function gridToPixels(
  gridX: number, 
  gridY: number, 
  config: GridConfig = DEFAULT_GRID_CONFIG
): PixelPosition {
  const { canvasWidth, canvasHeight, gridWidth, gridHeight, padding = 20 } = config;
  
  // Calculate cell size
  const cellWidth = (canvasWidth - padding * 2) / gridWidth;
  const cellHeight = (canvasHeight - padding * 2) / gridHeight;
  
  // Convert to pixel coordinates (center of cell)
  const pixelX = padding + (gridX * cellWidth) + (cellWidth / 2);
  const pixelY = padding + (gridY * cellHeight) + (cellHeight / 2);
  
  return { x: pixelX, y: pixelY };
}

/**
 * Convert pixel coordinates to grid coordinates
 * @param pixelX Pixel X coordinate
 * @param pixelY Pixel Y coordinate
 * @param config Grid configuration
 * @returns Grid position
 */
export function pixelsToGrid(
  pixelX: number, 
  pixelY: number, 
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position {
  const { canvasWidth, canvasHeight, gridWidth, gridHeight, padding = 20 } = config;
  
  // Calculate cell size
  const cellWidth = (canvasWidth - padding * 2) / gridWidth;
  const cellHeight = (canvasHeight - padding * 2) / gridHeight;
  
  // Convert to grid coordinates
  const gridX = Math.floor((pixelX - padding) / cellWidth);
  const gridY = Math.floor((pixelY - padding) / cellHeight);
  
  return { x: gridX, y: gridY };
}

/**
 * Get cell size in pixels
 * @param config Grid configuration
 * @returns Cell dimensions
 */
export function getCellSize(config: GridConfig = DEFAULT_GRID_CONFIG): { width: number; height: number } {
  const { canvasWidth, canvasHeight, gridWidth, gridHeight, padding = 20 } = config;
  
  return {
    width: (canvasWidth - padding * 2) / gridWidth,
    height: (canvasHeight - padding * 2) / gridHeight
  };
}

/**
 * Check if grid position is valid
 * @param x Grid X coordinate
 * @param y Grid Y coordinate
 * @param config Grid configuration
 * @returns True if position is valid
 */
export function isValidGridPosition(
  x: number, 
  y: number, 
  config: GridConfig = DEFAULT_GRID_CONFIG
): boolean {
  return x >= 0 && x < config.gridWidth && y >= 0 && y < config.gridHeight;
}

/**
 * Get grid position label (e.g., "A1", "B2")
 * @param x Grid X coordinate
 * @param y Grid Y coordinate
 * @returns Grid label
 */
export function getGridLabel(x: number, y: number): string {
  const letter = String.fromCharCode(65 + x); // A, B, C, etc.
  const number = y + 1; // 1-based numbering
  return `${letter}${number}`;
}

/**
 * Parse grid label to coordinates
 * @param label Grid label (e.g., "A1", "B2")
 * @returns Grid coordinates
 */
export function parseGridLabel(label: string): Position | null {
  const match = label.match(/^([A-Z])(\d+)$/);
  if (!match) return null;
  
  const x = match[1].charCodeAt(0) - 65; // Convert A=0, B=1, etc.
  const y = parseInt(match[2]) - 1; // Convert to 0-based
  
  return { x, y };
}

/**
 * Get all grid positions
 * @param config Grid configuration
 * @returns Array of all valid grid positions
 */
export function getAllGridPositions(config: GridConfig = DEFAULT_GRID_CONFIG): Position[] {
  const positions: Position[] = [];
  
  for (let x = 0; x < config.gridWidth; x++) {
    for (let y = 0; y < config.gridHeight; y++) {
      positions.push({ x, y });
    }
  }
  
  return positions;
}

/**
 * Get grid positions in a rectangle
 * @param startX Start X coordinate
 * @param startY Start Y coordinate
 * @param width Rectangle width
 * @param height Rectangle height
 * @param config Grid configuration
 * @returns Array of grid positions in rectangle
 */
export function getGridPositionsInRect(
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position[] {
  const positions: Position[] = [];
  
  for (let x = startX; x < startX + width && x < config.gridWidth; x++) {
    for (let y = startY; y < startY + height && y < config.gridHeight; y++) {
      if (isValidGridPosition(x, y, config)) {
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
}

/**
 * Get grid positions in a circle
 * @param centerX Center X coordinate
 * @param centerY Center Y coordinate
 * @param radius Circle radius
 * @param config Grid configuration
 * @returns Array of grid positions in circle
 */
export function getGridPositionsInCircle(
  centerX: number,
  centerY: number,
  radius: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position[] {
  const positions: Position[] = [];
  
  for (let x = Math.max(0, centerX - radius); x <= Math.min(config.gridWidth - 1, centerX + radius); x++) {
    for (let y = Math.max(0, centerY - radius); y <= Math.min(config.gridHeight - 1, centerY + radius); y++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (distance <= radius && isValidGridPosition(x, y, config)) {
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
}

/**
 * Calculate distance between two grid positions
 * @param pos1 First position
 * @param pos2 Second position
 * @returns Distance in grid units
 */
export function getGridDistance(pos1: Position, pos2: Position): number {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}

/**
 * Get adjacent grid positions
 * @param position Center position
 * @param config Grid configuration
 * @returns Array of adjacent positions
 */
export function getAdjacentPositions(
  position: Position,
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position[] {
  const adjacent: Position[] = [];
  const directions = [
    { x: -1, y: 0 },  // Left
    { x: 1, y: 0 },   // Right
    { x: 0, y: -1 },   // Up
    { x: 0, y: 1 }    // Down
  ];
  
  for (const dir of directions) {
    const newX = position.x + dir.x;
    const newY = position.y + dir.y;
    
    if (isValidGridPosition(newX, newY, config)) {
      adjacent.push({ x: newX, y: newY });
    }
  }
  
  return adjacent;
}

/**
 * Get positions within range
 * @param position Center position
 * @param range Range in grid units
 * @param config Grid configuration
 * @returns Array of positions within range
 */
export function getPositionsInRange(
  position: Position,
  range: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position[] {
  const positions: Position[] = [];
  
  for (let x = Math.max(0, position.x - range); x <= Math.min(config.gridWidth - 1, position.x + range); x++) {
    for (let y = Math.max(0, position.y - range); y <= Math.min(config.gridHeight - 1, position.y + range); y++) {
      const distance = getGridDistance(position, { x, y });
      if (distance <= range && isValidGridPosition(x, y, config)) {
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
}
