// Interior data structures for building interiors

// Interior terrain types (different from outdoor terrain)
export const INTERIOR_TERRAIN = {
    FLOOR: { name: 'Floor', color: 0x5a5048, moveCost: 1, passable: true },
    WALL: { name: 'Wall', color: 0x3a3a3a, moveCost: 0, passable: false },
    DOOR_OPEN: { name: 'Open Door', color: 0x6a5a4a, moveCost: 1, passable: true },
    DOOR_CLOSED: { name: 'Closed Door', color: 0x4a3a2a, moveCost: 1, passable: true },
    DOOR_LOCKED: { name: 'Locked Door', color: 0x3a2a1a, moveCost: 0, passable: false },
    WINDOW: { name: 'Window', color: 0x8a9aaa, moveCost: 0, passable: false },
    EXIT: { name: 'Exit', color: 0x4a6a4a, moveCost: 1, passable: true }
};

// Furniture types with loot table categories
export const FURNITURE_TYPES = {
    CABINET: { name: 'Cabinet', color: 0x6a5040, lootTable: 'household', searchable: true },
    DESK: { name: 'Desk', color: 0x7a6050, lootTable: 'household', searchable: true },
    BED: { name: 'Bed', color: 0x5a4a6a, lootTable: 'household', searchable: true },
    SHELF: { name: 'Shelf', color: 0x6a5a4a, lootTable: 'household', searchable: true },
    FRIDGE: { name: 'Refrigerator', color: 0xaaaaaa, lootTable: 'food', searchable: true },
    COUNTER: { name: 'Counter', color: 0x8a7a6a, lootTable: 'household', searchable: true },
    LOCKER: { name: 'Locker', color: 0x5a6a5a, lootTable: 'valuable', searchable: true, canLock: true },
    SAFE: { name: 'Safe', color: 0x3a3a3a, lootTable: 'valuable', searchable: true, locked: true, canLock: true },
    TABLE: { name: 'Table', color: 0x7a6a5a, lootTable: null, searchable: false },
    CHAIR: { name: 'Chair', color: 0x6a5a4a, lootTable: null, searchable: false },
    TOILET: { name: 'Toilet', color: 0xdddddd, lootTable: null, searchable: false },
    SINK: { name: 'Sink', color: 0xcccccc, lootTable: null, searchable: false },
    BATHTUB: { name: 'Bathtub', color: 0xeeeeee, lootTable: null, searchable: false },
    STOVE: { name: 'Stove', color: 0x4a4a4a, lootTable: 'household', searchable: true },
    WORKBENCH: { name: 'Workbench', color: 0x5a4a3a, lootTable: 'valuable', searchable: true }
};

// Room templates define what furniture can appear in each room type
export const ROOM_TYPES = {
    LIVING_ROOM: {
        name: 'Living Room',
        furniture: ['CABINET', 'SHELF', 'TABLE', 'CHAIR'],
        minFurniture: 1,
        maxFurniture: 3
    },
    BEDROOM: {
        name: 'Bedroom',
        furniture: ['BED', 'DESK', 'CABINET', 'SHELF'],
        minFurniture: 1,
        maxFurniture: 3
    },
    KITCHEN: {
        name: 'Kitchen',
        furniture: ['FRIDGE', 'COUNTER', 'STOVE', 'TABLE'],
        minFurniture: 2,
        maxFurniture: 4
    },
    BATHROOM: {
        name: 'Bathroom',
        furniture: ['TOILET', 'SINK', 'CABINET'],
        minFurniture: 2,
        maxFurniture: 3
    },
    STORAGE: {
        name: 'Storage',
        furniture: ['SHELF', 'LOCKER', 'CABINET'],
        minFurniture: 1,
        maxFurniture: 3
    },
    OFFICE: {
        name: 'Office',
        furniture: ['DESK', 'CHAIR', 'CABINET', 'SAFE'],
        minFurniture: 2,
        maxFurniture: 4
    },
    GARAGE: {
        name: 'Garage',
        furniture: ['WORKBENCH', 'SHELF', 'LOCKER'],
        minFurniture: 1,
        maxFurniture: 3
    }
};

