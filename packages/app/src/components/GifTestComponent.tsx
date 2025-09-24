import React, { useEffect, useRef, useState } from 'react';
import { GifManager } from '../assets/GifManager';
import { GifRenderer } from '../pixi/GifRenderer';
import type { AnimationState } from '../types/GifTypes';

export const GifTestComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gifManagerRef = useRef<GifManager | null>(null);
  const rendererRef = useRef<GifRenderer | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const initGifTest = async () => {
      try {
        // Initialize GIF Manager
        const gifManager = new GifManager({
          basePath: '/src/assets/gifs',
          assets: {
            'archer_idle': 'Archer_IDLE.gif',
            'archer_walk': 'Archer_WALK.gif',
            'archer_shoot': 'Archer_SHOOT.gif'
          }
        });

        gifManager.registerAssets();
        await gifManager.loadAll();

        // Initialize Renderer
        const renderer = new GifRenderer(gifManager);
        await renderer.init(containerRef.current!, 600, 400);

        // Create archer character
        const character = renderer.createCharacter('archer', ['archer_idle', 'archer_walk', 'archer_shoot']);
        
        if (!(character as any).imageElement) {
          console.error('❌ Failed to create character image element');
          return;
        }

        gifManagerRef.current = gifManager;
        rendererRef.current = renderer;
        setIsLoaded(true);

        // Start demo sequence
        startDemo(renderer);

      } catch (error) {
        console.error('❌ Failed to initialize GIF test:', error);
      }
    };

    initGifTest();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
      }
    };
  }, []);

  const startDemo = (renderer: GifRenderer) => {
    // Start with idle
    setCurrentAnimation('idle');
    
    // Walk after 3 seconds
    setTimeout(() => {
      renderer.setAnimation('archer', 'archer_walk');
      setCurrentAnimation('walk');
    }, 3000);

    // Shoot after 6 seconds
    setTimeout(() => {
      renderer.setAnimation('archer', 'archer_shoot');
      setCurrentAnimation('shoot');
    }, 6000);

    // Back to idle after 9 seconds
    setTimeout(() => {
      renderer.setAnimation('archer', 'archer_idle');
      setCurrentAnimation('idle');
    }, 9000);
  };

  const handleAnimationChange = (animation: AnimationState) => {
    if (!rendererRef.current) return;

    const animationMap = {
      idle: 'archer_idle',
      walk: 'archer_walk',
      shoot: 'archer_shoot'
    };

    rendererRef.current.setAnimation('archer', animationMap[animation]);
    setCurrentAnimation(animation);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '8px' }}>
      <h2 style={{ color: 'white', marginBottom: '10px' }}>🎬 GIF Animation Test</h2>
      
      {!isLoaded && (
        <div style={{ color: '#f39c12' }}>🔄 Loading GIF assets...</div>
      )}
      
      {isLoaded && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: 'white', marginBottom: '10px' }}>
            Current Animation: <strong style={{ color: '#3498db' }}>{currentAnimation.toUpperCase()}</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleAnimationChange('idle')} 
                    style={{ padding: '8px 16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              🧍 IDLE
            </button>
            <button onClick={() => handleAnimationChange('walk')}
                    style={{ padding: '8px 16px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              🚶 WALK
            </button>
            <button onClick={() => handleAnimationChange('shoot')}
                    style={{ padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              🏹 SHOOT
            </button>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ border: '2px solid #3498db', borderRadius: '4px', overflow: 'hidden' }} />
    </div>
  );
};
