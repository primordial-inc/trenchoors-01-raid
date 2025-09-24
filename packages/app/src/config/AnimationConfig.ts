export const ANIMATION_TIMINGS = {
  MOVEMENT: {
    DURATION: 400,        // ms to move between cells
    EASING: 'ease-out'    // movement easing
  },
  ACTIONS: {
    ATTACK_DURATION: 600, // ms for attack animation
    DEATH_DURATION: 800   // ms for death animation
  },
  AUTO_RETURN: {
    TO_IDLE_DELAY: 100   // ms after action before returning to idle
  }
};

export const SPRITE_ANIMATIONS = {
  PLAYER: {
    IDLE: { speed: 0.08, loop: true },
    WALK: { speed: 0.15, loop: true }, 
    ATTACK: { speed: 0.2, loop: false }
  },
  BOSS: {
    IDLE: { speed: 0.06, loop: true },
    ATTACK: { speed: 0.12, loop: false }
  }
};

export type AnimationType = 'idle' | 'walk' | 'attack' | 'death';
export type EntityType = 'player' | 'boss';

export interface AnimationConfig {
  speed: number;
  loop: boolean;
}

export function getAnimationConfig(entityType: EntityType, animationType: AnimationType): AnimationConfig {
  const entityConfig = SPRITE_ANIMATIONS[entityType.toUpperCase() as keyof typeof SPRITE_ANIMATIONS];
  if (!entityConfig) {
    console.warn(`No animation config found for entity type: ${entityType}`);
    return { speed: 0.1, loop: true };
  }
  
  const animationConfig = entityConfig[animationType.toUpperCase() as keyof typeof entityConfig];
  if (!animationConfig) {
    console.warn(`No animation config found for ${entityType}.${animationType}`);
    return { speed: 0.1, loop: true };
  }
  
  return animationConfig;
}

export function getMovementDuration(): number {
  return ANIMATION_TIMINGS.MOVEMENT.DURATION;
}

export function getAttackDuration(): number {
  return ANIMATION_TIMINGS.ACTIONS.ATTACK_DURATION;
}

export function getDeathDuration(): number {
  return ANIMATION_TIMINGS.ACTIONS.DEATH_DURATION;
}

export function getAutoReturnDelay(): number {
  return ANIMATION_TIMINGS.AUTO_RETURN.TO_IDLE_DELAY;
}
