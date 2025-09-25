# ⚡ Boss Mechanic Visual System

## Overview

The Boss Mechanic Visual System provides real-time visual feedback for boss mechanics including meteor strikes and lava waves. The system displays warning indicators, countdown timers, and impact animations to enhance gameplay experience.

## Features

### 🚀 Meteor Strike Mechanics
- **Warning Phase:** Red pulsating 2x2 zones with countdown timers
- **Impact Phase:** Explosion animations with particle effects
- **Duration:** 4-second warning period by default
- **Visual:** Red warning squares that pulse faster as countdown approaches zero

### 🌊 Lava Wave Mechanics
- **Warning Phase:** Orange pulsating full column/row with countdown timer
- **Impact Phase:** Flowing lava animation across affected area
- **Duration:** 5-second warning period by default
- **Visual:** Orange warning highlights that pulse with urgency scaling

### ⏱️ Countdown System
- **Real-time Updates:** Countdown timers update every 100ms
- **Color Coding:** White → Orange → Red based on urgency
- **Positioning:** Centered above warning zones
- **Format:** "4.0s", "3.9s", "3.8s", etc.

## Architecture

### Core Components

#### 1. MechanicWarningSystem (`MechanicWarningSystem.ts`)
- Manages warning indicators and countdown timers
- Handles pulsating animations and urgency scaling
- Auto-cleanup of expired warnings
- Support for multiple simultaneous warnings

#### 2. MechanicEffects (`MechanicEffects.ts`)
- Creates impact animations (explosions, lava flows)
- Particle systems for meteor strikes
- Wave animations for lava flows
- Auto-cleanup of completed effects

#### 3. Enhanced GridBattlefield (`GridBattlefield.ts`)
- Integrates mechanic systems with existing battlefield
- Proper layer ordering for visual clarity
- Public API for mechanic activation
- Cleanup and resource management

### Layer Order
```
1. Background
2. Terrain Layer (sprites)
3. Grid Lines
4. Labels
5. Mechanic Warning Layer ⚡
6. Player Layer
7. Boss Layer
8. Mechanic Effects Layer 💥
9. Mechanic Countdown Layer ⏱️
10. UI Layer
```

## API Reference

### GridBattlefield Methods

#### Warning Methods
```typescript
// Show meteor strike warning
showMeteorWarning(impactZones: GridPosition[], warningDuration: number): string

// Show lava wave warning (column)
showLavaWaveWarning(column: number, warningDuration: number): string

// Show lava wave warning (row)
showLavaWaveWarningRow(row: number, warningDuration: number): string
```

#### Activation Methods
```typescript
// Activate meteor strike with explosion effects
activateMeteorStrike(impactZones: GridPosition[]): void

// Activate lava wave with flow animation
activateLavaWave(column?: number, row?: number): void
```

#### Cleanup Methods
```typescript
// Clear specific warning
clearMechanicWarning(warningId: string): void

// Clear all warnings
clearAllMechanicWarnings(): void

// Clear all effects
clearAllMechanicEffects(): void
```

### Server Event Integration

#### Boss Mechanic Events
```typescript
// Warning phase - shows danger zones
socket.on('bossMechanic', (mechanic: any) => {
  switch (mechanic.type) {
    case 'meteor_strike':
      battlefield.showMeteorWarning(mechanic.impactZones, mechanic.warningDuration);
      break;
    case 'lava_wave':
      battlefield.showLavaWaveWarning(mechanic.column, mechanic.warningDuration);
      break;
  }
});

// Activation phase - plays impact animations
socket.on('mechanicActivated', (mechanic: any) => {
  switch (mechanic.type) {
    case 'meteor_strike':
      battlefield.activateMeteorStrike(mechanic.impactZones);
      break;
    case 'lava_wave':
      battlefield.activateLavaWave(mechanic.column, mechanic.row);
      break;
  }
});
```

## Configuration

### Visual Settings (`MechanicConfig.ts`)

#### Meteor Strike
```typescript
METEOR_STRIKE: {
  WARNING_COLOR: 0xFF4444,      // Red
  WARNING_ALPHA: 0.7,
  PULSE_SPEED: 0.05,
  IMPACT_DURATION: 800,
  EXPLOSION_SCALE: 1.5
}
```

#### Lava Wave
```typescript
LAVA_WAVE: {
  WARNING_COLOR: 0xFF8800,      // Orange
  WARNING_ALPHA: 0.6,
  PULSE_SPEED: 0.03,
  FLOW_DURATION: 1200,
  FLOW_SPEED: 0.1
}
```

#### Countdown Timer
```typescript
COUNTDOWN: {
  FONT_SIZE: 14,
  COLOR: 0xFFFFFF,
  STROKE_COLOR: 0x000000,
  UPDATE_INTERVAL: 100         // Update every 100ms
}
```

### Timing Configuration
```typescript
WARNING_PHASES: {
  INITIAL: 0.0,                // Full warning time
  URGENT: 0.3,                 // 30% time remaining - faster pulse
  CRITICAL: 0.1                // 10% time remaining - very fast pulse
}
```

## Testing

### Manual Testing
Use the `MechanicTestComponent` to test the system:

1. **Meteor Strike Test:** Click "Test Meteor Strike" to see 2x2 red warning zones
2. **Lava Wave Column Test:** Click "Test Lava Wave Column 3" to see column warning
3. **Lava Wave Row Test:** Click "Test Lava Wave Row 6" to see row warning
4. **Clear All:** Click "Clear All Warnings" to reset

### Expected Behavior
- **Warning Phase:** Pulsating colored zones with countdown timers
- **Urgency Scaling:** Faster pulses as countdown approaches zero
- **Impact Phase:** Explosion/flow animations when mechanics activate
- **Auto-cleanup:** Warnings and effects automatically disappear after duration

## Performance Considerations

- **Update Loop:** Countdown timers update every 100ms for smooth animation
- **Memory Management:** Automatic cleanup prevents memory leaks
- **Layer Optimization:** Proper layer ordering minimizes redraws
- **Particle Systems:** Limited particle count for meteor explosions
- **Animation Efficiency:** RequestAnimationFrame for smooth 60fps animations

## Integration Notes

### Server Requirements
The server should emit these events:

1. **`bossMechanic`** - Warning phase with mechanic data
2. **`mechanicActivated`** - Impact phase with activation data

### Event Data Format
```typescript
// Meteor strike warning
{
  type: 'meteor_strike',
  impactZones: [{ x: 5, y: 5 }, { x: 6, y: 5 }, ...],
  warningDuration: 4000
}

// Lava wave warning
{
  type: 'lava_wave',
  column: 3,  // or row: 6
  warningDuration: 5000
}
```

## Future Enhancements

- **Additional Mechanics:** Lightning strikes, poison clouds, etc.
- **Sound Integration:** Audio cues for warnings and impacts
- **Custom Animations:** More sophisticated particle effects
- **Performance Optimization:** Object pooling for frequent mechanics
- **Accessibility:** Visual indicators for colorblind players

## Troubleshooting

### Common Issues
1. **Warnings not showing:** Check if MechanicWarningSystem is initialized
2. **Effects not playing:** Verify MechanicEffects system is active
3. **Layer ordering:** Ensure proper layer order in GridBattlefield
4. **Memory leaks:** Check that destroy() methods are called properly

### Debug Commands
```typescript
// Check active warnings
battlefield.getActiveMechanicWarningCount()

// Check active effects
battlefield.getActiveMechanicEffectCount()

// Clear everything
battlefield.clearAllMechanicWarnings()
battlefield.clearAllMechanicEffects()
```

