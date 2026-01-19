# Technical Architecture

## File Structure

```
kaleidoclasm/
├── index.html              # Entry point
├── style.css               # UI styling
├── server.js               # Node.js dev server
├── images/
│   └── tiles/
│       └── grass.jpg      # Grass terrain texture
├── src/
│   ├── main.js            # Bootstrap, game loop
│   ├── config.js          # Constants, tuning
│   ├── state.js           # Central game state
│   ├── core/
│   │   ├── renderer.js    # Three.js setup
│   │   ├── input.js       # Mouse, raycasting
│   │   └── turn.js        # Turn state machine
│   ├── world/
│   │   ├── map.js         # Map interface (delegates to chunkManager)
│   │   ├── tile.js        # Tile class with fog of war
│   │   ├── chunk.js       # Chunk class and coordinate utilities
│   │   ├── chunkManager.js # Chunk generation and management
│   │   ├── noise.js       # Simplex noise
│   │   └── props.js       # Objects, roads, chunk-local generation
│   ├── entities/
│   │   ├── unit.js        # Survivor class
│   │   └── enemy.js       # Enemy AI
│   ├── systems/
│   │   ├── pathfinding.js # A* algorithm
│   │   ├── radiation.js   # Radiation/ARS
│   │   ├── resources.js   # Survival resources
│   │   ├── combat.js      # Combat resolution
│   │   ├── cards.js       # Deck mechanics
│   │   ├── fogOfWar.js    # Tile reveal system
│   │   └── interactions.js # Resource gathering actions
│   └── ui/
│       ├── hud.js         # DOM HUD
│       ├── cardhand.js    # Card rendering
│       └── contextMenu.js # Right-click interaction menu
└── docs/
    ├── README.md          # Overview and index
    ├── world-generation.md # Map and terrain
    ├── units.md           # Survivors
    ├── enemies.md         # Raiders and AI
    ├── combat.md          # Combat system
    ├── cards.md           # Card deck
    ├── resources-and-interactions.md # Resources and actions
    ├── controls.md        # Input controls
    └── architecture.md    # This document
```

## Core Systems

### State Management (`state.js`)
Central game state object containing:
- Map data (chunks, tiles, revealed tiles)
- Units and enemies arrays
- Global resources
- Card hand, deck, and discard pile
- Turn and phase tracking

### Chunk System (`chunkManager.js`)
- Initializes simplex noise with seed
- Generates 20x20 tile chunks on demand
- Deterministic generation from seed
- Manages chunk rendering and tile caching

### Fog of War (`fogOfWar.js`)
- Reveals tiles within radius of units
- Triggers chunk generation for revealed areas
- Maintains cached mesh array for raycasting
- Persists revealed state

### Pathfinding (`pathfinding.js`)
- A* algorithm for movement
- Respects terrain movement costs
- Only returns revealed tiles in range
- Used for road generation between buildings

### Turn System (`turn.js`)
- Manages action and end phases
- Triggers end-of-turn effects
- Spawns enemies every 3 turns
- Resets unit action points
