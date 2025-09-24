export interface GifAsset {
  key: string;
  path: string;
  loaded: boolean;
}

import type * as PIXI from 'pixi.js';

export interface AnimatedCharacter {
  id: string;
  currentAnimation: string;
  availableAnimations: string[];
  sprite?: PIXI.Sprite;
}

export type AnimationState = 'idle' | 'walk' | 'shoot';

export interface GifManagerConfig {
  basePath: string;
  assets: Record<string, string>;
}
