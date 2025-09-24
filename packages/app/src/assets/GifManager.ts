import type { GifAsset, GifManagerConfig } from '../types/GifTypes';

export class GifManager {
  private assets: Map<string, GifAsset> = new Map();
  private loadedElements: Map<string, HTMLImageElement> = new Map();
  private config: GifManagerConfig;

  constructor(config: GifManagerConfig) {
    this.config = config;
  }

  /**
   * Register GIF assets to be loaded
   */
  registerAssets() {
    Object.entries(this.config.assets).forEach(([key, filename]) => {
      this.assets.set(key, {
        key,
        path: `${this.config.basePath}/${filename}`,
        loaded: false
      });
    });
  }

  /**
   * Load all registered assets
   */
  async loadAll(): Promise<void> {
    console.log('🎬 Loading GIF assets...');
    
    const loadPromises = Array.from(this.assets.values()).map(async (asset) => {
      try {
        console.log(`📦 Loading: ${asset.key} from ${asset.path}`);
        
        // Create image element for GIF animation
        const img = document.createElement('img');
        img.src = asset.path;
        img.style.display = 'none';
        
        console.log(`🔗 Full path: ${asset.path}`);
        
        // Wait for image to load
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            console.log(`✅ Loaded: ${asset.key} - Dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            this.loadedElements.set(asset.key, img);
            asset.loaded = true;
            resolve();
          };
          img.onerror = () => {
            console.error(`❌ Failed to load: ${asset.key} from ${asset.path}`);
            reject(new Error(`Failed to load ${asset.key}`));
          };
        });
        
      } catch (error) {
        console.error(`❌ Failed to load: ${asset.key}`, error);
      }
    });

    await Promise.all(loadPromises);
    console.log(`🎬 Loaded ${this.loadedElements.size}/${this.assets.size} GIF assets`);
    console.log('📋 Available GIF keys:', Array.from(this.loadedElements.keys()));
  }

  /**
   * Get loaded image element by key
   */
  getImageElement(key: string): HTMLImageElement | null {
    return this.loadedElements.get(key) || null;
  }

  /**
   * Check if asset is loaded
   */
  isLoaded(key: string): boolean {
    return this.assets.get(key)?.loaded || false;
  }

  /**
   * Get all loaded asset keys
   */
  getLoadedKeys(): string[] {
    return Array.from(this.assets.values())
      .filter(asset => asset.loaded)
      .map(asset => asset.key);
  }
}
