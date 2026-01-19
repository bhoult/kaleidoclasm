// Procedural props and objects for map tiles
import * as THREE from 'three';
import { scene } from '../core/renderer.js';
import { MAP, TERRAIN, CHUNK } from '../config.js';
import { noise2D } from './noise.js';
import { fitsInChunk } from './chunk.js';

// Create a dead tree
function createTree(height = 0.8) {
    const group = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.03, 0.05, height * 0.6, 6);
    const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x4a3728,
        roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = height * 0.3;
    trunk.castShadow = true;
    group.add(trunk);

    // Dead branches (no leaves, post-apocalyptic)
    const branchMat = new THREE.MeshStandardMaterial({
        color: 0x3d2817,
        roughness: 0.9
    });

    for (let i = 0; i < 3; i++) {
        const branchGeo = new THREE.CylinderGeometry(0.01, 0.02, height * 0.3, 4);
        const branch = new THREE.Mesh(branchGeo, branchMat);
        branch.position.y = height * 0.4 + i * 0.1;
        branch.rotation.z = (Math.random() - 0.5) * 1.2;
        branch.rotation.y = Math.random() * Math.PI * 2;
        branch.castShadow = true;
        group.add(branch);
    }

    return group;
}

// Create a rock
function createRock(size = 0.15) {
    const geo = new THREE.DodecahedronGeometry(size, 0);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8,
        flatShading: true
    });
    const rock = new THREE.Mesh(geo, mat);
    rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    rock.scale.set(
        1 + Math.random() * 0.5,
        0.6 + Math.random() * 0.4,
        1 + Math.random() * 0.5
    );
    rock.castShadow = true;
    return rock;
}

// Create a ruined house (spans 2x2 tiles = 20x20 sq ft)
function createHouse() {
    const group = new THREE.Group();
    const houseWidth = MAP.TILE_SIZE * 1.8;  // Slightly less than 2 tiles
    const houseDepth = MAP.TILE_SIZE * 1.8;
    const houseHeight = 0.6;

    // Base/walls
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x8b8878,
        roughness: 0.9
    });

    // Main structure (damaged box)
    const baseGeo = new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth);
    const base = new THREE.Mesh(baseGeo, wallMat);
    base.position.y = houseHeight / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Damaged roof (tilted)
    const roofGeo = new THREE.BoxGeometry(houseWidth + 0.1, 0.1, houseDepth + 0.1);
    const roofMat = new THREE.MeshStandardMaterial({
        color: 0x5c4033,
        roughness: 0.8
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = houseHeight + 0.05;
    roof.rotation.z = 0.1; // Tilted/damaged
    roof.castShadow = true;
    group.add(roof);

    // Door hole
    const doorGeo = new THREE.BoxGeometry(0.25, 0.4, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.2, houseDepth / 2 + 0.01);
    group.add(door);

    // Windows
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.3 });
    const windowGeo = new THREE.BoxGeometry(0.2, 0.2, 0.05);

    [-0.5, 0.5].forEach(xOff => {
        const win = new THREE.Mesh(windowGeo, windowMat);
        win.position.set(xOff, houseHeight * 0.6, houseDepth / 2 + 0.01);
        group.add(win);
    });

    return group;
}

// Create a gas station (spans 3x2 tiles = 30x20 sq ft)
function createGasStation() {
    const group = new THREE.Group();
    const stationWidth = MAP.TILE_SIZE * 2.8;
    const stationDepth = MAP.TILE_SIZE * 1.8;
    const canopyHeight = 0.7;

    const metalMat = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.5,
        metalness: 0.3
    });

    // Canopy supports (4 poles)
    const polePositions = [
        [-stationWidth/2 + 0.2, -stationDepth/2 + 0.2],
        [stationWidth/2 - 0.2, -stationDepth/2 + 0.2],
        [-stationWidth/2 + 0.2, stationDepth/2 - 0.2],
        [stationWidth/2 - 0.2, stationDepth/2 - 0.2]
    ];

    polePositions.forEach(([x, z]) => {
        const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, canopyHeight, 6);
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.set(x, canopyHeight / 2, z);
        pole.castShadow = true;
        group.add(pole);
    });

    // Canopy
    const canopyGeo = new THREE.BoxGeometry(stationWidth, 0.08, stationDepth);
    const canopyMat = new THREE.MeshStandardMaterial({
        color: 0xcc3333,
        roughness: 0.7
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = canopyHeight + 0.04;
    canopy.castShadow = true;
    group.add(canopy);

    // Gas pumps (2 pumps)
    const pumpMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.6
    });

    [-0.5, 0.5].forEach(xOff => {
        const pumpGeo = new THREE.BoxGeometry(0.15, 0.4, 0.12);
        const pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.set(xOff, 0.2, 0);
        pump.castShadow = true;
        group.add(pump);

        // Pump display
        const displayGeo = new THREE.BoxGeometry(0.1, 0.08, 0.02);
        const displayMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.position.set(xOff, 0.35, 0.07);
        group.add(display);
    });

    // Small store building at back
    const storeGeo = new THREE.BoxGeometry(stationWidth * 0.4, 0.5, stationDepth * 0.3);
    const storeMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.8 });
    const store = new THREE.Mesh(storeGeo, storeMat);
    store.position.set(0, 0.25, -stationDepth / 2 + stationDepth * 0.15);
    store.castShadow = true;
    group.add(store);

    return group;
}

