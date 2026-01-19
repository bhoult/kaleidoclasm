// Interior rendering using Three.js
import * as THREE from 'three';
import { INTERIOR_TERRAIN, FURNITURE_TYPES } from '../world/interior.js';
import { COLORS } from '../config.js';

// Interior scale (smaller tiles for detailed interior view)
export const INTERIOR_SCALE = 0.5;
const WALL_HEIGHT = 0.15;  // Short walls for top-down view
const FURNITURE_HEIGHT = 0.2;
const FLOOR_HEIGHT = 0.05;

// Materials cache
const materials = {};

function getMaterial(color, options = {}) {
    const key = `${color}_${JSON.stringify(options)}`;
    if (!materials[key]) {
        materials[key] = new THREE.MeshStandardMaterial({
            color,
            roughness: options.roughness || 0.8,
            metalness: options.metalness || 0.1,
            transparent: options.transparent || false,
            opacity: options.opacity || 1.0
        });
    }
    return materials[key];
}

// Render the entire interior to a scene
export function renderInterior(interior, scene) {
    // Clear any existing scene objects
    interior.dispose();

    // Calculate offset to center the interior
    const offsetX = -interior.width * INTERIOR_SCALE / 2;
    const offsetZ = -interior.height * INTERIOR_SCALE / 2;

    // Render floor and walls
    for (let y = 0; y < interior.height; y++) {
        for (let x = 0; x < interior.width; x++) {
            const tile = interior.getTile(x, y);
            if (!tile) continue;

            const worldX = x * INTERIOR_SCALE + offsetX;
            const worldZ = y * INTERIOR_SCALE + offsetZ;

            // Create tile mesh based on terrain type
            const tileMesh = createTileMesh(tile, worldX, worldZ);
            if (tileMesh) {
                scene.add(tileMesh);
                interior.sceneObjects.push(tileMesh);
                tile.mesh = tileMesh;

                // Add to tileMeshes for raycasting (only passable tiles)
                if (tile.isPassable) {
                    interior.tileMeshes.push(tileMesh);
                }
            }

            // Create wall or door mesh
            if (tile.terrain === INTERIOR_TERRAIN.WALL) {
                const wallMesh = createWallMesh(tile, worldX, worldZ);
                if (wallMesh) {
                    scene.add(wallMesh);
                    interior.sceneObjects.push(wallMesh);
                }
            } else if (tile.isDoor()) {
                const doorMesh = createDoorMesh(tile, worldX, worldZ);
                if (doorMesh) {
                    scene.add(doorMesh);
                    interior.sceneObjects.push(doorMesh);
                    // Doors are clickable
                    doorMesh.userData.tile = tile;
                    interior.tileMeshes.push(doorMesh);
                }
            } else if (tile.terrain === INTERIOR_TERRAIN.WINDOW) {
                const windowMesh = createWindowMesh(tile, worldX, worldZ);
                if (windowMesh) {
                    scene.add(windowMesh);
                    interior.sceneObjects.push(windowMesh);
                    // Windows are clickable for exiting
                    windowMesh.userData.tile = tile;
                    interior.tileMeshes.push(windowMesh);
                }
            } else if (tile.terrain === INTERIOR_TERRAIN.EXIT) {
                const exitMesh = createExitMesh(tile, worldX, worldZ);
                if (exitMesh) {
                    scene.add(exitMesh);
                    interior.sceneObjects.push(exitMesh);
                    // Exit tiles are clickable
                    exitMesh.userData.tile = tile;
                    interior.tileMeshes.push(exitMesh);
                }
            }

            // Create furniture mesh
            if (tile.furniture) {
                const furnMesh = createFurnitureMesh(tile, worldX, worldZ);
                if (furnMesh) {
                    scene.add(furnMesh);
                    interior.sceneObjects.push(furnMesh);
                    tile.furnitureMesh = furnMesh;
                    // Furniture is clickable for searching
                    furnMesh.userData.tile = tile;
                    furnMesh.userData.isFurniture = true;
                    interior.tileMeshes.push(furnMesh);
                }
            }
        }
    }

    // Add ambient floor plane (for shadows/aesthetics)
    addFloorPlane(interior, scene, offsetX, offsetZ);

    // Add interior-specific lighting
    addInteriorLighting(interior, scene);
}

// Create floor tile mesh
function createTileMesh(tile, worldX, worldZ) {
    const geometry = new THREE.BoxGeometry(
        INTERIOR_SCALE * 0.98,
        FLOOR_HEIGHT,
        INTERIOR_SCALE * 0.98
    );

    const material = getMaterial(tile.terrain.color);
    const mesh = new THREE.Mesh(geometry, material.clone());  // Clone for individual highlighting

    mesh.position.set(worldX, FLOOR_HEIGHT / 2, worldZ);
    mesh.receiveShadow = true;
    mesh.userData.tile = tile;

    // Store base material for highlighting
    tile.baseMaterial = mesh.material;

    return mesh;
}

