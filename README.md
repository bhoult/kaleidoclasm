# Echoes of the Fall

A turn-based post-apocalyptic survival strategy game built with Three.js.

## About

Command a squad of survivors through a procedurally generated wasteland. Manage resources, avoid radiation, fight raiders, and survive 30 turns to win.

### Features

- **Procedural Maps** - Each game generates a unique 20x20 tile world with varied terrain, urban zones, and toxic areas
- **Survival Mechanics** - Manage hydration, nutrition, and radiation exposure
- **Turn-Based Combat** - Tactical battles against AI-controlled raiders
- **Card System** - Draw and play cards for tactical advantages
- **Save/Load** - Persist your game to browser localStorage

### Terrain Types

- Grass, Dirt, Sand, Mud - Natural terrain
- Pavement, Concrete, Rubble - Urban areas
- Toxic - Radioactive zones that damage survivors
- Water - Impassable

### Objects

Maps feature procedurally placed objects including dead trees, rocks, ruined houses, gas stations, car wrecks, toxic barrels, and debris. Buildings are connected by roads.

## Requirements

- Node.js 18+ (for development server)
- Modern web browser with WebGL support

## Running the Game

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd kaleidoclasm
   ```

2. Start the development server:
   ```bash
   node server.js
   ```

3. Open your browser to:
   ```
   http://localhost:8080
   ```

## How to Play

### Controls

| Action | Control |
|--------|---------|
| Select unit | Left-click on unit |
| Move unit | Left-click on highlighted tile |
| Deselect | Right-click |
| Play card | Click card in hand |
| End turn | Click "End Turn" button |
| Rotate camera | Click and drag |
| Zoom | Mouse scroll |

### Objective

Survive 30 turns with at least one survivor alive.

### Tips

- Stay out of toxic (green glowing) areas to avoid radiation sickness
- Use roads for faster movement (0.8x cost)
- Keep survivors fed and hydrated - starvation and dehydration deal damage
- Raiders spawn every 3 turns - be prepared
- Use cards strategically - Sprint helps escape, Rad-Away clears radiation

## Documentation

See [docs/game-design.md](docs/game-design.md) for detailed game mechanics and technical documentation.

## Tech Stack

- **Three.js** - 3D rendering
- **Vanilla JavaScript** - ES Modules
- **HTML/CSS** - UI layer

## License

MIT
