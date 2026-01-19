// Chunk management system for infinite map generation
import { GameState } from '../state.js';
import { CHUNK, MAP, TERRAIN } from '../config.js';
import { Chunk, worldToChunk, getLocalCoords, isValidCoord, fitsInChunk } from './chunk.js';
import { Tile } from './tile.js';
import { initNoise, fbm, noise2D } from './noise.js';
import { scene } from '../core/renderer.js';
import { createUrbanZonesChunk, addPropsToTileChunk, generateRoadsChunk } from './props.js';

// Initialize the chunk system with a seed
export function initChunkSystem(seed) {
    initNoise(seed);
    GameState.seed = seed;
    GameState.map.seed = seed;
    GameState.map.chunks.clear();
    GameState.map.tiles.clear();
    GameState.map.revealedTiles.clear();
    GameState.map.visibleTileMeshes = [];
}

// Get or create a chunk at the given chunk coordinates
export function getOrCreateChunk(cx, cy) {
    const key = `${cx},${cy}`;
    let chunk = GameState.map.chunks.get(key);

    if (!chunk) {
        chunk = new Chunk(cx, cy);
        GameState.map.chunks.set(key, chunk);
    }

    return chunk;
}

// Generate terrain data for a chunk (does not render)
export function generateChunk(chunk) {
    if (chunk.generated) return;

    const baseX = chunk.cx * CHUNK.SIZE;
    const baseY = chunk.cy * CHUNK.SIZE;

    // Generate tiles for this chunk
    for (let ly = 0; ly < CHUNK.SIZE; ly++) {
        for (let lx = 0; lx < CHUNK.SIZE; lx++) {
            const x = baseX + lx;
            const y = baseY + ly;

            // Use FBM for elevation (deterministic based on world coords)
            const elevation = (fbm(x * 0.1, y * 0.1, 4) + 1) / 2;

            // Different noise for moisture
            const moisture = (fbm(x * 0.08 + 100, y * 0.08 + 100, 3) + 1) / 2;

            // Radiation clusters (rare, ~5% of map)
            const radNoise = noise2D(x * 0.15, y * 0.15);
            const radiationLevel = radNoise > 0.65 ? (radNoise - 0.65) / 0.35 : 0;

            const tile = new Tile(x, y, elevation, moisture, radiationLevel);
            tile.chunk = chunk;

            // Store in chunk's local map
            chunk.setTileLocal(lx, ly, tile);

            // Store in global sparse map
            GameState.map.tiles.set(`${x},${y}`, tile);
        }
    }

    chunk.generated = true;
}

// Get a tile by global coordinates, generating chunk if needed
export function getTileGlobal(x, y) {
    if (!isValidCoord(x, y)) return null;

    const key = `${x},${y}`;
    let tile = GameState.map.tiles.get(key);

    if (!tile) {
        // Generate the chunk containing this tile
        const { cx, cy } = worldToChunk(x, y);
        const chunk = getOrCreateChunk(cx, cy);

        if (!chunk.generated) {
            generateChunk(chunk);
        }

        tile = GameState.map.tiles.get(key);
    }

    return tile;
}

// Get neighbors for pathfinding (supports infinite map)
export function getNeighborsGlobal(x, y) {
    const neighbors = [];
    const directions = [
        [0, -1], [1, 0], [0, 1], [-1, 0], // Cardinal
        [1, -1], [1, 1], [-1, 1], [-1, -1] // Diagonal
    ];

    for (const [dx, dy] of directions) {
        const tile = getTileGlobal(x + dx, y + dy);
        if (tile && tile.isPassable) {
            neighbors.push(tile);
        }
    }

    return neighbors;
}

// Get all chunks within a radius of a world position
export function getChunksInRadius(x, y, radius) {
    const chunks = [];
    const minCx = Math.floor((x - radius) / CHUNK.SIZE);
    const maxCx = Math.floor((x + radius) / CHUNK.SIZE);
    const minCy = Math.floor((y - radius) / CHUNK.SIZE);
    const maxCy = Math.floor((y + radius) / CHUNK.SIZE);

    for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
            chunks.push(getOrCreateChunk(cx, cy));
        }
    }

    return chunks;
}

// Rebuild the visible mesh cache (call after revealing tiles)
export function rebuildVisibleMeshCache() {
    GameState.map.visibleTileMeshes = [];

    for (const key of GameState.map.revealedTiles) {
        const tile = GameState.map.tiles.get(key);
        if (tile && tile.mesh) {
            GameState.map.visibleTileMeshes.push(tile.mesh);
        }
    }
}

// Render a chunk (creates urban zones, props, roads)
export function renderChunk(chunk) {
    if (chunk.rendered) return;
    if (!chunk.generated) {
        generateChunk(chunk);
    }

    // Create urban zones for this chunk (deterministic)
    createUrbanZonesChunk(chunk);

    // Add props to all tiles in chunk
    for (let ly = 0; ly < CHUNK.SIZE; ly++) {
        for (let lx = 0; lx < CHUNK.SIZE; lx++) {
            const tile = chunk.getTileLocal(lx, ly);
            if (tile) {
                addPropsToTileChunk(tile, chunk);
            }
        }
    }

    // Generate roads within this chunk
    generateRoadsChunk(chunk);

    chunk.rendered = true;
}

// Ensure a chunk is ready for tile reveals (generated + rendered)
export function ensureChunkReady(cx, cy) {
    const chunk = getOrCreateChunk(cx, cy);
    if (!chunk.generated) {
        generateChunk(chunk);
    }
    if (!chunk.rendered) {
        renderChunk(chunk);
    }
    return chunk;
}
