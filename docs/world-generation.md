# World Generation

## Map Generation

Maps are procedurally generated using simplex noise algorithms with a chunk-based infinite world system.

### Chunk System

- **Chunk size**: 20x20 tiles
- **Max map size**: 10,000 x 10,000 tiles (500x500 chunks)
- **Generation**: On-demand as player explores
- **Deterministic**: Same seed produces identical terrain anywhere

### Terrain Generation

- **Each tile = 10 square feet** - this is the base unit of measurement
- **Elevation** affects tile height visually (FBM noise)
- **Moisture** determines terrain type distribution (separate noise layer)
- **Radiation clusters** create toxic zones (~5% of map)
- **Urban zones** randomly placed within each chunk with buildings and roads

### Fog of War

- Tiles start hidden (not generated)
- **Reveal radius**: 10 tiles around each player unit
- Revealed tiles persist forever (never re-hidden)
- Only revealed tiles are interactive and visible

## Multi-Tile Objects

Large objects can span multiple tiles:

| Object | Size (tiles) | Size (sq ft) |
|--------|--------------|--------------|
| Ruined House | 2x2 | 20x20 |
| Gas Station | 3x2 | 30x20 |

Tiles can also contain multiple small objects (rocks, bushes, debris).

## Terrain Types

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

## Props and Objects

Objects spawn based on terrain type:

- **Grass**: Dead trees, bushes, rocks
- **Dirt**: Rocks, bushes, debris
- **Pavement**: Car wrecks, debris
- **Concrete**: Ruined houses, gas stations, debris
- **Toxic**: Toxic barrels, debris, rocks
- **Rubble**: Heavy debris, rocks

Buildings (houses, gas stations) are connected by procedurally generated roads using A* pathfinding.
