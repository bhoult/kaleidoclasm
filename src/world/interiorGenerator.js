// Procedural interior generation using BSP (Binary Space Partitioning)
import {
    BuildingInterior,
    InteriorTile,
    Room,
    Door,
    Furniture,
    INTERIOR_TERRAIN,
    FURNITURE_TYPES,
    ROOM_TYPES
} from './interior.js';

// Seeded random number generator for deterministic generation
class SeededRandom {
    constructor(seed) {
        this.seed = seed >>> 0;
    }

    // Simple xorshift algorithm
    next() {
        let x = this.seed;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.seed = x >>> 0;
        return (this.seed / 0xFFFFFFFF);
    }

    // Random integer in range [min, max]
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    // Random float in range [min, max]
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }

    // Random boolean with given probability
    nextBool(probability = 0.5) {
        return this.next() < probability;
    }

    // Shuffle array in place
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Pick random element from array
    pick(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
}

// Main interior generator
export function generateInterior(interior) {
    const rng = new SeededRandom(interior.seed);

    // Step 1: Initialize grid - floor inside, walls on perimeter only
    initializeFloorWithPerimeter(interior);

    // Step 2: Generate room divisions using simple splitting
    const rooms = generateRooms(interior, rng);
    interior.rooms = rooms;

    // Step 3: Add internal walls between rooms (single-width)
    addInternalWalls(interior, rooms, rng);

    // Step 4: Ensure all rooms are connected with doors
    connectAllRooms(interior, rooms, rng);

    // Step 5: Place entry/exit
    placeEntryExit(interior, rooms, rng);

    // Step 6: Add furniture to rooms
    placeFurniture(interior, rooms, rng);

    // Step 7: Add windows on exterior walls
    placeWindows(interior, rng);

    return interior;
}

// Initialize grid with floor tiles and perimeter walls
function initializeFloorWithPerimeter(interior) {
    interior.tiles = [];

    for (let y = 0; y < interior.height; y++) {
        for (let x = 0; x < interior.width; x++) {
            // Perimeter is walls, interior is floor
            const isPerimeter = x === 0 || x === interior.width - 1 ||
                               y === 0 || y === interior.height - 1;

            const terrain = isPerimeter ? INTERIOR_TERRAIN.WALL : INTERIOR_TERRAIN.FLOOR;
            const tile = new InteriorTile(x, y, terrain);
            interior.tiles.push(tile);
        }
    }
}

// Generate rooms by splitting the interior space
function generateRooms(interior, rng) {
    const rooms = [];
    const minRooms = interior.template.minRooms || 2;
    const maxRooms = interior.template.maxRooms || 4;
    const targetRooms = rng.nextInt(minRooms, maxRooms);

    // Interior bounds (excluding perimeter walls)
    const interiorX = 1;
    const interiorY = 1;
    const interiorW = interior.width - 2;
    const interiorH = interior.height - 2;

    // Start with one big room covering the whole interior
    const initialRoom = new Room(interiorX, interiorY, interiorW, interiorH);
    initialRoom.id = 0;
    rooms.push(initialRoom);

    // Split rooms until we have enough
    const roomTypes = [...interior.template.rooms];
    rng.shuffle(roomTypes);

    while (rooms.length < targetRooms) {
        // Find the largest room to split
        let largestRoom = null;
        let largestArea = 0;

        for (const room of rooms) {
            const area = room.width * room.height;
            // Only split rooms that are large enough (minimum 3x3 after split)
            if (area > largestArea && room.width >= 5 && room.height >= 5) {
                largestRoom = room;
                largestArea = area;
            }
        }

        if (!largestRoom) break; // Can't split anymore

        // Decide split direction (prefer splitting the longer dimension)
        const splitVertical = largestRoom.width > largestRoom.height ? true :
                             largestRoom.width < largestRoom.height ? false :
                             rng.nextBool();

        // Calculate split position (leave at least 2 tiles on each side)
        let splitPos;
        if (splitVertical) {
            const minSplit = largestRoom.x + 2;
            const maxSplit = largestRoom.x + largestRoom.width - 3;
            if (maxSplit <= minSplit) continue;
            splitPos = rng.nextInt(minSplit, maxSplit);
        } else {
            const minSplit = largestRoom.y + 2;
            const maxSplit = largestRoom.y + largestRoom.height - 3;
            if (maxSplit <= minSplit) continue;
            splitPos = rng.nextInt(minSplit, maxSplit);
        }

        // Create two new rooms from the split
        const roomIndex = rooms.indexOf(largestRoom);
        rooms.splice(roomIndex, 1);

        if (splitVertical) {
            // Split vertically (left and right rooms)
            const leftRoom = new Room(
                largestRoom.x,
                largestRoom.y,
                splitPos - largestRoom.x,
                largestRoom.height
            );
            const rightRoom = new Room(
                splitPos + 1,  // +1 for the wall
                largestRoom.y,
                largestRoom.x + largestRoom.width - splitPos - 1,
                largestRoom.height
            );
            leftRoom.id = rooms.length;
            rightRoom.id = rooms.length + 1;
            leftRoom.splitWall = { vertical: true, pos: splitPos, start: largestRoom.y, end: largestRoom.y + largestRoom.height };
            rightRoom.adjacentTo = leftRoom.id;
            leftRoom.adjacentTo = rightRoom.id;
            rooms.push(leftRoom, rightRoom);
        } else {
            // Split horizontally (top and bottom rooms)
            const topRoom = new Room(
                largestRoom.x,
                largestRoom.y,
                largestRoom.width,
                splitPos - largestRoom.y
            );
            const bottomRoom = new Room(
                largestRoom.x,
                splitPos + 1,  // +1 for the wall
                largestRoom.width,
                largestRoom.y + largestRoom.height - splitPos - 1
            );
            topRoom.id = rooms.length;
            bottomRoom.id = rooms.length + 1;
            topRoom.splitWall = { vertical: false, pos: splitPos, start: largestRoom.x, end: largestRoom.x + largestRoom.width };
            bottomRoom.adjacentTo = topRoom.id;
            topRoom.adjacentTo = bottomRoom.id;
            rooms.push(topRoom, bottomRoom);
        }
    }

    // Assign room types
    for (let i = 0; i < rooms.length; i++) {
        rooms[i].type = roomTypes[i % roomTypes.length];
        rooms[i].id = i;
    }

    // Mark tiles with their room ID
    for (const room of rooms) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                const tile = interior.getTile(x, y);
                if (tile && tile.terrain === INTERIOR_TERRAIN.FLOOR) {
                    tile.roomId = room.id;
                }
            }
        }
    }

    return rooms;
}

