# Echoes of the Fall - Game Design Document

## Overview

**Echoes of the Fall** is a turn-based post-apocalyptic survival strategy game built with Three.js. Players command a squad of survivors navigating a procedurally generated wasteland, managing resources, avoiding radiation, and fighting hostile raiders.

## Core Gameplay Loop

1. **Explore** - Move survivors across the map to discover resources and avoid hazards
2. **Survive** - Manage hydration, nutrition, and radiation exposure
3. **Fight** - Engage enemy raiders in tactical turn-based combat
4. **Endure** - Survive 30 turns to achieve victory

## Game Systems

### Turn System

The game operates on a turn-based system with the following phases:

- **Action Phase** - Player moves units, plays cards, and engages enemies
- **End Phase** - Resources are consumed, radiation damage is applied, enemies act

Each unit has **3 Action Points (AP)** per turn that can be spent on:
- Movement (cost varies by terrain and distance)
- Playing cards (most cost 1 AP)
- Attacking enemies (1 AP)

### Map Generation

Maps are procedurally generated using simplex noise algorithms:

- **20x20 tile grid** with varied terrain
- **Elevation** affects tile height visually
- **Moisture** determines terrain type distribution
- **Radiation clusters** create toxic zones (~5% of map)
- **Urban zones** are randomly placed with buildings and roads

### Terrain Types

| Terrain | Color | Move Cost | Description |
|---------|-------|-----------|-------------|
| Grass | Green | 1.0x | Safe terrain with trees and bushes |
| Dirt | Brown | 1.0x | Common wasteland terrain |
| Mud | Dark Brown | 1.5x | Slow terrain near water |
| Sand | Tan | 1.2x | Dry desert areas |
| Pavement | Dark Gray | 0.8x | Roads - fastest movement |
| Concrete | Gray | 0.8x | Urban areas with buildings |
| Rubble | Gray | 2.0x | Destroyed urban debris |
| Toxic | Green Glow | 1.5x | Radioactive - causes radiation damage |
| Water | Blue | N/A | Impassable |

### Props and Objects

Objects spawn based on terrain type:

- **Grass**: Dead trees, bushes, rocks
- **Dirt**: Rocks, bushes, debris
- **Pavement**: Car wrecks, debris
- **Concrete**: Ruined houses, gas stations, debris
- **Toxic**: Toxic barrels, debris, rocks
- **Rubble**: Heavy debris, rocks

Buildings (houses, gas stations) are connected by procedurally generated roads using A* pathfinding.

### Units

Players start with **3 survivors**, each with:

| Stat | Max Value | Description |
|------|-----------|-------------|
| Health | 100 | Unit dies at 0 |
| Action Points | 3 | Refreshes each turn |
| Hydration | 100 | Decreases 5/turn |
| Nutrition | 100 | Decreases 3/turn |
| Radiation | 100 | Accumulates in toxic zones |

#### Radiation Sickness (ARS)

Radiation accumulates when moving through or standing on toxic terrain:
- **Passing through**: 50% dose per tile
- **Ending turn on**: Full dose

ARS Stages:
- **Stage 1 (25+ rads)**: Mild symptoms
- **Stage 2 (50+ rads)**: 5 HP damage/turn
- **Stage 3 (75+ rads)**: 10 HP damage/turn, reduced AP
- **Stage 4 (100 rads)**: 20 HP damage/turn, 1 AP max

### Enemies

**Raiders** spawn every 3 turns and use AI behaviors:

- **PATROL** - Wander randomly when no targets nearby
- **CHASE** - Move toward nearest survivor within sight range
- **ATTACK** - Deal damage to adjacent survivors
- **FLEE** - Retreat when health is critical (<20%)

Enemy Stats:
- Health: 60
- Damage: 20 (±10 variance)
- Move Range: 2 tiles/turn
- Sight Range: 6 tiles

### Card System

Players draw cards that provide tactical advantages:

| Card | Cost | Effect |
|------|------|--------|
| Sprint | 1 AP | +2 movement range this turn |
| First Aid | 1 AP | Heal 25 HP |
| Scavenge | 1 AP | Gain 5 scrap |
| Rad-Away | 1 AP | Remove 30 radiation |
| Purified Water | 0 AP | +40 hydration |
| Canned Food | 0 AP | +30 nutrition |
| Second Wind | 0 AP | +1 AP |
| Combat Stim | 0 AP | +2 AP, take 10 damage |
| Bandage | 0 AP | Heal 15 HP |
| Emergency Ration | 1 AP | +20 nutrition, +20 hydration |

- Start with 5 cards
- Draw 2 cards per turn
- Maximum hand size: 7 cards

### Resources

Global resources shared by all survivors:

| Resource | Starting | Use |
|----------|----------|-----|
| Scrap | 10 | Crafting (future feature) |
| Medicine | 2 | Healing |
| Food | 5 | Restore nutrition |
| Water | 5 | Restore hydration |

### Combat

Combat is resolved when units are adjacent:

1. Attacker spends 1 AP
2. 10% miss chance
3. Base damage: 20 (±10 variance)
4. Defender loses HP
5. If HP reaches 0, unit/enemy dies

Killing raiders drops 1-5 scrap.

## Win/Lose Conditions

- **Victory**: Survive 30 turns with at least one survivor
- **Defeat**: All survivors die

## Controls

- **Left Click** on unit: Select unit
- **Left Click** on tile: Move selected unit (if in range)
- **Right Click**: Deselect unit
- **Click card**: Play card on selected unit
- **End Turn button**: Advance to next turn
- **Save/Load buttons**: Persist game to localStorage
- **Mouse drag**: Rotate camera
- **Scroll**: Zoom camera

## Technical Architecture

### File Structure

```
kaleidoclasm/
├── index.html              # Entry point
├── style.css               # UI styling
├── server.js               # Node.js dev server
├── src/
│   ├── main.js            # Bootstrap, game loop
│   ├── config.js          # Constants, tuning
│   ├── state.js           # Central game state
│   ├── core/
│   │   ├── renderer.js    # Three.js setup
│   │   ├── input.js       # Mouse, raycasting
│   │   └── turn.js        # Turn state machine
│   ├── world/
│   │   ├── map.js         # Grid generation
│   │   ├── tile.js        # Tile class
│   │   ├── noise.js       # Simplex noise
│   │   └── props.js       # Objects, roads
│   ├── entities/
│   │   ├── unit.js        # Survivor class
│   │   └── enemy.js       # Enemy AI
│   ├── systems/
│   │   ├── pathfinding.js # A* algorithm
│   │   ├── radiation.js   # Radiation/ARS
│   │   ├── resources.js   # Survival resources
│   │   ├── combat.js      # Combat resolution
│   │   └── cards.js       # Deck mechanics
│   └── ui/
│       ├── hud.js         # DOM HUD
│       └── cardhand.js    # Card rendering
└── docs/
    └── game-design.md     # This document
```

### Technologies

- **Three.js** - 3D rendering
- **ES Modules** - Modern JavaScript modules
- **Procedural Generation** - Simplex noise for terrain
- **A* Pathfinding** - Movement and road generation
- **LocalStorage** - Save/load persistence

## Future Features (Deferred)

- Fog of war
- Minimap
- Full 20-card deck building
- Crafting system
- Additional biomes
- Event deck with random encounters
- Sound effects and music
- Particle effects