// Create debris/rubble
function createDebris() {
    const group = new THREE.Group();
    const debrisMat = new THREE.MeshStandardMaterial({
        color: 0x666655,
        roughness: 0.9,
        flatShading: true
    });

    for (let i = 0; i < 4; i++) {
        const size = 0.05 + Math.random() * 0.08;
        const geo = new THREE.BoxGeometry(size, size * 0.5, size);
        const piece = new THREE.Mesh(geo, debrisMat);
        piece.position.set(
            (Math.random() - 0.5) * 0.3,
            size * 0.25,
            (Math.random() - 0.5) * 0.3
        );
        piece.rotation.y = Math.random() * Math.PI;
        piece.castShadow = true;
        group.add(piece);
    }

    return group;
}

// Create toxic barrel
function createToxicBarrel() {
    const group = new THREE.Group();

    const barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
    const barrelMat = new THREE.MeshStandardMaterial({
        color: 0xcccc00,
        roughness: 0.6
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.y = 0.1;
    barrel.rotation.x = 0.3; // Tipped over
    barrel.rotation.z = Math.random() * 0.5;
    barrel.castShadow = true;
    group.add(barrel);

    // Hazard stripe
    const stripeGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.05, 8);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0.1;
    stripe.rotation.x = 0.3;
    stripe.rotation.z = barrel.rotation.z;
    group.add(stripe);

    return group;
}

// Create a burnt car wreck
function createCarWreck() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.8
    });

    // Car body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.15, 0.25);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.12;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(0.25, 0.12, 0.22);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(-0.05, 0.26, 0);
    cabin.castShadow = true;
    group.add(cabin);

    // Wheels (flat/missing)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const wheelPositions = [
        [-0.15, 0.05, 0.12],
        [-0.15, 0.05, -0.12],
        [0.15, 0.05, 0.12],
        [0.15, 0.05, -0.12]
    ];

    wheelPositions.forEach(pos => {
        const wheelGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.03, 8);
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(...pos);
        wheel.rotation.x = Math.PI / 2;
        group.add(wheel);
    });

    // Random tilt (crashed)
    group.rotation.z = (Math.random() - 0.5) * 0.2;

    return group;
}

// Create a dead bush
function createBush() {
    const group = new THREE.Group();
    const bushMat = new THREE.MeshStandardMaterial({
        color: 0x4a4035,
        roughness: 0.9
    });

    for (let i = 0; i < 5; i++) {
        const stickGeo = new THREE.CylinderGeometry(0.008, 0.015, 0.15 + Math.random() * 0.1, 4);
        const stick = new THREE.Mesh(stickGeo, bushMat);
        stick.position.set(
            (Math.random() - 0.5) * 0.1,
            0.08,
            (Math.random() - 0.5) * 0.1
        );
        stick.rotation.x = (Math.random() - 0.5) * 0.5;
        stick.rotation.z = (Math.random() - 0.5) * 0.5;
        stick.castShadow = true;
        group.add(stick);
    }

    return group;
}

// Props configuration by terrain type
// size: { width, depth } in tiles - multi-tile objects span this area
const TERRAIN_PROPS = {
    'Grass': [
        { name: 'Dead Tree', create: createTree, chance: 0.2, scale: [0.7, 1.2], isBuilding: false, size: { width: 1, depth: 1 } },
        { name: 'Dead Bush', create: createBush, chance: 0.15, scale: [0.8, 1.2], isBuilding: false, size: { width: 1, depth: 1 } },
        { name: 'Rock', create: createRock, chance: 0.05, scale: [0.5, 0.8], isBuilding: false, size: { width: 1, depth: 1 } }
    ],
    'Dirt': [
        { name: 'Rock', create: createRock, chance: 0.12, scale: [0.6, 1.0], isBuilding: false, size: { width: 1, depth: 1 } },
        { name: 'Dead Bush', create: createBush, chance: 0.08, scale: [0.7, 1.0], isBuilding: false, size: { width: 1, depth: 1 } },
        { name: 'Debris', create: createDebris, chance: 0.05, scale: [0.8, 1.2], isBuilding: false, size: { width: 1, depth: 1 } }
    ],
    'Mud': [
        { name: 'Rock', create: createRock, chance: 0.08, scale: [0.4, 0.7], isBuilding: false, size: { width: 1, depth: 1 } }
    ],
    'Sand': [
        { name: 'Rock', create: createRock, chance: 0.1, scale: [0.5, 0.9], isBuilding: false, size: { width: 1, depth: 1 } },
        { name: 'Dead Bush', create: createBush, chance: 0.05, scale: [0.5, 0.8], isBuilding: false, size: { width: 1, depth: 1 } }
    ],
    'Pavement': [
        { name: 'Car Wreck', create: createCarWreck, chance: 0.06, scale: [0.8, 1.0], isBuilding: false, size: { width: 1, depth: 1 } },
        { name: 'Debris', create: createDebris, chance: 0.08, scale: [0.8, 1.2], isBuilding: false, size: { width: 1, depth: 1 } }
    ],
    'Concrete': [
        { name: 'Ruined House', create: createHouse, chance: 0.15, scale: [0.9, 1.1], isBuilding: true, size: { width: 2, depth: 2 } },
        { name: 'Gas Station', create: createGasStation, chance: 0.04, scale: [0.9, 1.0], isBuilding: true, size: { width: 3, depth: 2 } },
        { name: 'Debris', create: createDebris, chance: 0.1, scale: [1.0, 1.5], isBuilding: false, size: { width: 1, depth: 1 } }
    ],
    'Toxic': [
        { name: 'Toxic Barrel', create: createToxicBarrel, chance: 0.25, scale: [0.8, 1.2], isBuilding: false, size: { width: 1, depth: 1 } },
        { name: 'Debris', create: createDebris, chance: 0.1, scale: [0.8, 1.0], isBuilding: false, size: { width: 1, depth: 1 } },
        { name: 'Rock', create: createRock, chance: 0.08, scale: [0.5, 0.8], isBuilding: false, size: { width: 1, depth: 1 } }
    ],
    'Rubble': [
        { name: 'Debris', create: createDebris, chance: 0.3, scale: [1.0, 1.5], isBuilding: false, size: { width: 1, depth: 1 } },
        { name: 'Rock', create: createRock, chance: 0.15, scale: [0.6, 1.0], isBuilding: false, size: { width: 1, depth: 1 } }
    ],
    'Water': []
};