// Create wall mesh
function createWallMesh(tile, worldX, worldZ) {
    const geometry = new THREE.BoxGeometry(
        INTERIOR_SCALE * 0.98,
        WALL_HEIGHT,
        INTERIOR_SCALE * 0.98
    );

    const material = getMaterial(INTERIOR_TERRAIN.WALL.color, { roughness: 0.9 });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(worldX, WALL_HEIGHT / 2 + FLOOR_HEIGHT, worldZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}

// Create door mesh - simple colored tile for top-down view
function createDoorMesh(tile, worldX, worldZ) {
    // For top-down view, render doors as colored floor tiles
    const geometry = new THREE.BoxGeometry(
        INTERIOR_SCALE * 0.98,
        FLOOR_HEIGHT * 1.5,
        INTERIOR_SCALE * 0.98
    );

    let color;
    if (tile.terrain === INTERIOR_TERRAIN.DOOR_LOCKED) {
        color = 0x8b4513;  // Dark brown for locked
    } else if (tile.terrain === INTERIOR_TERRAIN.DOOR_OPEN) {
        color = 0x7a6a5a;  // Lighter for open
    } else {
        color = 0x5a4a3a;  // Medium for closed
    }

    const material = getMaterial(color);
    const mesh = new THREE.Mesh(geometry, material.clone());

    mesh.position.set(worldX, FLOOR_HEIGHT * 0.75, worldZ);
    mesh.receiveShadow = true;
    mesh.userData.tile = tile;

    // Store material for highlighting
    tile.baseMaterial = mesh.material;

    return mesh;
}

// Create window mesh - clickable tile with glass indicator
function createWindowMesh(tile, worldX, worldZ) {
    // Use a single mesh for easier raycasting
    const geometry = new THREE.BoxGeometry(
        INTERIOR_SCALE * 0.98,
        WALL_HEIGHT,
        INTERIOR_SCALE * 0.98
    );

    // Blue-tinted material to indicate window
    const material = getMaterial(0x6688aa, { roughness: 0.7 });
    const mesh = new THREE.Mesh(geometry, material.clone());

    mesh.position.set(worldX, WALL_HEIGHT / 2 + FLOOR_HEIGHT, worldZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.tile = tile;

    // Store material for highlighting
    tile.baseMaterial = mesh.material;

    return mesh;
}

// Create exit door mesh (highlighted differently)
function createExitMesh(tile, worldX, worldZ) {
    const geometry = new THREE.BoxGeometry(
        INTERIOR_SCALE * 0.98,
        FLOOR_HEIGHT * 2,
        INTERIOR_SCALE * 0.98
    );

    // Exit is green-tinted
    const material = getMaterial(0x4a6a4a);
    const mesh = new THREE.Mesh(geometry, material.clone());

    mesh.position.set(worldX, FLOOR_HEIGHT, worldZ);
    mesh.receiveShadow = true;
    mesh.userData.tile = tile;

    tile.baseMaterial = mesh.material;

    // Add glow effect
    const glowGeom = new THREE.BoxGeometry(
        INTERIOR_SCALE * 0.99,
        FLOOR_HEIGHT * 0.5,
        INTERIOR_SCALE * 0.99
    );
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x44ff44,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.set(worldX, FLOOR_HEIGHT * 2, worldZ);

    const group = new THREE.Group();
    group.add(mesh);
    group.add(glow);
    group.userData.tile = tile;

    return group;
}

// Create furniture mesh
function createFurnitureMesh(tile, worldX, worldZ) {
    const furniture = tile.furniture;
    if (!furniture) return null;

    // Different sizes based on furniture type
    let width = INTERIOR_SCALE * 0.7;
    let height = FURNITURE_HEIGHT;
    let depth = INTERIOR_SCALE * 0.7;

    // Adjust size based on furniture type
    switch (furniture.name) {
        case 'Bed':
            width = INTERIOR_SCALE * 0.9;
            depth = INTERIOR_SCALE * 0.6;
            height = FURNITURE_HEIGHT * 0.8;
            break;
        case 'Desk':
        case 'Table':
        case 'Counter':
        case 'Workbench':
            width = INTERIOR_SCALE * 0.8;
            depth = INTERIOR_SCALE * 0.5;
            height = FURNITURE_HEIGHT * 1.2;
            break;
        case 'Chair':
            width = INTERIOR_SCALE * 0.4;
            depth = INTERIOR_SCALE * 0.4;
            height = FURNITURE_HEIGHT * 1.5;
            break;
        case 'Refrigerator':
        case 'Locker':
            width = INTERIOR_SCALE * 0.6;
            depth = INTERIOR_SCALE * 0.5;
            height = FURNITURE_HEIGHT * 2.5;
            break;
        case 'Safe':
            width = INTERIOR_SCALE * 0.4;
            depth = INTERIOR_SCALE * 0.4;
            height = FURNITURE_HEIGHT * 1.0;
            break;
        case 'Toilet':
            width = INTERIOR_SCALE * 0.4;
            depth = INTERIOR_SCALE * 0.5;
            height = FURNITURE_HEIGHT * 1.2;
            break;
        case 'Sink':
        case 'Bathtub':
            width = INTERIOR_SCALE * 0.6;
            depth = INTERIOR_SCALE * 0.4;
            height = FURNITURE_HEIGHT * 0.6;
            break;
    }

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = getMaterial(furniture.color);
    const mesh = new THREE.Mesh(geometry, material.clone());

    mesh.position.set(worldX, height / 2 + FLOOR_HEIGHT, worldZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.tile = tile;
    mesh.userData.isFurniture = true;

    tile.baseMaterial = mesh.material;

    // Add lock indicator for locked furniture
    if (furniture.locked) {
        const lockGeom = new THREE.BoxGeometry(
            INTERIOR_SCALE * 0.1,
            INTERIOR_SCALE * 0.1,
            INTERIOR_SCALE * 0.05
        );
        const lockMat = getMaterial(0xffcc00);
        const lock = new THREE.Mesh(lockGeom, lockMat);
        lock.position.set(width * 0.3, height * 0.3, depth / 2 + 0.02);
        mesh.add(lock);
    }

    // Add searched indicator
    if (tile.searched) {
        mesh.material.opacity = 0.6;
        mesh.material.transparent = true;
    }

    return mesh;
}

// Add floor plane for shadows
function addFloorPlane(interior, scene, offsetX, offsetZ) {
    const planeGeometry = new THREE.PlaneGeometry(
        interior.width * INTERIOR_SCALE + 1,
        interior.height * INTERIOR_SCALE + 1
    );
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.9,
        metalness: 0.0
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0, 0, 0);
    plane.receiveShadow = true;

    scene.add(plane);
    interior.sceneObjects.push(plane);
}

// Add interior-specific lighting
function addInteriorLighting(interior, scene) {
    // Dimmer ambient light for indoor atmosphere
    const ambientLight = new THREE.AmbientLight(0x404050, 0.4);
    scene.add(ambientLight);
    interior.sceneObjects.push(ambientLight);

    // Point lights to simulate indoor lighting
    const centerX = 0;
    const centerZ = 0;

    const mainLight = new THREE.PointLight(0xffffcc, 0.8, 10);
    mainLight.position.set(centerX, 2, centerZ);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 512;
    mainLight.shadow.mapSize.height = 512;
    scene.add(mainLight);
    interior.sceneObjects.push(mainLight);

    // Secondary fill light
    const fillLight = new THREE.PointLight(0xccccff, 0.3, 8);
    fillLight.position.set(centerX + 2, 1.5, centerZ - 2);
    scene.add(fillLight);
    interior.sceneObjects.push(fillLight);

    // Hemisphere light for subtle ambient variation
    const hemiLight = new THREE.HemisphereLight(0x606080, 0x404040, 0.3);
    scene.add(hemiLight);
    interior.sceneObjects.push(hemiLight);
}

// Update tile highlight
export function setTileHighlight(tile, color) {
    if (tile.baseMaterial) {
        tile.baseMaterial.emissive.setHex(color);
        tile.baseMaterial.emissiveIntensity = 0.3;
    }
}

// Clear tile highlight
export function clearTileHighlight(tile) {
    if (tile.baseMaterial) {
        tile.baseMaterial.emissive.setHex(0x000000);
        tile.baseMaterial.emissiveIntensity = 0;
    }
}

// Highlight multiple tiles
export function highlightInteriorTiles(tiles, color) {
    for (const tile of tiles) {
        setTileHighlight(tile, color);
    }
}

// Clear all interior highlights
export function clearInteriorHighlights(interior) {
    for (const tile of interior.tiles) {
        clearTileHighlight(tile);
    }
}

// Update furniture appearance after searching
export function updateFurnitureAppearance(tile) {
    if (tile.furnitureMesh && tile.searched) {
        tile.furnitureMesh.material.opacity = 0.6;
        tile.furnitureMesh.material.transparent = true;
    }
}

// Update door appearance after state change
export function updateDoorAppearance(tile, interior, scene) {
    // Remove old door mesh
    if (tile.mesh) {
        scene.remove(tile.mesh);
        if (tile.mesh.geometry) tile.mesh.geometry.dispose();
        if (tile.mesh.material) tile.mesh.material.dispose();
    }

    // Calculate position
    const offsetX = -interior.width * INTERIOR_SCALE / 2;
    const offsetZ = -interior.height * INTERIOR_SCALE / 2;
    const worldX = tile.x * INTERIOR_SCALE + offsetX;
    const worldZ = tile.y * INTERIOR_SCALE + offsetZ;

    // Create new door mesh
    const newMesh = createDoorMesh(tile, worldX, worldZ);
    if (newMesh) {
        scene.add(newMesh);
        interior.sceneObjects.push(newMesh);
        tile.mesh = newMesh;
    }
}
