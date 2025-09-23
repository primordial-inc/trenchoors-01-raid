import { spriteLoader } from './SpriteLoader';
import { SPRITE_CONFIGS, ASSET_CATEGORIES } from './AssetConfig';

export interface AssetLoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  loadedAssets: number;
  totalAssets: number;
  errors: string[];
  currentCategory?: string;
}

export interface AssetManager {
  loadingState: AssetLoadingState;
  loadAssets: () => Promise<void>;
  loadCategory: (category: keyof typeof ASSET_CATEGORIES) => Promise<void>;
  getLoadingProgress: () => number;
  hasErrors: () => boolean;
  getErrors: () => string[];
  clearErrors: () => void;
}

class AssetManagerImpl implements AssetManager {
  private _loadingState: AssetLoadingState = {
    isLoading: false,
    progress: 0,
    loadedAssets: 0,
    totalAssets: Object.keys(SPRITE_CONFIGS).length,
    errors: []
  };

  private listeners: Set<(state: AssetLoadingState) => void> = new Set();

  get loadingState(): AssetLoadingState {
    return { ...this._loadingState };
  }

  /**
   * Add listener for loading state changes
   */
  addListener(listener: (state: AssetLoadingState) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove listener
   */
  removeListener(listener: (state: AssetLoadingState) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.loadingState));
  }

  /**
   * Update loading state
   */
  private updateState(updates: Partial<AssetLoadingState>): void {
    this._loadingState = { ...this._loadingState, ...updates };
    this.notifyListeners();
  }

  /**
   * Load all assets
   */
  async loadAssets(): Promise<void> {
    if (this._loadingState.isLoading) {
      return;
    }

    this.updateState({
      isLoading: true,
      progress: 0,
      loadedAssets: 0,
      errors: [],
      currentCategory: 'All Assets'
    });

    try {
      const allSpriteKeys = Object.keys(SPRITE_CONFIGS) as (keyof typeof SPRITE_CONFIGS)[];
      const results = await spriteLoader.loadSprites(allSpriteKeys);

      // Process results
      const errors: string[] = [];
      let loadedCount = 0;

      results.forEach((result, index) => {
        if (result.success) {
          loadedCount++;
        } else {
          errors.push(`Failed to load ${allSpriteKeys[index]}: ${result.error}`);
        }

        // Update progress
        const progress = Math.round(((index + 1) / results.length) * 100);
        this.updateState({
          progress,
          loadedAssets: loadedCount
        });
      });

      this.updateState({
        isLoading: false,
        errors
      });

    } catch (error) {
      this.updateState({
        isLoading: false,
        errors: [`Failed to load assets: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    }
  }

  /**
   * Load assets by category
   */
  async loadCategory(category: keyof typeof ASSET_CATEGORIES): Promise<void> {
    if (this._loadingState.isLoading) {
      return;
    }

    const spriteKeys = ASSET_CATEGORIES[category] as (keyof typeof SPRITE_CONFIGS)[];
    
    this.updateState({
      isLoading: true,
      progress: 0,
      loadedAssets: 0,
      errors: [],
      currentCategory: category
    });

    try {
      const results = await spriteLoader.loadSprites(spriteKeys);

      // Process results
      const errors: string[] = [];
      let loadedCount = 0;

      results.forEach((result, index) => {
        if (result.success) {
          loadedCount++;
        } else {
          errors.push(`Failed to load ${spriteKeys[index]}: ${result.error}`);
        }

        // Update progress
        const progress = Math.round(((index + 1) / results.length) * 100);
        this.updateState({
          progress,
          loadedAssets: loadedCount
        });
      });

      this.updateState({
        isLoading: false,
        errors
      });

    } catch (error) {
      this.updateState({
        isLoading: false,
        errors: [`Failed to load ${category} assets: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    }
  }

  /**
   * Load critical assets first (players, boss, terrain)
   */
  async loadCriticalAssets(): Promise<void> {
    if (this._loadingState.isLoading) {
      return;
    }

    this.updateState({
      isLoading: true,
      progress: 0,
      loadedAssets: 0,
      errors: [],
      currentCategory: 'Critical Assets'
    });

    try {
      const results = await spriteLoader.preloadCriticalSprites();

      // Process results
      const errors: string[] = [];
      let loadedCount = 0;

      results.forEach((result, index) => {
        if (result.success) {
          loadedCount++;
        } else {
          errors.push(`Failed to load critical asset ${index}: ${result.error}`);
        }

        // Update progress
        const progress = Math.round(((index + 1) / results.length) * 100);
        this.updateState({
          progress,
          loadedAssets: loadedCount
        });
      });

      this.updateState({
        isLoading: false,
        errors
      });

    } catch (error) {
      this.updateState({
        isLoading: false,
        errors: [`Failed to load critical assets: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    }
  }

  /**
   * Get loading progress (0-1)
   */
  getLoadingProgress(): number {
    return this._loadingState.progress / 100;
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this._loadingState.errors.length > 0;
  }

  /**
   * Get all errors
   */
  getErrors(): string[] {
    return [...this._loadingState.errors];
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.updateState({ errors: [] });
  }

  /**
   * Get asset loading state for specific category
   */
  getCategoryProgress(category: keyof typeof ASSET_CATEGORIES): number {
    const spriteKeys = ASSET_CATEGORIES[category] as (keyof typeof SPRITE_CONFIGS)[];
    return spriteLoader.getLoadingProgress(spriteKeys);
  }

  /**
   * Check if specific sprite is loaded
   */
  isSpriteLoaded(spriteKey: keyof typeof SPRITE_CONFIGS): boolean {
    return spriteLoader.isCached(spriteKey);
  }

  /**
   * Get total number of assets
   */
  getTotalAssets(): number {
    return this._loadingState.totalAssets;
  }

  /**
   * Get number of loaded assets
   */
  getLoadedAssets(): number {
    return this._loadingState.loadedAssets;
  }
}

// Singleton instance
export const assetManager = new AssetManagerImpl();