// Building interior templates - defines grid size and room composition
export const BUILDING_INTERIORS = {
    'Ruined House': {
        gridWidth: 8,
        gridHeight: 8,
        rooms: ['LIVING_ROOM', 'BEDROOM', 'KITCHEN', 'BATHROOM'],
        minRooms: 3,
        maxRooms: 4
    },
    'Gas Station': {
        gridWidth: 10,
        gridHeight: 6,
        rooms: ['OFFICE', 'STORAGE', 'STORAGE'],
        minRooms: 2,
        maxRooms: 3
    },
    'Abandoned Shop': {
        gridWidth: 8,
        gridHeight: 6,
        rooms: ['STORAGE', 'OFFICE'],
        minRooms: 1,
        maxRooms: 2
    },
    'Office Building': {
        gridWidth: 10,
        gridHeight: 10,
        rooms: ['OFFICE', 'OFFICE', 'OFFICE', 'BATHROOM', 'STORAGE'],
        minRooms: 3,
        maxRooms: 5
    },
    'Warehouse': {
        gridWidth: 12,
        gridHeight: 8,
        rooms: ['STORAGE', 'STORAGE', 'STORAGE', 'OFFICE'],
        minRooms: 2,
        maxRooms: 4
    },
    // Default for unrecognized buildings
    'default': {
        gridWidth: 6,
        gridHeight: 6,
        rooms: ['LIVING_ROOM', 'STORAGE'],
        minRooms: 1,
        maxRooms: 2
    }
};

// Loot tables for furniture searching
export const LOOT_TABLES = {
    household: [
        { type: 'scrap', amount: [1, 3], chance: 0.5 },
        { type: 'food', amount: [1, 1], chance: 0.2 },
        { type: null, amount: [0, 0], chance: 0.3 }  // Nothing
    ],
    food: [
        { type: 'food', amount: [1, 2], chance: 0.6 },
        { type: 'water', amount: [1, 1], chance: 0.2 },
        { type: null, amount: [0, 0], chance: 0.2 }  // Nothing
    ],
    valuable: [
        { type: 'scrap', amount: [5, 10], chance: 0.4 },
        { type: 'medicine', amount: [2, 3], chance: 0.3 },
        { type: null, amount: [0, 0], chance: 0.3 }  // Nothing
    ]
};

// Interior tile class
export class InteriorTile {
    constructor(x, y, terrain = INTERIOR_TERRAIN.FLOOR) {
        this.x = x;
        this.y = y;
        this.terrain = terrain;
        this.isPassable = terrain.passable;
        this.movementCost = terrain.moveCost;
        this.furniture = null;
        this.searched = false;
        this.contents = [];
        this.mesh = null;
        this.furnitureMesh = null;
        this.roomId = null;  // Which room this tile belongs to
        this.isExit = false;
    }

    setTerrain(terrain) {
        this.terrain = terrain;
        this.isPassable = terrain.passable;
        this.movementCost = terrain.moveCost;
    }

    setFurniture(furnitureType) {
        this.furniture = furnitureType;
        if (furnitureType) {
            this.isPassable = false;  // Furniture blocks movement
        }
    }

    getUnit() {
        return this.contents.find(c => c.isUnit);
    }

    getEnemy() {
        return this.contents.find(c => c.isEnemy);
    }

    addContent(entity) {
        if (!this.contents.includes(entity)) {
            this.contents.push(entity);
        }
    }

    removeContent(entity) {
        const idx = this.contents.indexOf(entity);
        if (idx !== -1) {
            this.contents.splice(idx, 1);
        }
    }

    // Check if this tile is a door
    isDoor() {
        return this.terrain === INTERIOR_TERRAIN.DOOR_OPEN ||
               this.terrain === INTERIOR_TERRAIN.DOOR_CLOSED ||
               this.terrain === INTERIOR_TERRAIN.DOOR_LOCKED;
    }

    // Check if door is locked
    isLocked() {
        return this.terrain === INTERIOR_TERRAIN.DOOR_LOCKED ||
               (this.furniture && this.furniture.locked);
    }

    // Unlock a door or furniture
    unlock() {
        if (this.terrain === INTERIOR_TERRAIN.DOOR_LOCKED) {
            this.setTerrain(INTERIOR_TERRAIN.DOOR_CLOSED);
            return true;
        }
        if (this.furniture && this.furniture.locked) {
            this.furniture = { ...this.furniture, locked: false };
            return true;
        }
        return false;
    }

    // Open/close a door
    toggleDoor() {
        if (this.terrain === INTERIOR_TERRAIN.DOOR_CLOSED) {
            this.setTerrain(INTERIOR_TERRAIN.DOOR_OPEN);
            return true;
        }
        if (this.terrain === INTERIOR_TERRAIN.DOOR_OPEN) {
            this.setTerrain(INTERIOR_TERRAIN.DOOR_CLOSED);
            return true;
        }
        return false;
    }

    // Break a locked door
    breakDoor() {
        if (this.terrain === INTERIOR_TERRAIN.DOOR_LOCKED) {
            this.setTerrain(INTERIOR_TERRAIN.DOOR_OPEN);
            return true;
        }
        return false;
    }
}

// Room class for BSP generation
export class Room {
    constructor(x, y, width, height, type = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.id = `${x}_${y}_${width}_${height}`;
        this.connected = false;
        this.doors = [];  // Positions of doors leading to this room
    }

