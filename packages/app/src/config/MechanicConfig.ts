export const MECHANIC_VISUALS = {
  METEOR_STRIKE: {
    WARNING_COLOR: 0xFF4444,      // Red
    WARNING_ALPHA: 0.7,
    PULSE_SPEED: 0.05,
    IMPACT_DURATION: 800,
    EXPLOSION_SCALE: 1.5,
    WARNING_BORDER_WIDTH: 3,
    WARNING_BORDER_COLOR: 0xFF0000
  },
  LAVA_WAVE: {
    WARNING_COLOR: 0xFF8800,      // Orange  
    WARNING_ALPHA: 0.6,
    PULSE_SPEED: 0.03,
    FLOW_DURATION: 1200,
    FLOW_SPEED: 0.1,
    WARNING_BORDER_WIDTH: 2,
    WARNING_BORDER_COLOR: 0xFF6600
  },
  COUNTDOWN: {
    FONT_SIZE: 14,
    COLOR: 0xFFFFFF,
    STROKE_COLOR: 0x000000,
    STROKE_WIDTH: 2,
    UPDATE_INTERVAL: 100,         // Update every 100ms
    POSITION_OFFSET: { x: 0, y: -15 } // Offset from center of cell
  }
};

export const MECHANIC_TIMING = {
  WARNING_PHASES: {
    INITIAL: 0.0,                // Full warning time
    URGENT: 0.3,                 // 30% time remaining - faster pulse
    CRITICAL: 0.1                // 10% time remaining - very fast pulse
  },
  ANIMATION_DURATIONS: {
    METEOR_IMPACT: 800,
    LAVA_FLOW: 1200,
    WARNING_FADE: 300,
    COUNTDOWN_UPDATE: 100
  },
  DEFAULT_WARNING_DURATIONS: {
    METEOR_STRIKE: 4000,         // 4 seconds
    LAVA_WAVE: 5000             // 5 seconds
  }
};

export const MECHANIC_LAYERS = {
  WARNING: 'mechanic_warning',   // Below entities
  EFFECT: 'mechanic_effect',     // Above entities, below UI
  COUNTDOWN: 'mechanic_countdown' // Above entities, below UI
};

export const MECHANIC_ANIMATIONS = {
  PULSE: {
    MIN_ALPHA: 0.3,
    MAX_ALPHA: 0.8,
    SPEED_SLOW: 0.02,
    SPEED_MEDIUM: 0.05,
    SPEED_FAST: 0.1
  },
  EXPLOSION: {
    PARTICLES_COUNT: 8,
    PARTICLE_SPEED: 2.0,
    PARTICLE_LIFETIME: 600,
    SCALE_START: 0.1,
    SCALE_END: 1.5
  },
  LAVA_FLOW: {
    WAVE_COUNT: 3,
    WAVE_SPEED: 0.15,
    WAVE_AMPLITUDE: 0.3,
    FLOW_DURATION: 1200
  }
};
