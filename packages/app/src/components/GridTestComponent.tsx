import React, { useEffect, useRef, useState } from 'react';
import { GridBattlefield } from '../pixi/GridBattlefield';
import type { GridClickEvent } from '../types/GridTypes';

export const GridTestComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const battlefieldRef = useRef<GridBattlefield | null>(null);
  const isInitializedRef = useRef(false);
  
  // UI state
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastClick, setLastClick] = useState<GridClickEvent | null>(null);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitializedRef.current || !containerRef.current) return;
    isInitializedRef.current = true;

    const initGridTest = async () => {
      try {
        // Clean up any existing battlefield first
        if (battlefieldRef.current) {
          battlefieldRef.current.destroy();
          battlefieldRef.current = null;
        }

        // Clear the container completely
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Initialize Grid Battlefield with larger cells
        const battlefield = new GridBattlefield({
          showLabels: true,
          showGrid: true,
          cellSize: 60, // Increased from 50 to 60
          backgroundColor: 0x90EE90, // Light green
          gridColor: 0x2E8B57, // Dark green for contrast
          labelColor: 0x2E8B57, // Dark green labels
        });
        
        await battlefield.init(containerRef.current!, 1200, 800); // Increased canvas size
        
        // Set click handler
        battlefield.setClickHandler((event: GridClickEvent) => {
          setLastClick(event);
          console.log(`🎯 Clicked: ${event.column}${event.row} (${event.position.x}, ${event.position.y})`);
        });

        battlefieldRef.current = battlefield;
        setIsLoaded(true);

      } catch (error) {
        console.error('❌ Failed to initialize Grid test:', error);
        isInitializedRef.current = false; // Reset flag on error
      }
    };

    initGridTest();

    return () => {
      if (battlefieldRef.current) {
        battlefieldRef.current.destroy();
        battlefieldRef.current = null;
      }
      isInitializedRef.current = false; // Reset flag on cleanup
    };
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '8px' }}>
      {!isLoaded && (
        <div style={{ color: '#f39c12', textAlign: 'center', padding: '20px' }}>
          🔄 Initializing battlefield...
        </div>
      )}
      
      {isLoaded && lastClick && (
        <div style={{ color: '#f39c12', textAlign: 'center', marginBottom: '10px', fontSize: '14px' }}>
          Last Click: <strong>{lastClick.column}{lastClick.row}</strong> ({lastClick.position.x}, {lastClick.position.y})
        </div>
      )}

      {/* Battlefield Container */}
      <div 
        ref={containerRef} 
        style={{ 
          border: '2px solid #2E8B57', 
          borderRadius: '4px', 
          overflow: 'hidden',
          backgroundColor: '#90EE90',
          minHeight: '700px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }} 
      />
      
      {isLoaded && (
        <div style={{ color: 'white', textAlign: 'center', marginTop: '10px', fontSize: '12px' }}>
          Click any cell to see coordinates • Grid: 16×12 (A-P, 1-12)
        </div>
      )}
    </div>
  );
};