    // Get center point
    get centerX() {
        return Math.floor(this.x + this.width / 2);
    }

    get centerY() {
        return Math.floor(this.y + this.height / 2);
    }

    // Check if a point is inside this room (excluding walls)
    contains(x, y) {
        return x > this.x && x < this.x + this.width - 1 &&
               y > this.y && y < this.y + this.height - 1;
    }

    // Get interior bounds (excluding walls)
    get interiorBounds() {
        return {
            x: this.x + 1,
            y: this.y + 1,
            width: this.width - 2,
            height: this.height - 2
        };
    }
}

// Door class for tracking door positions
export class Door {
    constructor(x, y, isLocked = false, connectsRooms = []) {
        this.x = x;
        this.y = y;
        this.isLocked = isLocked;
        this.isOpen = false;
        this.connectsRooms = connectsRooms;  // Array of room IDs
    }
}

// Furniture instance in the interior
export class Furniture {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.searched = false;
        this.locked = type.locked || false;
    }
}

// Main BuildingInterior class
export class BuildingInterior {
    constructor(worldX, worldY, buildingType, globalSeed) {
        this.worldX = worldX;
        this.worldY = worldY;
        this.buildingType = buildingType;
        this.globalSeed = globalSeed;

        // Get template or use default
        this.template = BUILDING_INTERIORS[buildingType] || BUILDING_INTERIORS['default'];

        this.width = this.template.gridWidth;
        this.height = this.template.gridHeight;

        // Grid of InteriorTile objects
        this.tiles = [];

        // Rooms list
        this.rooms = [];

        // Doors list
        this.doors = [];

        // Furniture list
        this.furniture = [];

        // Entry/exit position
        this.entryX = 0;
        this.entryY = 0;

        // Window positions (alternative exits)
        this.windows = [];

        // Three.js scene objects
        this.sceneObjects = [];

        // Tile meshes for raycasting
        this.tileMeshes = [];

        // Generate deterministic seed for this interior
        this.seed = this.generateSeed();
    }

    // Generate deterministic seed from world position
    generateSeed() {
        return ((this.worldX * 73856093) ^ (this.worldY * 19349663) ^ this.globalSeed) >>> 0;
    }

    // Get a tile at position
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.tiles[y * this.width + x];
    }

    // Set a tile at position
    setTile(x, y, tile) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y * this.width + x] = tile;
        }
    }

    // Initialize the tile grid
    initializeGrid() {
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = new InteriorTile(x, y, INTERIOR_TERRAIN.WALL);
                this.tiles.push(tile);
            }
        }
    }

    // Find exit tiles for the player
    getExitTiles() {
        const exits = [];
        for (const tile of this.tiles) {
            if (tile.isExit || tile.terrain === INTERIOR_TERRAIN.EXIT) {
                exits.push(tile);
            }
        }
        // Also include windows as potential exits
        for (const window of this.windows) {
            const tile = this.getTile(window.x, window.y);
            if (tile) exits.push(tile);
        }
        return exits;
    }

    // Get entry tile
    getEntryTile() {
        return this.getTile(this.entryX, this.entryY);
    }

    // Clean up Three.js objects
    dispose() {
        for (const obj of this.sceneObjects) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        }
        this.sceneObjects = [];
        this.tileMeshes = [];
    }

    // Serialize for save/load
    toJSON() {
        return {
            worldX: this.worldX,
            worldY: this.worldY,
            buildingType: this.buildingType,
            globalSeed: this.globalSeed,
            tiles: this.tiles.map(t => ({
                x: t.x,
                y: t.y,
                terrain: t.terrain.name,
                searched: t.searched,
                isExit: t.isExit,
                furniture: t.furniture ? t.furniture.name : null,
                furnitureLocked: t.furniture?.locked || false
            })),
            entryX: this.entryX,
            entryY: this.entryY
        };
    }

    // Restore from saved data
    static fromJSON(data) {
        const interior = new BuildingInterior(
            data.worldX,
            data.worldY,
            data.buildingType,
            data.globalSeed
        );

        interior.entryX = data.entryX;
        interior.entryY = data.entryY;

        // Restore tiles
        interior.tiles = data.tiles.map(tData => {
            const terrain = Object.values(INTERIOR_TERRAIN).find(t => t.name === tData.terrain) || INTERIOR_TERRAIN.FLOOR;
            const tile = new InteriorTile(tData.x, tData.y, terrain);
            tile.searched = tData.searched;
            tile.isExit = tData.isExit;

            if (tData.furniture) {
                const furnitureType = Object.values(FURNITURE_TYPES).find(f => f.name === tData.furniture);
                if (furnitureType) {
                    tile.furniture = { ...furnitureType, locked: tData.furnitureLocked };
                }
            }

            return tile;
        });

        return interior;
    }
}