// Add single-width internal walls between rooms
function addInternalWalls(interior, rooms, rng) {
    // Track which walls we've added
    const wallPositions = new Set();

    for (const room of rooms) {
        if (room.splitWall) {
            const wall = room.splitWall;

            if (wall.vertical) {
                // Vertical wall at x = wall.pos
                for (let y = wall.start; y < wall.end; y++) {
                    const key = `${wall.pos},${y}`;
                    if (!wallPositions.has(key)) {
                        const tile = interior.getTile(wall.pos, y);
                        if (tile) {
                            tile.setTerrain(INTERIOR_TERRAIN.WALL);
                            wallPositions.add(key);
                        }
                    }
                }
            } else {
                // Horizontal wall at y = wall.pos
                for (let x = wall.start; x < wall.end; x++) {
                    const key = `${x},${wall.pos}`;
                    if (!wallPositions.has(key)) {
                        const tile = interior.getTile(x, wall.pos);
                        if (tile) {
                            tile.setTerrain(INTERIOR_TERRAIN.WALL);
                            wallPositions.add(key);
                        }
                    }
                }
            }
        }
    }
}

// Ensure all rooms are connected with doors
function connectAllRooms(interior, rooms, rng) {
    if (rooms.length <= 1) return;

    // Find walls between adjacent rooms and place doors
    const connected = new Set([0]); // Start with first room connected
    const unconnected = new Set(rooms.map((_, i) => i).filter(i => i !== 0));

    while (unconnected.size > 0) {
        let doorPlaced = false;

        // Try to connect an unconnected room to a connected one
        for (const connectedId of connected) {
            if (doorPlaced) break;

            for (const unconnectedId of unconnected) {
                // Find shared wall between these rooms
                const room1 = rooms[connectedId];
                const room2 = rooms[unconnectedId];

                const doorPos = findDoorPosition(interior, room1, room2, rng);
                if (doorPos) {
                    const tile = interior.getTile(doorPos.x, doorPos.y);
                    if (tile) {
                        // 20% chance of locked door
                        const isLocked = rng.nextBool(0.2);
                        tile.setTerrain(isLocked ? INTERIOR_TERRAIN.DOOR_LOCKED : INTERIOR_TERRAIN.DOOR_CLOSED);
                        interior.doors.push(new Door(doorPos.x, doorPos.y, isLocked, [connectedId, unconnectedId]));

                        connected.add(unconnectedId);
                        unconnected.delete(unconnectedId);
                        doorPlaced = true;
                        break;
                    }
                }
            }
        }

        // If we couldn't place a door, force connect remaining rooms
        if (!doorPlaced && unconnected.size > 0) {
            const nextRoom = unconnected.values().next().value;
            connected.add(nextRoom);
            unconnected.delete(nextRoom);
        }
    }
}

