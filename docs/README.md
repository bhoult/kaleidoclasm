# Echoes of the Fall - Game Design Documentation

## Overview

**Echoes of the Fall** is a turn-based post-apocalyptic survival strategy game built with Three.js. Players command a squad of survivors navigating a procedurally generated wasteland, managing resources, avoiding radiation, and fighting hostile raiders.

## Core Gameplay Loop

1. **Explore** - Move survivors across the map to discover resources and avoid hazards
2. **Survive** - Manage hydration, nutrition, and radiation exposure
3. **Fight** - Engage enemy raiders in tactical turn-based combat
4. **Endure** - Survive 30 turns to achieve victory

## Win/Lose Conditions

- **Victory**: Survive 30 turns with at least one survivor
- **Defeat**: All survivors die

## Documentation Index

| Document | Description |
|----------|-------------|
| [World Generation](world-generation.md) | Map chunks, terrain types, fog of war |
| [Units](units.md) | Survivors, stats, radiation sickness |
| [Enemies](enemies.md) | Raiders and AI behavior |
| [Combat](combat.md) | Combat resolution and mechanics |
| [Cards](cards.md) | Card deck and effects |
| [Resources & Interactions](resources-and-interactions.md) | Global resources and context menu actions |
| [Controls](controls.md) | Input controls and UI |
| [Architecture](architecture.md) | Technical file structure |

## Technologies

- **Three.js** - 3D rendering
- **ES Modules** - Modern JavaScript modules
- **Procedural Generation** - Simplex noise for terrain
- **A* Pathfinding** - Movement and road generation
- **LocalStorage** - Save/load persistence

## Future Features (Deferred)

- Minimap
- Full 20-card deck building
- Crafting system using harvested resources
- Additional enemy types (mutants, ferals)
- Additional biomes
- Event deck with random encounters
- Sound effects and music
- Particle effects
- Ranged weapons and combat
