export interface GridPosition {
  x: number; // 0-15 (A-P)
  y: number; // 0-11 (1-12)
}

export interface GridConfig {
  width: number;
  height: number;
  cellSize: number;
  showLabels: boolean;
  showGrid: boolean;
  backgroundColor: number;
  gridColor: number;
  labelColor: number;
}

export interface GridClickEvent {
  position: GridPosition;
  column: string; // A-P
  row: number; // 1-12
}

export interface GridDimensions {
  totalWidth: number;
  totalHeight: number;
  cellSize: number;
  labelArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}