// Find a valid door position between two rooms
function findDoorPosition(interior, room1, room2, rng) {
    const candidates = [];

    // Check for vertical wall between rooms (room1 left of room2)
    if (room1.x + room1.width <= room2.x && room2.x - (room1.x + room1.width) <= 1) {
        const wallX = room1.x + room1.width;
        const startY = Math.max(room1.y, room2.y) + 1;
        const endY = Math.min(room1.y + room1.height, room2.y + room2.height) - 1;

        for (let y = startY; y < endY; y++) {
            const tile = interior.getTile(wallX, y);
            if (tile && tile.terrain === INTERIOR_TERRAIN.WALL) {
                candidates.push({ x: wallX, y });
            }
        }
    }

    // Check for vertical wall (room2 left of room1)
    if (room2.x + room2.width <= room1.x && room1.x - (room2.x + room2.width) <= 1) {
        const wallX = room2.x + room2.width;
        const startY = Math.max(room1.y, room2.y) + 1;
        const endY = Math.min(room1.y + room1.height, room2.y + room2.height) - 1;

        for (let y = startY; y < endY; y++) {
            const tile = interior.getTile(wallX, y);
            if (tile && tile.terrain === INTERIOR_TERRAIN.WALL) {
                candidates.push({ x: wallX, y });
            }
        }
    }

    // Check for horizontal wall (room1 above room2)
    if (room1.y + room1.height <= room2.y && room2.y - (room1.y + room1.height) <= 1) {
        const wallY = room1.y + room1.height;
        const startX = Math.max(room1.x, room2.x) + 1;
        const endX = Math.min(room1.x + room1.width, room2.x + room2.width) - 1;

        for (let x = startX; x < endX; x++) {
            const tile = interior.getTile(x, wallY);
            if (tile && tile.terrain === INTERIOR_TERRAIN.WALL) {
                candidates.push({ x, y: wallY });
            }
        }
    }

    // Check for horizontal wall (room2 above room1)
    if (room2.y + room2.height <= room1.y && room1.y - (room2.y + room2.height) <= 1) {
        const wallY = room2.y + room2.height;
        const startX = Math.max(room1.x, room2.x) + 1;
        const endX = Math.min(room1.x + room1.width, room2.x + room2.width) - 1;

        for (let x = startX; x < endX; x++) {
            const tile = interior.getTile(x, wallY);
            if (tile && tile.terrain === INTERIOR_TERRAIN.WALL) {
                candidates.push({ x, y: wallY });
            }
        }
    }

    if (candidates.length === 0) return null;

    // Pick a door position near the middle
    candidates.sort((a, b) => {
        const midA = Math.abs(a.x - (room1.centerX + room2.centerX) / 2) +
                     Math.abs(a.y - (room1.centerY + room2.centerY) / 2);
        const midB = Math.abs(b.x - (room1.centerX + room2.centerX) / 2) +
                     Math.abs(b.y - (room1.centerY + room2.centerY) / 2);
        return midA - midB;
    });

    return candidates[0];
}

// Place entry and exit points
function placeEntryExit(interior, rooms, rng) {
    // Find a good entry point on the bottom perimeter wall
    const bottomY = interior.height - 1;
    let entryX = Math.floor(interior.width / 2);

    // Find a position where there's floor directly above the wall
    for (let offset = 0; offset < interior.width; offset++) {
        const x1 = entryX + offset;
        const x2 = entryX - offset;

        if (x1 > 0 && x1 < interior.width - 1) {
            const aboveTile = interior.getTile(x1, bottomY - 1);
            if (aboveTile && aboveTile.terrain === INTERIOR_TERRAIN.FLOOR) {
                entryX = x1;
                break;
            }
        }
        if (x2 > 0 && x2 < interior.width - 1 && x2 !== x1) {
            const aboveTile = interior.getTile(x2, bottomY - 1);
            if (aboveTile && aboveTile.terrain === INTERIOR_TERRAIN.FLOOR) {
                entryX = x2;
                break;
            }
        }
    }

    // Set entry point
    const entryTile = interior.getTile(entryX, bottomY);
    if (entryTile) {
        entryTile.setTerrain(INTERIOR_TERRAIN.EXIT);
        entryTile.isExit = true;
    }

    interior.entryX = entryX;
    interior.entryY = bottomY - 1; // Player stands inside

    // Add a back exit on top wall if there's floor below it
    const topY = 0;
    for (let x = 1; x < interior.width - 1; x++) {
        const belowTile = interior.getTile(x, topY + 1);
        if (belowTile && belowTile.terrain === INTERIOR_TERRAIN.FLOOR) {
            const topTile = interior.getTile(x, topY);
            if (topTile && topTile.terrain === INTERIOR_TERRAIN.WALL) {
                topTile.setTerrain(INTERIOR_TERRAIN.EXIT);
                topTile.isExit = true;
                break;
            }
        }
    }
}

