// Map generation and management
import * as THREE from 'three';
import { scene } from '../core/renderer.js';
import { GameState } from '../state.js';
import { MAP } from '../config.js';
import { initChunkSystem, getTileGlobal, getNeighborsGlobal, rebuildVisibleMeshCache } from './chunkManager.js';

// Initialize map with seed (no longer generates everything upfront)
export function initMap(seed = Date.now()) {
    initChunkSystem(seed);
}

// Legacy alias for compatibility
export function generateMap(seed = Date.now()) {
    initMap(seed);
}

// renderMap is now a no-op - chunks render when revealed
export function renderMap() {
    // Chunks are rendered when revealed via fog of war system
}

// Delegate to chunk-based global functions
export function getTile(x, y) {
    return getTileGlobal(x, y);
}

export function getNeighbors(x, y) {
    return getNeighborsGlobal(x, y);
}

export function clearMapHighlights() {
    // Clear highlights from all revealed tiles
    for (const key of GameState.map.revealedTiles) {
        const tile = GameState.map.tiles.get(key);
        if (tile) {
            tile.clearHighlight();
        }
    }

    // Remove highlight meshes
    for (const mesh of GameState.moveHighlights) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    }
    GameState.moveHighlights = [];
}

export function highlightTiles(tiles, color) {
    for (const tile of tiles) {
        tile.setHighlight(color);

        // Add visual highlight ring
        const ringGeometry = new THREE.RingGeometry(
            MAP.TILE_SIZE * 0.35,
            MAP.TILE_SIZE * 0.45,
            4
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.rotation.z = Math.PI / 4;
        ring.position.set(
            tile.x * MAP.TILE_SIZE,
            MAP.TILE_HEIGHT + tile.elevation * 0.3 + 0.05,
            tile.y * MAP.TILE_SIZE
        );
        scene.add(ring);
        GameState.moveHighlights.push(ring);
    }
}

export function worldToTile(worldX, worldZ) {
    const x = Math.round(worldX / MAP.TILE_SIZE);
    const y = Math.round(worldZ / MAP.TILE_SIZE);
    // Only return revealed tiles for interaction
    const tile = getTile(x, y);
    return (tile && tile.revealed) ? tile : null;
}