// Track building locations for road generation (legacy - for old map system)
const buildingTiles = [];

// Track tiles occupied by multi-tile objects (to prevent overlap) (legacy)
const occupiedByLargeObject = new Set();

// Seeded random for deterministic chunk generation
function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

// Clear occupied tiles tracking (call when regenerating map)
export function clearOccupiedTiles() {
    occupiedByLargeObject.clear();
}

// First pass: create urban zones with concrete/pavement terrain
export function createUrbanZones(tiles) {
    const urbanCenters = [];

    // Randomly place urban center seeds (avoiding water and toxic)
    for (let i = 0; i < 4; i++) {
        const x = 3 + Math.floor(Math.random() * (MAP.WIDTH - 6));
        const y = 3 + Math.floor(Math.random() * (MAP.HEIGHT - 6));
        const tile = tiles[y]?.[x];

        if (tile && tile.terrain !== TERRAIN.WATER && tile.terrain !== TERRAIN.TOXIC) {
            urbanCenters.push({ x, y, size: 2 + Math.floor(Math.random() * 2) });
        }
    }

    // Expand urban zones
    for (const center of urbanCenters) {
        for (let dy = -center.size; dy <= center.size; dy++) {
            for (let dx = -center.size; dx <= center.size; dx++) {
                const nx = center.x + dx;
                const ny = center.y + dy;
                const tile = tiles[ny]?.[nx];

                if (tile && tile.terrain !== TERRAIN.WATER && tile.terrain !== TERRAIN.TOXIC) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist <= center.size) {
                        // Center tiles are concrete, outer are pavement
                        if (dist <= 1) {
                            tile.setTerrain(TERRAIN.CONCRETE);
                        } else if (Math.random() < 0.7) {
                            tile.setTerrain(TERRAIN.PAVEMENT);
                        } else {
                            tile.setTerrain(TERRAIN.RUBBLE);
                        }
                    }
                }
            }
        }
    }
}

// Check if all tiles for a multi-tile object are available
function canPlaceMultiTileObject(tile, size, tiles) {
    const { width, depth } = size;

    // Multi-tile objects are centered on the anchor tile
    const startX = tile.x - Math.floor((width - 1) / 2);
    const startY = tile.y - Math.floor((depth - 1) / 2);

    for (let dy = 0; dy < depth; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const nx = startX + dx;
            const ny = startY + dy;
            const key = `${nx},${ny}`;

            // Check bounds
            if (ny < 0 || ny >= MAP.HEIGHT || nx < 0 || nx >= MAP.WIDTH) {
                return false;
            }

            // Check if already occupied by another large object
            if (occupiedByLargeObject.has(key)) {
                return false;
            }

            // Check if tile exists and is suitable
            const checkTile = tiles?.[ny]?.[nx];
            if (!checkTile || checkTile.terrain === TERRAIN.WATER || checkTile.terrain === TERRAIN.TOXIC) {
                return false;
            }
        }
    }
    return true;
}

// Mark tiles as occupied by a multi-tile object
function markTilesOccupied(tile, size, tiles) {
    const { width, depth } = size;
    const startX = tile.x - Math.floor((width - 1) / 2);
    const startY = tile.y - Math.floor((depth - 1) / 2);

    const occupiedTiles = [];

    for (let dy = 0; dy < depth; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const nx = startX + dx;
            const ny = startY + dy;
            const key = `${nx},${ny}`;
            occupiedByLargeObject.add(key);

            // Mark the tile as having a building part
            const occupiedTile = tiles?.[ny]?.[nx];
            if (occupiedTile) {
                occupiedTile.hasBuilding = true;
                occupiedTiles.push(occupiedTile);
            }
        }
    }
    return occupiedTiles;
}