// Place furniture in rooms
function placeFurniture(interior, rooms, rng) {
    for (const room of rooms) {
        const roomType = ROOM_TYPES[room.type];
        if (!roomType) continue;

        const furnCount = rng.nextInt(roomType.minFurniture, roomType.maxFurniture);
        const availableFurniture = [...roomType.furniture];
        rng.shuffle(availableFurniture);

        // Get valid floor positions in room (not near doors)
        const floorTiles = [];
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                const tile = interior.getTile(x, y);
                if (tile && tile.terrain === INTERIOR_TERRAIN.FLOOR && !tile.isExit) {
                    // Check not adjacent to a door
                    let nearDoor = false;
                    for (const door of interior.doors) {
                        if (Math.abs(door.x - x) <= 1 && Math.abs(door.y - y) <= 1) {
                            nearDoor = true;
                            break;
                        }
                    }
                    if (!nearDoor) {
                        // Score by wall adjacency (furniture looks better against walls)
                        const score = countAdjacentWalls(interior, x, y);
                        floorTiles.push({ x, y, score });
                    }
                }
            }
        }

        // Sort by wall adjacency
        floorTiles.sort((a, b) => b.score - a.score);

        // Place furniture
        let placed = 0;
        for (let i = 0; i < floorTiles.length && placed < furnCount; i++) {
            const pos = floorTiles[i];
            const furnTypeName = availableFurniture[placed % availableFurniture.length];
            const furnType = FURNITURE_TYPES[furnTypeName];

            if (furnType) {
                const tile = interior.getTile(pos.x, pos.y);
                if (tile) {
                    const furniture = { ...furnType };
                    if (furnType.canLock) {
                        furniture.locked = rng.nextBool(0.3);
                    }
                    tile.setFurniture(furniture);
                    interior.furniture.push(new Furniture(pos.x, pos.y, furniture));
                    placed++;
                }
            }
        }
    }
}

// Count adjacent walls for furniture placement
function countAdjacentWalls(interior, x, y) {
    let count = 0;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of dirs) {
        const tile = interior.getTile(x + dx, y + dy);
        if (!tile || tile.terrain === INTERIOR_TERRAIN.WALL) {
            count++;
        }
    }
    return count;
}

// Place windows on exterior walls
function placeWindows(interior, rng) {
    const windowCount = rng.nextInt(1, 3);
    const candidates = [];

    // Left wall
    for (let y = 2; y < interior.height - 2; y++) {
        const tile = interior.getTile(0, y);
        const inner = interior.getTile(1, y);
        if (tile && tile.terrain === INTERIOR_TERRAIN.WALL &&
            inner && inner.terrain === INTERIOR_TERRAIN.FLOOR) {
            candidates.push({ x: 0, y });
        }
    }

    // Right wall
    for (let y = 2; y < interior.height - 2; y++) {
        const tile = interior.getTile(interior.width - 1, y);
        const inner = interior.getTile(interior.width - 2, y);
        if (tile && tile.terrain === INTERIOR_TERRAIN.WALL &&
            inner && inner.terrain === INTERIOR_TERRAIN.FLOOR) {
            candidates.push({ x: interior.width - 1, y });
        }
    }

    // Top wall
    for (let x = 2; x < interior.width - 2; x++) {
        const tile = interior.getTile(x, 0);
        const inner = interior.getTile(x, 1);
        if (tile && tile.terrain === INTERIOR_TERRAIN.WALL &&
            inner && inner.terrain === INTERIOR_TERRAIN.FLOOR &&
            !tile.isExit) {
            candidates.push({ x, y: 0 });
        }
    }

    rng.shuffle(candidates);

    for (let i = 0; i < Math.min(windowCount, candidates.length); i++) {
        const pos = candidates[i];
        const tile = interior.getTile(pos.x, pos.y);
        if (tile && tile.terrain === INTERIOR_TERRAIN.WALL) {
            tile.setTerrain(INTERIOR_TERRAIN.WINDOW);
            interior.windows.push({ x: pos.x, y: pos.y });
        }
    }
}
