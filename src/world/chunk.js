// Chunk class for managing 20x20 tile sections of the map
import { CHUNK } from '../config.js';

export class Chunk {
    constructor(cx, cy) {
        this.cx = cx;              // Chunk X coordinate
        this.cy = cy;              // Chunk Y coordinate
        this.generated = false;    // Terrain data exists
        this.rendered = false;     // Meshes in scene
        this.tiles = new Map();    // Local tile storage (key: "lx,ly")
        this.buildings = [];       // Building anchors in this chunk
        this.occupiedByLargeObject = new Set(); // Track multi-tile object positions
    }

    get key() { return `${this.cx},${this.cy}`; }
    get minX() { return this.cx * CHUNK.SIZE; }
    get maxX() { return (this.cx + 1) * CHUNK.SIZE - 1; }
    get minY() { return this.cy * CHUNK.SIZE; }
    get maxY() { return (this.cy + 1) * CHUNK.SIZE - 1; }

    // Check if a world coordinate is within this chunk
    contains(x, y) {
        return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
    }

    // Get a tile by local coordinates
    getTileLocal(lx, ly) {
        return this.tiles.get(`${lx},${ly}`);
    }

    // Set a tile by local coordinates
    setTileLocal(lx, ly, tile) {
        this.tiles.set(`${lx},${ly}`, tile);
    }
}

// Convert world coordinates to chunk coordinates
export function worldToChunk(x, y) {
    return {
        cx: Math.floor(x / CHUNK.SIZE),
        cy: Math.floor(y / CHUNK.SIZE)
    };
}

// Get chunk key string from world coordinates
export function getChunkKey(x, y) {
    const { cx, cy } = worldToChunk(x, y);
    return `${cx},${cy}`;
}

// Get local coordinates within chunk from world coordinates
export function getLocalCoords(x, y) {
    // Handle negative coordinates properly
    let lx = x % CHUNK.SIZE;
    let ly = y % CHUNK.SIZE;
    if (lx < 0) lx += CHUNK.SIZE;
    if (ly < 0) ly += CHUNK.SIZE;
    return { lx, ly };
}

// Check if world coordinates are within valid map bounds
export function isValidCoord(x, y) {
    return x >= -CHUNK.MAX_COORD && x < CHUNK.MAX_COORD &&
           y >= -CHUNK.MAX_COORD && y < CHUNK.MAX_COORD;
}

// Check if a multi-tile object at anchor (x, y) would fit entirely within one chunk
export function fitsInChunk(x, y, width, depth) {
    const { cx, cy } = worldToChunk(x, y);
    const startX = x - Math.floor((width - 1) / 2);
    const endX = startX + width - 1;
    const startY = y - Math.floor((depth - 1) / 2);
    const endY = startY + depth - 1;

    const startChunk = worldToChunk(startX, startY);
    const endChunk = worldToChunk(endX, endY);

    return startChunk.cx === endChunk.cx && startChunk.cy === endChunk.cy;
}