export function addPropsToTile(tile, tiles = null) {
    // Don't add props to water
    if (tile.terrain === TERRAIN.WATER) return;

    // Skip if already occupied by a large object
    const tileKey = `${tile.x},${tile.y}`;
    if (occupiedByLargeObject.has(tileKey)) return;

    const terrainName = tile.terrain.name;
    const props = TERRAIN_PROPS[terrainName];

    if (!props || props.length === 0) return;

    // Initialize props arrays if needed
    if (!tile.props) tile.props = [];
    if (!tile.propNames) tile.propNames = [];

    for (const propConfig of props) {
        if (Math.random() < propConfig.chance) {
            const { size } = propConfig;
            const isMultiTile = size.width > 1 || size.depth > 1;

            // For multi-tile objects, check if all required tiles are available
            if (isMultiTile) {
                if (!tiles || !canPlaceMultiTileObject(tile, size, tiles)) {
                    continue; // Skip this prop, try others
                }
            }

            const prop = propConfig.create();

            // Random scale within range
            const scale = propConfig.scale[0] + Math.random() * (propConfig.scale[1] - propConfig.scale[0]);
            prop.scale.setScalar(scale);

            // Calculate position
            let posX, posZ;

            if (isMultiTile) {
                // Multi-tile objects are centered on the anchor tile
                posX = tile.x * MAP.TILE_SIZE;
                posZ = tile.y * MAP.TILE_SIZE;

                // Mark all tiles as occupied
                const occupiedTiles = markTilesOccupied(tile, size, tiles);

                // Add prop reference to all occupied tiles
                for (const occTile of occupiedTiles) {
                    if (!occTile.props) occTile.props = [];
                    if (!occTile.propNames) occTile.propNames = [];
                    occTile.props.push(prop);
                    if (!occTile.propNames.includes(propConfig.name)) {
                        occTile.propNames.push(propConfig.name);
                    }
                }
            } else {
                // Single-tile objects have slight random offset
                const offsetX = (Math.random() - 0.5) * 0.3;
                const offsetZ = (Math.random() - 0.5) * 0.3;
                posX = tile.x * MAP.TILE_SIZE + offsetX;
                posZ = tile.y * MAP.TILE_SIZE + offsetZ;

                // Add to this tile only
                tile.props.push(prop);
                if (!tile.propNames.includes(propConfig.name)) {
                    tile.propNames.push(propConfig.name);
                }
            }

            prop.position.set(
                posX,
                MAP.TILE_HEIGHT + tile.elevation * 0.3,
                posZ
            );

            // Random rotation
            prop.rotation.y = Math.random() * Math.PI * 2;

            scene.add(prop);

            // Track buildings for road generation
            if (propConfig.isBuilding) {
                buildingTiles.push(tile);
                tile.hasBuilding = true;
            }

            // For buildings, only place one per anchor tile
            // For small objects, allow multiple per tile (no break)
            if (propConfig.isBuilding) {
                break;
            }
        }
    }

    // Legacy support: set propName from propNames array
    if (tile.propNames && tile.propNames.length > 0) {
        tile.propName = tile.propNames.join(', ');
    }
}

export function clearTileProps(tile) {
    if (tile.props) {
        for (const prop of tile.props) {
            scene.remove(prop);
            prop.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        tile.props = [];
    }
}

// Road meshes storage
const roadMeshes = [];

// Shared road materials
let roadMat = null;
let lineMat = null;

function getRoadMaterials() {
    if (!roadMat) {
        roadMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.9
        });
        lineMat = new THREE.MeshStandardMaterial({
            color: 0x5a5a4a,
            roughness: 0.8
        });
    }
    return { roadMat, lineMat };
}

