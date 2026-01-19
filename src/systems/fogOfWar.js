// Fog of War system - reveals tiles as units explore
import { GameState } from '../state.js';
import { CHUNK } from '../config.js';
import { worldToChunk } from '../world/chunk.js';
import { getTileGlobal, ensureChunkReady, rebuildVisibleMeshCache } from '../world/chunkManager.js';
import { scene } from '../core/renderer.js';
import { addPendingPropsToScene } from '../world/props.js';

// Reveal all tiles within a radius of a position
export function revealAroundPosition(x, y, radius = CHUNK.REVEAL_RADIUS) {
    const revealed = [];

    // Ensure all chunks in radius are ready
    const chunksToReady = getChunksInRadius(x, y, radius);
    for (const chunkCoord of chunksToReady) {
        ensureChunkReady(chunkCoord.cx, chunkCoord.cy);
    }

    // Reveal tiles in circular radius
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            // Circular check
            if (dx * dx + dy * dy > radius * radius) continue;

            const tx = x + dx;
            const ty = y + dy;
            const key = `${tx},${ty}`;

            // Skip if already revealed
            if (GameState.map.revealedTiles.has(key)) continue;

            const tile = getTileGlobal(tx, ty);
            if (tile) {
                // Mark as revealed
                GameState.map.revealedTiles.add(key);

                // Reveal the tile (creates mesh, adds to scene)
                tile.reveal(scene, GameState.map.visibleTileMeshes);

                // Add props to scene
                addPendingPropsToScene(tile);

                revealed.push(tile);
            }
        }
    }

    return revealed;
}

// Check if a tile at position is revealed
export function isTileRevealed(x, y) {
    return GameState.map.revealedTiles.has(`${x},${y}`);
}

// Get chunk coordinates that overlap with a radius around a position
export function getChunksInRadius(x, y, radius) {
    const chunks = [];
    const minCx = Math.floor((x - radius) / CHUNK.SIZE);
    const maxCx = Math.floor((x + radius) / CHUNK.SIZE);
    const minCy = Math.floor((y - radius) / CHUNK.SIZE);
    const maxCy = Math.floor((y + radius) / CHUNK.SIZE);

    for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
            chunks.push({ cx, cy });
        }
    }

    return chunks;
}

// Update visibility after a unit moves
export function updateVisibility(unit) {
    if (!unit) return;

    const newlyRevealed = revealAroundPosition(unit.x, unit.y, CHUNK.REVEAL_RADIUS);

    // Mesh cache is updated incrementally by tile.reveal()
    // No need to rebuild the entire cache

    return newlyRevealed;
}

// Force rebuild of the visible mesh cache (use sparingly)
export function forceRebuildMeshCache() {
    rebuildVisibleMeshCache();
}

// Initial reveal for starting game state
export function initialReveal(units) {
    for (const unit of units) {
        revealAroundPosition(unit.x, unit.y, CHUNK.REVEAL_RADIUS);
    }
}

// Get all revealed tiles as an array (for iteration)
export function getRevealedTiles() {
    const tiles = [];
    for (const key of GameState.map.revealedTiles) {
        const tile = GameState.map.tiles.get(key);
        if (tile) {
            tiles.push(tile);
        }
    }
    return tiles;
}
