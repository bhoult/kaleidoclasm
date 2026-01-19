// Procedural props and objects for map tiles
import * as THREE from 'three';
import { scene } from '../core/renderer.js';
import { MAP, TERRAIN } from '../config.js';

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

// Create a ruined house
function createHouse() {
    const group = new THREE.Group();

    // Base/walls
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x8b8878,
        roughness: 0.9
    });

    // Main structure (damaged box)
    const baseGeo = new THREE.BoxGeometry(0.5, 0.35, 0.4);
    const base = new THREE.Mesh(baseGeo, wallMat);
    base.position.y = 0.175;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Damaged roof (tilted)
    const roofGeo = new THREE.BoxGeometry(0.55, 0.08, 0.45);
    const roofMat = new THREE.MeshStandardMaterial({
        color: 0x5c4033,
        roughness: 0.8
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 0.4;
    roof.rotation.z = 0.15; // Tilted/damaged
    roof.castShadow = true;
    group.add(roof);

    // Door hole
    const doorGeo = new THREE.BoxGeometry(0.12, 0.2, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.1, 0.2);
    group.add(door);

    return group;
}

// Create a gas station
function createGasStation() {
    const group = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.5,
        metalness: 0.3
    });

    // Canopy supports
    for (let x = -1; x <= 1; x += 2) {
        const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.set(x * 0.2, 0.25, 0);
        pole.castShadow = true;
        group.add(pole);
    }

    // Canopy
    const canopyGeo = new THREE.BoxGeometry(0.6, 0.05, 0.4);
    const canopyMat = new THREE.MeshStandardMaterial({
        color: 0xcc3333,
        roughness: 0.7
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 0.52;
    canopy.castShadow = true;
    group.add(canopy);

    // Gas pump
    const pumpGeo = new THREE.BoxGeometry(0.1, 0.25, 0.08);
    const pumpMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.6
    });
    const pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.set(0, 0.125, 0);
    pump.castShadow = true;
    group.add(pump);

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
const TERRAIN_PROPS = {
    'Grass': [
        { name: 'Dead Tree', create: createTree, chance: 0.2, scale: [0.7, 1.2], isBuilding: false },
        { name: 'Dead Bush', create: createBush, chance: 0.15, scale: [0.8, 1.2], isBuilding: false },
        { name: 'Rock', create: createRock, chance: 0.05, scale: [0.5, 0.8], isBuilding: false }
    ],
    'Dirt': [
        { name: 'Rock', create: createRock, chance: 0.12, scale: [0.6, 1.0], isBuilding: false },
        { name: 'Dead Bush', create: createBush, chance: 0.08, scale: [0.7, 1.0], isBuilding: false },
        { name: 'Debris', create: createDebris, chance: 0.05, scale: [0.8, 1.2], isBuilding: false }
    ],
    'Mud': [
        { name: 'Rock', create: createRock, chance: 0.08, scale: [0.4, 0.7], isBuilding: false }
    ],
    'Sand': [
        { name: 'Rock', create: createRock, chance: 0.1, scale: [0.5, 0.9], isBuilding: false },
        { name: 'Dead Bush', create: createBush, chance: 0.05, scale: [0.5, 0.8], isBuilding: false }
    ],
    'Pavement': [
        { name: 'Car Wreck', create: createCarWreck, chance: 0.06, scale: [0.8, 1.0], isBuilding: false },
        { name: 'Debris', create: createDebris, chance: 0.08, scale: [0.8, 1.2], isBuilding: false }
    ],
    'Concrete': [
        { name: 'Ruined House', create: createHouse, chance: 0.15, scale: [0.9, 1.1], isBuilding: true },
        { name: 'Gas Station', create: createGasStation, chance: 0.04, scale: [0.9, 1.0], isBuilding: true },
        { name: 'Debris', create: createDebris, chance: 0.1, scale: [1.0, 1.5], isBuilding: false }
    ],
    'Toxic': [
        { name: 'Toxic Barrel', create: createToxicBarrel, chance: 0.25, scale: [0.8, 1.2], isBuilding: false },
        { name: 'Debris', create: createDebris, chance: 0.1, scale: [0.8, 1.0], isBuilding: false },
        { name: 'Rock', create: createRock, chance: 0.08, scale: [0.5, 0.8], isBuilding: false }
    ],
    'Rubble': [
        { name: 'Debris', create: createDebris, chance: 0.3, scale: [1.0, 1.5], isBuilding: false },
        { name: 'Rock', create: createRock, chance: 0.15, scale: [0.6, 1.0], isBuilding: false }
    ],
    'Water': []
};

// Track building locations for road generation
const buildingTiles = [];

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

export function addPropsToTile(tile) {
    // Don't add props to water
    if (tile.terrain === TERRAIN.WATER) return;

    const terrainName = tile.terrain.name;
    const props = TERRAIN_PROPS[terrainName];

    if (!props || props.length === 0) return;

    for (const propConfig of props) {
        if (Math.random() < propConfig.chance) {
            const prop = propConfig.create();

            // Random scale within range
            const scale = propConfig.scale[0] + Math.random() * (propConfig.scale[1] - propConfig.scale[0]);
            prop.scale.setScalar(scale);

            // Position on tile with slight offset
            const offsetX = (Math.random() - 0.5) * 0.3;
            const offsetZ = (Math.random() - 0.5) * 0.3;
            prop.position.set(
                tile.x * MAP.TILE_SIZE + offsetX,
                MAP.TILE_HEIGHT + tile.elevation * 0.3,
                tile.y * MAP.TILE_SIZE + offsetZ
            );

            // Random rotation
            prop.rotation.y = Math.random() * Math.PI * 2;

            scene.add(prop);

            // Store reference for cleanup
            if (!tile.props) tile.props = [];
            tile.props.push(prop);

            // Store prop name for tooltip display
            tile.propName = propConfig.name;

            // Track buildings for road generation
            if (propConfig.isBuilding) {
                buildingTiles.push(tile);
                tile.hasBuilding = true;
            }

            // Only one prop per tile
            break;
        }
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
