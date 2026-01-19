// Map generation and management
import * as THREE from 'three';
import { scene } from '../core/renderer.js';
import { GameState } from '../state.js';
import { MAP } from '../config.js';
import { Tile } from './tile.js';
import { initNoise, fbm, noise2D } from './noise.js';
import { addPropsToTile, generateRoads, createUrbanZones } from './props.js';

export function generateMap(seed = Date.now()) {
    initNoise(seed);
    GameState.seed = seed;
    GameState.map.width = MAP.WIDTH;
    GameState.map.height = MAP.HEIGHT;
    GameState.map.tiles = [];

    // Generate tiles
    for (let y = 0; y < MAP.HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP.WIDTH; x++) {
            // Use FBM for elevation
            const elevation = (fbm(x * 0.1, y * 0.1, 4) + 1) / 2;

            // Different noise for moisture
            const moisture = (fbm(x * 0.08 + 100, y * 0.08 + 100, 3) + 1) / 2;

            // Radiation clusters (rare, ~5% of map)
            const radNoise = noise2D(x * 0.15, y * 0.15);
            const radiationLevel = radNoise > 0.65 ? (radNoise - 0.65) / 0.35 : 0;

            const tile = new Tile(x, y, elevation, moisture, radiationLevel);
            row.push(tile);
        }
        GameState.map.tiles.push(row);
    }

    return GameState.map.tiles;
}

export function renderMap() {
    const { tiles } = GameState.map;

    // First pass: create urban zones (modifies terrain types)
    createUrbanZones(tiles);

    // Second pass: create tile meshes with final terrain
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            const tile = tiles[y][x];
            const mesh = tile.createMesh();
            scene.add(mesh);

            if (tile.glowMesh) {
                scene.add(tile.glowMesh);
            }
        }
    }

    // Third pass: add props (depends on terrain type)
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            addPropsToTile(tiles[y][x]);
        }
    }

    // Fourth pass: generate roads connecting buildings
    generateRoads(tiles);
}

export function getTile(x, y) {
    if (x < 0 || x >= MAP.WIDTH || y < 0 || y >= MAP.HEIGHT) {
        return null;
    }
    return GameState.map.tiles[y]?.[x] ?? null;
}

export function getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
        [0, -1], [1, 0], [0, 1], [-1, 0], // Cardinal
        [1, -1], [1, 1], [-1, 1], [-1, -1] // Diagonal
    ];

    for (const [dx, dy] of directions) {
        const tile = getTile(x + dx, y + dy);
        if (tile && tile.isPassable) {
            neighbors.push(tile);
        }
    }

    return neighbors;
}

export function clearMapHighlights() {
    const { tiles } = GameState.map;
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            tiles[y][x].clearHighlight();
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
    return getTile(x, y);
}
