import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { SpriteSheetManager, type SpriteSheetConfig } from '../assets/SpriteSheetManager';
import { SpriteAnimationController } from '../pixi/SpriteAnimationController';
import { SPRITE_SHEET_CONFIGS, getAvailableSpriteSheets } from '../assets/SpriteSheetConfigs';

export const SpriteSheetTestComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spriteManagerRef = useRef<SpriteSheetManager | null>(null);
  const animationControllerRef = useRef<SpriteAnimationController | null>(null);
  const containerRef = useRef<PIXI.Container | null>(null);

  // UI State
  const [selectedSheet, setSelectedSheet] = useState<string>('archer_idle');
  const [frameWidth, setFrameWidth] = useState<number>(64);
  const [frameHeight, setFrameHeight] = useState<number>(64);
  const [frameCount, setFrameCount] = useState<number>(8);
  const [animationSpeed, setAnimationSpeed] = useState<number>(0.1);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Initialize PIXI app
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application({
      view: canvasRef.current,
      width: 800,
      height: 600,
      backgroundColor: 0x2c3e50,
      antialias: true,
    });

    appRef.current = app;
    spriteManagerRef.current = new SpriteSheetManager();
    animationControllerRef.current = new SpriteAnimationController();

    // Create main container
    const container = new PIXI.Container();
    container.x = app.screen.width / 2;
    container.y = app.screen.height / 2;
    app.stage.addChild(container);
    containerRef.current = container;

    return () => {
      if (animationControllerRef.current) {
        animationControllerRef.current.destroy();
      }
      if (spriteManagerRef.current) {
        spriteManagerRef.current.destroyAll();
      }
      app.destroy(true);
    };
  }, []);

  // Update animation info
  useEffect(() => {
    if (!animationControllerRef.current || !isLoaded) return;

    const interval = setInterval(() => {
      const state = animationControllerRef.current?.getAnimationState('test-sprite');
      if (state) {
        setCurrentFrame(state.currentFrame);
        setTotalFrames(state.totalFrames);
        setIsPlaying(state.isPlaying);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Load sprite sheet configuration when selection changes
  useEffect(() => {
    const config = SPRITE_SHEET_CONFIGS[selectedSheet];
    if (config) {
      setFrameWidth(config.frameWidth);
      setFrameHeight(config.frameHeight);
      setFrameCount(config.frames);
      setAnimationSpeed(config.animationSpeed || 0.1);
      setIsLooping(config.loop !== false);
    }
  }, [selectedSheet]);

  const loadSpriteSheet = async () => {
    if (!spriteManagerRef.current || !animationControllerRef.current || !containerRef.current) {
      setError('PIXI not initialized');
      return;
    }

    try {
      setError('');
      setIsLoaded(false);

      // Clear existing sprite
      animationControllerRef.current.destroySprite('test-sprite');
      containerRef.current.removeChildren();

      // Create custom config
      const config: SpriteSheetConfig = {
        name: selectedSheet,
        path: SPRITE_SHEET_CONFIGS[selectedSheet]?.path || `/src/assets/sheets/${selectedSheet}.png`,
        frameWidth,
        frameHeight,
        frames: frameCount,
        animationSpeed,
        loop: isLooping
      };

      // Load sprite sheet
      await spriteManagerRef.current.loadSpriteSheet(config);

      // Get the chopped frames
      const spriteFrames = spriteManagerRef.current.chopSpriteSheet(selectedSheet, config);

      // Create animated sprite
      const animatedSprite = spriteManagerRef.current.createAnimatedSprite(selectedSheet, config);
      
      // Center the sprite
      animatedSprite.anchor.set(0.5, 0.5);
      
      // Add to container
      containerRef.current.addChild(animatedSprite);

      // Register with animation controller
      animationControllerRef.current.createSprite('test-sprite', spriteFrames, {
        animationSpeed,
        loop: isLooping,
        anchor: { x: 0.5, y: 0.5 }
      });

      setIsLoaded(true);
      setTotalFrames(frameCount);
      setCurrentFrame(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sprite sheet');
      console.error('Error loading sprite sheet:', err);
    }
  };

  const playAnimation = () => {
    if (animationControllerRef.current && isLoaded) {
      animationControllerRef.current.playAnimation('test-sprite');
    }
  };

  const pauseAnimation = () => {
    if (animationControllerRef.current && isLoaded) {
      animationControllerRef.current.pauseAnimation('test-sprite');
    }
  };

  const stopAnimation = () => {
    if (animationControllerRef.current && isLoaded) {
      animationControllerRef.current.stopAnimation('test-sprite');
    }
  };

  const updateAnimationSpeed = (speed: number) => {
    setAnimationSpeed(speed);
    if (animationControllerRef.current && isLoaded) {
      animationControllerRef.current.setAnimationSpeed('test-sprite', speed);
    }
  };

  const updateLoop = (loop: boolean) => {
    setIsLooping(loop);
    if (animationControllerRef.current && isLoaded) {
      animationControllerRef.current.setLoop('test-sprite', loop);
    }
  };

  const gotoFrame = (frame: number) => {
    if (animationControllerRef.current && isLoaded) {
      animationControllerRef.current.gotoFrame('test-sprite', frame);
    }
  };

  const availableSheets = getAvailableSpriteSheets();

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      {/* Controls Panel */}
      <div style={{ 
        width: '300px', 
        backgroundColor: '#34495e', 
        padding: '20px', 
        borderRadius: '8px',
        color: 'white'
      }}>
        <h3 style={{ marginTop: 0, color: '#ecf0f1' }}>🎬 Sprite Sheet Animation</h3>
        
        {/* Sheet Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            📁 Sprite Sheet:
          </label>
          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #bdc3c7',
              backgroundColor: 'white',
              color: '#2c3e50'
            }}
          >
            {availableSheets.map(sheet => (
              <option key={sheet} value={sheet}>
                {sheet.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Frame Configuration */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#3498db' }}>⚙️ Frame Config</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>Width:</label>
              <input
                type="number"
                value={frameWidth}
                onChange={(e) => setFrameWidth(Number(e.target.value))}
                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #bdc3c7' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>Height:</label>
              <input
                type="number"
                value={frameHeight}
                onChange={(e) => setFrameHeight(Number(e.target.value))}
                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #bdc3c7' }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>Frame Count:</label>
            <input
              type="number"
              value={frameCount}
              onChange={(e) => setFrameCount(Number(e.target.value))}
              style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #bdc3c7' }}
            />
          </div>
        </div>

        {/* Load Button */}
        <button
          onClick={loadSpriteSheet}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}
        >
          🚀 Load Sprite Sheet
        </button>

        {/* Animation Controls */}
        {isLoaded && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#e74c3c' }}>▶️ Animation Controls</h4>
            
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <button
                onClick={playAnimation}
                disabled={isPlaying}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: isPlaying ? '#95a5a6' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isPlaying ? 'not-allowed' : 'pointer'
                }}
              >
                ▶️ Play
              </button>
              <button
                onClick={pauseAnimation}
                disabled={!isPlaying}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: !isPlaying ? '#95a5a6' : '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !isPlaying ? 'not-allowed' : 'pointer'
                }}
              >
                ⏸️ Pause
              </button>
              <button
                onClick={stopAnimation}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ⏹️ Stop
              </button>
            </div>

            {/* Speed Control */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                Speed: {animationSpeed.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={animationSpeed}
                onChange={(e) => updateAnimationSpeed(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Loop Toggle */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={isLooping}
                  onChange={(e) => updateLoop(e.target.checked)}
                />
                Loop Animation
              </label>
            </div>

            {/* Frame Navigation */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                Frame: {currentFrame} / {totalFrames - 1}
              </label>
              <input
                type="range"
                min="0"
                max={totalFrames - 1}
                value={currentFrame}
                onChange={(e) => gotoFrame(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Debug Info */}
        {isLoaded && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#9b59b6' }}>📊 Debug Info</h4>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <div>Status: {isPlaying ? '▶️ Playing' : '⏸️ Paused'}</div>
              <div>Current Frame: {currentFrame}</div>
              <div>Total Frames: {totalFrames}</div>
              <div>Animation Speed: {animationSpeed.toFixed(2)}</div>
              <div>Loop: {isLooping ? '✅ Yes' : '❌ No'}</div>
              <div>Sheet: {selectedSheet}</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            marginTop: '20px'
          }}>
            ❌ Error: {error}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1 }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '2px solid #34495e',
            borderRadius: '8px',
            backgroundColor: '#2c3e50'
          }}
        />
        {!isLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#7f8c8d',
            fontSize: '18px',
            textAlign: 'center'
          }}>
            🎬 Load a sprite sheet to see animation
          </div>
        )}
      </div>
    </div>
  );
};
