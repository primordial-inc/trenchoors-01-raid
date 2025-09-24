import { GifManager } from '../assets/GifManager';
import type { AnimatedCharacter } from '../types/GifTypes';

export class GifRenderer {
  private characters: Map<string, AnimatedCharacter> = new Map();
  private gifManager: GifManager;
  private container: HTMLElement | null = null;

  constructor(gifManager: GifManager) {
    this.gifManager = gifManager;
  }

  async init(container: HTMLElement, width: number = 800, height: number = 600) {
    this.container = container;

    // Create a simple container for video elements instead of PIXI
    container.style.position = 'relative';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.backgroundColor = '#1a1a2e';
    container.style.borderRadius = '4px';
  }

  /**
   * Create animated character
   */
  createCharacter(id: string, animationKeys: string[]): AnimatedCharacter {
    const character: AnimatedCharacter = {
      id,
      currentAnimation: animationKeys[0],
      availableAnimations: animationKeys,
      sprite: undefined
    };

    // Create image element for the character
    const imageElement = this.gifManager.getImageElement(animationKeys[0]);
    if (imageElement && this.container) {
      // Create a new image element instead of cloning
      const characterImage = document.createElement('img');
      characterImage.src = imageElement.src; // Copy the src to get the GIF animation
      characterImage.style.position = 'absolute';
      characterImage.style.left = '50%';
      characterImage.style.top = '50%';
      characterImage.style.transform = 'translate(-50%, -50%) scale(2)';
      characterImage.style.pointerEvents = 'none';
      characterImage.style.zIndex = '10';

      this.container.appendChild(characterImage);

      // Store reference to the image element
      (character as any).imageElement = characterImage;

    } else {
      console.error(`❌ Failed to create character ${id}: image element ${animationKeys[0]} not found`);
    }

    this.characters.set(id, character);
    return character;
  }

  /**
   * Change character animation
   */
  setAnimation(characterId: string, animationKey: string): boolean {
    const character = this.characters.get(characterId);
    if (!character) {
      console.warn(`⚠️ Character not found: ${characterId}`);
      return false;
    }

    const imageElement = this.gifManager.getImageElement(animationKey);
    if (!imageElement) {
      console.warn(`⚠️ Animation not found: ${animationKey}`);
      return false;
    }

    // Update the character's image element
    const currentImage = (character as any).imageElement;
    if (currentImage && this.container) {
      // Remove current image
      this.container.removeChild(currentImage);

      // Add new image
      const newImage = document.createElement('img');
      newImage.src = imageElement.src; // Copy the src to get the GIF animation
      newImage.style.position = 'absolute';
      newImage.style.left = '50%';
      newImage.style.top = '50%';
      newImage.style.transform = 'translate(-50%, -50%) scale(2)';
      newImage.style.pointerEvents = 'none';
      newImage.style.zIndex = '10';

      this.container.appendChild(newImage);
      (character as any).imageElement = newImage;
    }

    character.currentAnimation = animationKey;
    return true;
  }

  /**
   * Get container element
   */
  getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.container) {
      // Remove all image elements
      const images = this.container.querySelectorAll('img');
      images.forEach(img => img.remove());
    }
  }
}