// Create a road segment that fills the tile with proper connections
function createRoadSegment(tile, directions) {
    const group = new THREE.Group();
    const { roadMat, lineMat } = getRoadMaterials();
    const roadWidth = MAP.TILE_SIZE * 0.4;

    // Count connections
    const { north, south, east, west } = directions;

    // Create road pieces based on connections
    // Straight roads
    if ((north && south) || (east && west)) {
        if (north && south) {
            // Vertical road
            const geo = new THREE.PlaneGeometry(roadWidth, MAP.TILE_SIZE);
            const road = new THREE.Mesh(geo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.y = 0.01;
            road.receiveShadow = true;
            group.add(road);

            // Center line
            const lineGeo = new THREE.PlaneGeometry(0.02, MAP.TILE_SIZE * 0.8);
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.y = 0.015;
            group.add(line);
        }
        if (east && west) {
            // Horizontal road
            const geo = new THREE.PlaneGeometry(MAP.TILE_SIZE, roadWidth);
            const road = new THREE.Mesh(geo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.y = 0.01;
            road.receiveShadow = true;
            group.add(road);

            // Center line
            const lineGeo = new THREE.PlaneGeometry(MAP.TILE_SIZE * 0.8, 0.02);
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.y = 0.015;
            group.add(line);
        }
    }

    // Corner pieces and T-junctions
    const connectionCount = (north ? 1 : 0) + (south ? 1 : 0) + (east ? 1 : 0) + (west ? 1 : 0);

    if (connectionCount >= 2 && !((north && south && !east && !west) || (east && west && !north && !south))) {
        // Intersection or corner - create a filled center
        const centerGeo = new THREE.PlaneGeometry(roadWidth, roadWidth);
        const center = new THREE.Mesh(centerGeo, roadMat);
        center.rotation.x = -Math.PI / 2;
        center.position.y = 0.01;
        center.receiveShadow = true;
        group.add(center);

        // Add arms extending to edges
        const armLength = (MAP.TILE_SIZE - roadWidth) / 2;
        const armGeo = new THREE.PlaneGeometry(roadWidth, armLength);

        if (north) {
            const arm = new THREE.Mesh(armGeo, roadMat);
            arm.rotation.x = -Math.PI / 2;
            arm.position.set(0, 0.01, -(roadWidth / 2 + armLength / 2));
            arm.receiveShadow = true;
            group.add(arm);
        }
        if (south) {
            const arm = new THREE.Mesh(armGeo, roadMat);
            arm.rotation.x = -Math.PI / 2;
            arm.position.set(0, 0.01, roadWidth / 2 + armLength / 2);
            arm.receiveShadow = true;
            group.add(arm);
        }
        if (east) {
            const arm = new THREE.Mesh(armGeo, roadMat);
            arm.rotation.x = -Math.PI / 2;
            arm.rotation.z = Math.PI / 2;
            arm.position.set(roadWidth / 2 + armLength / 2, 0.01, 0);
            arm.receiveShadow = true;
            group.add(arm);
        }
        if (west) {
            const arm = new THREE.Mesh(armGeo, roadMat);
            arm.rotation.x = -Math.PI / 2;
            arm.rotation.z = Math.PI / 2;
            arm.position.set(-(roadWidth / 2 + armLength / 2), 0.01, 0);
            arm.receiveShadow = true;
            group.add(arm);
        }
    }

    // Dead end (single connection)
    if (connectionCount === 1) {
        const endLength = MAP.TILE_SIZE / 2;
        const endGeo = new THREE.PlaneGeometry(roadWidth, endLength);

        if (north) {
            const end = new THREE.Mesh(endGeo, roadMat);
            end.rotation.x = -Math.PI / 2;
            end.position.set(0, 0.01, -endLength / 2);
            end.receiveShadow = true;
            group.add(end);
        } else if (south) {
            const end = new THREE.Mesh(endGeo, roadMat);
            end.rotation.x = -Math.PI / 2;
            end.position.set(0, 0.01, endLength / 2);
            end.receiveShadow = true;
            group.add(end);
        } else if (east) {
            const end = new THREE.Mesh(endGeo, roadMat);
            end.rotation.x = -Math.PI / 2;
            end.rotation.z = Math.PI / 2;
            end.position.set(endLength / 2, 0.01, 0);
            end.receiveShadow = true;
            group.add(end);
        } else if (west) {
            const end = new THREE.Mesh(endGeo, roadMat);
            end.rotation.x = -Math.PI / 2;
            end.rotation.z = Math.PI / 2;
            end.position.set(-endLength / 2, 0.01, 0);
            end.receiveShadow = true;
            group.add(end);
        }
    }

    // Position on tile
    group.position.set(
        tile.x * MAP.TILE_SIZE,
        MAP.TILE_HEIGHT + tile.elevation * 0.3,
        tile.y * MAP.TILE_SIZE
    );

    return group;
}

// A* pathfinding for roads that avoids buildings
function findRoadPath(from, to, tiles) {
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${from.x},${from.y}`;
    const endKey = `${to.x},${to.y}`;

    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(from, to));
    openSet.push({ tile: from, f: fScore.get(startKey) });

    const getNeighbors = (tile) => {
        const neighbors = [];
        const dirs = [[0, -1], [0, 1], [1, 0], [-1, 0]]; // N, S, E, W only (no diagonals for roads)

        for (const [dx, dy] of dirs) {
            const nx = tile.x + dx;
            const ny = tile.y + dy;
            if (ny >= 0 && ny < tiles.length && nx >= 0 && nx < tiles[0].length) {
                const neighbor = tiles[ny][nx];
                // Avoid buildings (unless it's the destination)
                if (!neighbor.hasBuilding || (nx === to.x && ny === to.y)) {
                    neighbors.push(neighbor);
                }
            }
        }
        return neighbors;
    };

    while (openSet.length > 0) {
        // Get node with lowest fScore
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift().tile;
        const currentKey = `${current.x},${current.y}`;

        if (currentKey === endKey) {
            // Reconstruct path
            const path = [];
            let key = currentKey;
            while (cameFrom.has(key)) {
                const tile = tiles[parseInt(key.split(',')[1])][parseInt(key.split(',')[0])];
                path.unshift(tile);
                key = cameFrom.get(key);
            }
            return path;
        }

        closedSet.add(currentKey);

        for (const neighbor of getNeighbors(current)) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            if (closedSet.has(neighborKey)) continue;

            const tentativeG = gScore.get(currentKey) + 1;

            if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, currentKey);
                gScore.set(neighborKey, tentativeG);
                const f = tentativeG + heuristic(neighbor, to);
                fScore.set(neighborKey, f);

                if (!openSet.find(n => `${n.tile.x},${n.tile.y}` === neighborKey)) {
                    openSet.push({ tile: neighbor, f });
                }
            }
        }
    }

    return []; // No path found
}

// Generate roads connecting buildings
export function generateRoads(tiles) {
    // Clear existing roads
    for (const mesh of roadMeshes) {
        scene.remove(mesh);
        mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
    roadMeshes.length = 0;
    buildingTiles.length = 0;

    // Find all building tiles
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            if (tiles[y][x].hasBuilding) {
                buildingTiles.push(tiles[y][x]);
            }
        }
    }

    if (buildingTiles.length < 2) return;

    // Track which tiles have roads and their connections
    const roadTiles = new Map();
    const connectedPairs = new Set();

    // Connect buildings to their nearest neighbors
    for (const building of buildingTiles) {
        // Find closest other buildings (up to 2)
        const others = buildingTiles
            .filter(b => b !== building)
            .map(b => ({
                tile: b,
                dist: Math.abs(b.x - building.x) + Math.abs(b.y - building.y)
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);

        for (const { tile: target } of others) {
            // Avoid duplicate connections
            const pairKey = [
                `${building.x},${building.y}`,
                `${target.x},${target.y}`
            ].sort().join('-');

            if (connectedPairs.has(pairKey)) continue;
            connectedPairs.add(pairKey);

            // Find path using A* that avoids buildings
            const path = findRoadPath(building, target, tiles);

            if (path.length === 0) continue;

            // Mark directions for each road tile
            for (let i = 0; i < path.length; i++) {
                const tile = path[i];
                const key = `${tile.x},${tile.y}`;

                if (!roadTiles.has(key)) {
                    roadTiles.set(key, {
                        tile,
                        directions: { north: false, south: false, east: false, west: false }
                    });
                }

                const roadData = roadTiles.get(key);

                // Connection to previous tile
                if (i > 0) {
                    const prev = path[i - 1];
                    if (prev.y < tile.y) roadData.directions.north = true;
                    if (prev.y > tile.y) roadData.directions.south = true;
                    if (prev.x > tile.x) roadData.directions.east = true;
                    if (prev.x < tile.x) roadData.directions.west = true;
                }

                // Connection to next tile
                if (i < path.length - 1) {
                    const next = path[i + 1];
                    if (next.y < tile.y) roadData.directions.north = true;
                    if (next.y > tile.y) roadData.directions.south = true;
                    if (next.x > tile.x) roadData.directions.east = true;
                    if (next.x < tile.x) roadData.directions.west = true;
                }
            }
        }
    }

    // Create road meshes and set terrain to pavement
    for (const [key, { tile, directions }] of roadTiles) {
        // Don't place road directly on buildings
        if (tile.hasBuilding) continue;

        // Set tile terrain to pavement (updates the tile color)
        if (tile.terrain !== TERRAIN.TOXIC && tile.terrain !== TERRAIN.WATER) {
            tile.setTerrain(TERRAIN.PAVEMENT);
        }

        const roadMesh = createRoadSegment(tile, directions);
        scene.add(roadMesh);
        roadMeshes.push(roadMesh);
        tile.hasRoad = true;
    }
}

// ============================================
// CHUNK-LOCAL VERSIONS FOR INFINITE MAP SYSTEM
// ============================================

// Create urban zones within a single chunk (deterministic based on chunk coords)
export function createUrbanZonesChunk(chunk) {
    const baseX = chunk.cx * CHUNK.SIZE;
    const baseY = chunk.cy * CHUNK.SIZE;

    // Use deterministic seeded random based on chunk coordinates
    const chunkSeed = (chunk.cx * 73856093) ^ (chunk.cy * 19349663);
    const random = seededRandom(chunkSeed);

    const urbanCenters = [];

    // Deterministically place urban centers (up to 4 per chunk)
    for (let i = 0; i < 4; i++) {
        // Generate position deterministically
        const lx = 3 + Math.floor(random() * (CHUNK.SIZE - 6));
        const ly = 3 + Math.floor(random() * (CHUNK.SIZE - 6));
        const tile = chunk.getTileLocal(lx, ly);

        if (tile && tile.terrain !== TERRAIN.WATER && tile.terrain !== TERRAIN.TOXIC) {
            // Only place if random threshold passed (makes urban centers sparse)
            if (random() < 0.3) {
                urbanCenters.push({ lx, ly, size: 2 + Math.floor(random() * 2) });
            }
        }
    }

    // Expand urban zones
    for (const center of urbanCenters) {
        for (let dy = -center.size; dy <= center.size; dy++) {
            for (let dx = -center.size; dx <= center.size; dx++) {
                const nlx = center.lx + dx;
                const nly = center.ly + dy;

                // Stay within chunk bounds
                if (nlx < 0 || nlx >= CHUNK.SIZE || nly < 0 || nly >= CHUNK.SIZE) continue;

                const tile = chunk.getTileLocal(nlx, nly);
                if (tile && tile.terrain !== TERRAIN.WATER && tile.terrain !== TERRAIN.TOXIC) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist <= center.size) {
                        // Center tiles are concrete, outer are pavement
                        if (dist <= 1) {
                            tile.setTerrain(TERRAIN.CONCRETE);
                        } else if (random() < 0.7) {
                            tile.setTerrain(TERRAIN.PAVEMENT);
                        } else {
                            tile.setTerrain(TERRAIN.RUBBLE);
                        }
                    }
                }
            }
        }
    }
}

// Check if multi-tile object can be placed (chunk-local version)
function canPlaceMultiTileObjectChunk(tile, size, chunk) {
    const { width, depth } = size;

    // First check if object fits entirely within chunk
    if (!fitsInChunk(tile.x, tile.y, width, depth)) {
        return false;
    }

    const startX = tile.x - Math.floor((width - 1) / 2);
    const startY = tile.y - Math.floor((depth - 1) / 2);
    const baseX = chunk.cx * CHUNK.SIZE;
    const baseY = chunk.cy * CHUNK.SIZE;

    for (let dy = 0; dy < depth; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const nx = startX + dx;
            const ny = startY + dy;
            const lx = nx - baseX;
            const ly = ny - baseY;
            const key = `${lx},${ly}`;

            // Check if within chunk bounds
            if (lx < 0 || lx >= CHUNK.SIZE || ly < 0 || ly >= CHUNK.SIZE) {
                return false;
            }

            // Check if already occupied
            if (chunk.occupiedByLargeObject.has(key)) {
                return false;
            }

            // Check tile suitability
            const checkTile = chunk.getTileLocal(lx, ly);
            if (!checkTile || checkTile.terrain === TERRAIN.WATER || checkTile.terrain === TERRAIN.TOXIC) {
                return false;
            }
        }
    }
    return true;
}

// Mark tiles as occupied (chunk-local version)
function markTilesOccupiedChunk(tile, size, chunk) {
    const { width, depth } = size;
    const startX = tile.x - Math.floor((width - 1) / 2);
    const startY = tile.y - Math.floor((depth - 1) / 2);
    const baseX = chunk.cx * CHUNK.SIZE;
    const baseY = chunk.cy * CHUNK.SIZE;

    const occupiedTiles = [];

    for (let dy = 0; dy < depth; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const nx = startX + dx;
            const ny = startY + dy;
            const lx = nx - baseX;
            const ly = ny - baseY;
            const key = `${lx},${ly}`;

            chunk.occupiedByLargeObject.add(key);

            const occupiedTile = chunk.getTileLocal(lx, ly);
            if (occupiedTile) {
                occupiedTile.hasBuilding = true;
                occupiedTiles.push(occupiedTile);
            }
        }
    }
    return occupiedTiles;
}

// Add props to a tile (chunk-local version with deterministic randomness)
export function addPropsToTileChunk(tile, chunk) {
    // Don't add props to water
    if (tile.terrain === TERRAIN.WATER) return;

    const baseX = chunk.cx * CHUNK.SIZE;
    const baseY = chunk.cy * CHUNK.SIZE;
    const lx = tile.x - baseX;
    const ly = tile.y - baseY;
    const localKey = `${lx},${ly}`;

    // Skip if already occupied by a large object
    if (chunk.occupiedByLargeObject.has(localKey)) return;

    const terrainName = tile.terrain.name;
    const props = TERRAIN_PROPS[terrainName];

    if (!props || props.length === 0) return;

    // Use deterministic random based on tile world position
    const tileSeed = (tile.x * 73856093) ^ (tile.y * 19349663) ^ 12345;
    const random = seededRandom(tileSeed);

    // Initialize props arrays if needed
    if (!tile.props) tile.props = [];
    if (!tile.propNames) tile.propNames = [];

    for (const propConfig of props) {
        if (random() < propConfig.chance) {
            const { size } = propConfig;
            const isMultiTile = size.width > 1 || size.depth > 1;

            // For multi-tile objects, check if all required tiles are available
            if (isMultiTile) {
                if (!canPlaceMultiTileObjectChunk(tile, size, chunk)) {
                    continue; // Skip this prop, try others
                }
            }

            const prop = propConfig.create();

            // Random scale within range (deterministic)
            const scale = propConfig.scale[0] + random() * (propConfig.scale[1] - propConfig.scale[0]);
            prop.scale.setScalar(scale);

            // Calculate position
            let posX, posZ;

            if (isMultiTile) {
                // Multi-tile objects are centered on the anchor tile
                posX = tile.x * MAP.TILE_SIZE;
                posZ = tile.y * MAP.TILE_SIZE;

                // Mark all tiles as occupied
                const occupiedTiles = markTilesOccupiedChunk(tile, size, chunk);

                // Add prop reference to all occupied tiles
                for (const occTile of occupiedTiles) {
                    if (!occTile.props) occTile.props = [];
                    if (!occTile.propNames) occTile.propNames = [];
                    occTile.props.push(prop);
                    if (!occTile.propNames.includes(propConfig.name)) {
                        occTile.propNames.push(propConfig.name);
                    }
                }
            } else {
                // Single-tile objects have slight random offset (deterministic)
                const offsetX = (random() - 0.5) * 0.3;
                const offsetZ = (random() - 0.5) * 0.3;
                posX = tile.x * MAP.TILE_SIZE + offsetX;
                posZ = tile.y * MAP.TILE_SIZE + offsetZ;

                // Add to this tile only
                tile.props.push(prop);
                if (!tile.propNames.includes(propConfig.name)) {
                    tile.propNames.push(propConfig.name);
                }
            }

            prop.position.set(
                posX,
                MAP.TILE_HEIGHT + tile.elevation * 0.3,
                posZ
            );

            // Random rotation (deterministic)
            prop.rotation.y = random() * Math.PI * 2;

            // Store prop reference for later scene addition when tile is revealed
            if (!tile.pendingProps) tile.pendingProps = [];
            tile.pendingProps.push(prop);

            // Track buildings for road generation within chunk
            if (propConfig.isBuilding) {
                chunk.buildings.push(tile);
                tile.hasBuilding = true;
            }

            // For buildings, only place one per anchor tile
            if (propConfig.isBuilding) {
                break;
            }
        }
    }

    // Legacy support: set propName from propNames array
    if (tile.propNames && tile.propNames.length > 0) {
        tile.propName = tile.propNames.join(', ');
    }
}

// Generate roads within a single chunk (only connects buildings in same chunk)
export function generateRoadsChunk(chunk) {
    if (chunk.buildings.length < 2) return;

    // Track which tiles have roads and their connections
    const roadTiles = new Map();
    const connectedPairs = new Set();

    // Connect buildings to their nearest neighbors within this chunk
    for (const building of chunk.buildings) {
        // Find closest other buildings (up to 2)
        const others = chunk.buildings
            .filter(b => b !== building)
            .map(b => ({
                tile: b,
                dist: Math.abs(b.x - building.x) + Math.abs(b.y - building.y)
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);

        for (const { tile: target } of others) {
            // Avoid duplicate connections
            const pairKey = [
                `${building.x},${building.y}`,
                `${target.x},${target.y}`
            ].sort().join('-');

            if (connectedPairs.has(pairKey)) continue;
            connectedPairs.add(pairKey);

            // Find path using A* that avoids buildings (chunk-local)
            const path = findRoadPathChunk(building, target, chunk);

            if (path.length === 0) continue;

            // Mark directions for each road tile
            for (let i = 0; i < path.length; i++) {
                const tile = path[i];
                const key = `${tile.x},${tile.y}`;

                if (!roadTiles.has(key)) {
                    roadTiles.set(key, {
                        tile,
                        directions: { north: false, south: false, east: false, west: false }
                    });
                }

                const roadData = roadTiles.get(key);

                // Connection to previous tile
                if (i > 0) {
                    const prev = path[i - 1];
                    if (prev.y < tile.y) roadData.directions.north = true;
                    if (prev.y > tile.y) roadData.directions.south = true;
                    if (prev.x > tile.x) roadData.directions.east = true;
                    if (prev.x < tile.x) roadData.directions.west = true;
                }

                // Connection to next tile
                if (i < path.length - 1) {
                    const next = path[i + 1];
                    if (next.y < tile.y) roadData.directions.north = true;
                    if (next.y > tile.y) roadData.directions.south = true;
                    if (next.x > tile.x) roadData.directions.east = true;
                    if (next.x < tile.x) roadData.directions.west = true;
                }
            }
        }
    }

    // Create road data (meshes added when tile is revealed)
    for (const [key, { tile, directions }] of roadTiles) {
        // Don't place road directly on buildings
        if (tile.hasBuilding) continue;

        // Set tile terrain to pavement
        if (tile.terrain !== TERRAIN.TOXIC && tile.terrain !== TERRAIN.WATER) {
            tile.setTerrain(TERRAIN.PAVEMENT);
        }

        tile.hasRoad = true;
        tile.roadDirections = directions;
    }
}

// A* pathfinding for roads within a chunk
function findRoadPathChunk(from, to, chunk) {
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${from.x},${from.y}`;
    const endKey = `${to.x},${to.y}`;

    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(from, to));
    openSet.push({ tile: from, f: fScore.get(startKey) });

    const baseX = chunk.cx * CHUNK.SIZE;
    const baseY = chunk.cy * CHUNK.SIZE;

    const getNeighbors = (tile) => {
        const neighbors = [];
        const dirs = [[0, -1], [0, 1], [1, 0], [-1, 0]]; // N, S, E, W only

        for (const [dx, dy] of dirs) {
            const nx = tile.x + dx;
            const ny = tile.y + dy;
            const lx = nx - baseX;
            const ly = ny - baseY;

            // Stay within chunk
            if (lx < 0 || lx >= CHUNK.SIZE || ly < 0 || ly >= CHUNK.SIZE) continue;

            const neighbor = chunk.getTileLocal(lx, ly);
            // Avoid buildings (unless it's the destination)
            if (neighbor && (!neighbor.hasBuilding || (nx === to.x && ny === to.y))) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    };

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift().tile;
        const currentKey = `${current.x},${current.y}`;

        if (currentKey === endKey) {
            // Reconstruct path
            const path = [];
            let key = currentKey;
            while (cameFrom.has(key)) {
                const [x, y] = key.split(',').map(Number);
                const lx = x - baseX;
                const ly = y - baseY;
                const tile = chunk.getTileLocal(lx, ly);
                path.unshift(tile);
                key = cameFrom.get(key);
            }
            return path;
        }

        closedSet.add(currentKey);

        for (const neighbor of getNeighbors(current)) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            if (closedSet.has(neighborKey)) continue;

            const tentativeG = gScore.get(currentKey) + 1;

            if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, currentKey);
                gScore.set(neighborKey, tentativeG);
                const f = tentativeG + heuristic(neighbor, to);
                fScore.set(neighborKey, f);

                if (!openSet.find(n => `${n.tile.x},${n.tile.y}` === neighborKey)) {
                    openSet.push({ tile: neighbor, f });
                }
            }
        }
    }

    return []; // No path found
}

// Add pending props to scene when tile is revealed
export function addPendingPropsToScene(tile) {
    if (tile.pendingProps) {
        for (const prop of tile.pendingProps) {
            if (!prop.parent) {
                scene.add(prop);
            }
        }
    }

    // Add road mesh if tile has road
    if (tile.hasRoad && tile.roadDirections && !tile.roadMesh) {
        tile.roadMesh = createRoadSegment(tile, tile.roadDirections);
        scene.add(tile.roadMesh);
    }
}
