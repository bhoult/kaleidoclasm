// Interior Manager - handles transitioning between outdoor and indoor scenes
import * as THREE from 'three';
import { GameState } from '../state.js';
import { BuildingInterior } from '../world/interior.js';
import { generateInterior } from '../world/interiorGenerator.js';
import { renderInterior, INTERIOR_SCALE, clearInteriorHighlights } from './interiorRenderer.js';
import { switchToIndoorScene, switchToOutdoorScene, indoorScene } from '../core/renderer.js';
import { showMessage, updateHUD } from '../ui/hud.js';
import { getTile } from '../world/map.js';

// Enter a building interior
export function enterBuilding(unit, buildingTile) {
    if (!unit || !buildingTile) {
        console.error('Invalid unit or building tile');
        return false;
    }

    // Check if unit has enough AP
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP to enter building!', 1500);
        return false;
    }

    // Get building type from tile
    const buildingType = getBuildingType(buildingTile);

    // Check interior cache first
    const cacheKey = `${buildingTile.x},${buildingTile.y}`;
    let interior = GameState.interiorCache.get(cacheKey);

    if (!interior) {
        // Generate new interior
        interior = new BuildingInterior(
            buildingTile.x,
            buildingTile.y,
            buildingType,
            GameState.seed
        );
        generateInterior(interior);

        // Cache the interior
        GameState.interiorCache.set(cacheKey, interior);
    }

    // Deduct AP
    unit.actionPoints -= 1;

    // Store outdoor position for return
    const outdoorX = unit.x;
    const outdoorY = unit.y;

    // Remove unit from outdoor tile
    const outdoorTile = getTile(unit.x, unit.y);
    if (outdoorTile) {
        outdoorTile.removeContent(unit);
    }

    // Hide unit mesh in outdoor scene (don't dispose, we'll need it later)
    if (unit.mesh) {
        unit.mesh.visible = false;
    }

    // Switch to indoor scene
    switchToIndoorScene(interior);

    // Render interior
    renderInterior(interior, indoorScene);

    // Place unit at entry position
    const entryTile = interior.getEntryTile();
    if (entryTile) {
        unit.x = entryTile.x;
        unit.y = entryTile.y;
        entryTile.addContent(unit);

        // Create indoor unit mesh
        createIndoorUnitMesh(unit, interior);
    }

    // Update state
    GameState.viewMode = 'indoor';
    GameState.currentInterior = interior;
    GameState.currentBuilding = { tile: buildingTile, outdoorX, outdoorY };

    // Track which units are indoors
    GameState.unitsIndoors.set(unit.id || unit.name, interior);

    // Update UI
    updateHUD();
    showMessage(`Entered ${buildingType}`, 1500);

    return true;
}

// Exit from a building interior
export function exitBuilding(unit, exitTile) {
    if (!unit || !exitTile) {
        console.error('Invalid unit or exit tile');
        return false;
    }

    const interior = GameState.currentInterior;
    const buildingInfo = GameState.currentBuilding;

    if (!interior || !buildingInfo) {
        console.error('No current interior to exit from');
        return false;
    }

    // Check if unit has enough AP
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP to exit building!', 1500);
        return false;
    }

    // Deduct AP
    unit.actionPoints -= 1;

    // Remove unit from indoor tile
    const indoorTile = interior.getTile(unit.x, unit.y);
    if (indoorTile) {
        indoorTile.removeContent(unit);
    }

    // Remove indoor unit mesh
    if (unit.indoorMesh) {
        indoorScene.remove(unit.indoorMesh);
        if (unit.indoorMesh.geometry) unit.indoorMesh.geometry.dispose();
        if (unit.indoorMesh.material) unit.indoorMesh.material.dispose();
        unit.indoorMesh = null;
    }

    // Find adjacent outdoor tile to place unit
    const outdoorPosition = findAdjacentOutdoorTile(buildingInfo.tile);
    unit.x = outdoorPosition.x;
    unit.y = outdoorPosition.y;

    // Add unit to outdoor tile
    const outdoorTile = getTile(unit.x, unit.y);
    if (outdoorTile) {
        outdoorTile.addContent(unit);
    }

    // Show unit mesh in outdoor scene
    if (unit.mesh) {
        unit.mesh.visible = true;
        unit.updateMeshPosition();
    }

    // Switch back to outdoor scene
    switchToOutdoorScene();

    // Update state
    GameState.viewMode = 'outdoor';
    GameState.currentInterior = null;
    GameState.currentBuilding = null;
    GameState.unitsIndoors.delete(unit.id || unit.name);

    // Update UI
    updateHUD();
    showMessage('Exited building', 1500);

    return true;
}

// Get building type from tile props
function getBuildingType(tile) {
    if (!tile) return 'default';

    // Check propNames for building type
    if (tile.propNames && tile.propNames.length > 0) {
        for (const propName of tile.propNames) {
            if (propName.includes('House')) return 'Ruined House';
            if (propName.includes('Gas Station')) return 'Gas Station';
            if (propName.includes('Shop')) return 'Abandoned Shop';
            if (propName.includes('Office')) return 'Office Building';
            if (propName.includes('Warehouse')) return 'Warehouse';
        }
    }

    // Check single propName
    if (tile.propName) {
        if (tile.propName.includes('House')) return 'Ruined House';
        if (tile.propName.includes('Gas Station')) return 'Gas Station';
        if (tile.propName.includes('Shop')) return 'Abandoned Shop';
        if (tile.propName.includes('Office')) return 'Office Building';
        if (tile.propName.includes('Warehouse')) return 'Warehouse';
    }

    // Default building type
    return 'Ruined House';
}

// Create indoor mesh for unit
function createIndoorUnitMesh(unit, interior) {
    const geometry = new THREE.CylinderGeometry(
        INTERIOR_SCALE * 0.3,
        INTERIOR_SCALE * 0.35,
        INTERIOR_SCALE * 0.8,
        8
    );
    const material = new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        roughness: 0.6,
        metalness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Calculate position
    const offsetX = -interior.width * INTERIOR_SCALE / 2;
    const offsetZ = -interior.height * INTERIOR_SCALE / 2;
    const worldX = unit.x * INTERIOR_SCALE + offsetX;
    const worldZ = unit.y * INTERIOR_SCALE + offsetZ;

    mesh.position.set(worldX, INTERIOR_SCALE * 0.4, worldZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.unit = unit;
    mesh.userData.isUnit = true;

    indoorScene.add(mesh);
    unit.indoorMesh = mesh;

    // Add to interior scene objects for cleanup
    interior.sceneObjects.push(mesh);
}

// Update indoor unit mesh position
export function updateIndoorUnitPosition(unit, interior) {
    if (!unit.indoorMesh || !interior) return;

    const offsetX = -interior.width * INTERIOR_SCALE / 2;
    const offsetZ = -interior.height * INTERIOR_SCALE / 2;
    const worldX = unit.x * INTERIOR_SCALE + offsetX;
    const worldZ = unit.y * INTERIOR_SCALE + offsetZ;

    unit.indoorMesh.position.set(worldX, INTERIOR_SCALE * 0.4, worldZ);
}

// Find passable tile adjacent to building for exit
function findAdjacentOutdoorTile(buildingTile) {
    const directions = [
        { dx: 0, dy: 1 },   // South
        { dx: 0, dy: -1 },  // North
        { dx: 1, dy: 0 },   // East
        { dx: -1, dy: 0 },  // West
        { dx: 1, dy: 1 },   // SE
        { dx: -1, dy: 1 },  // SW
        { dx: 1, dy: -1 },  // NE
        { dx: -1, dy: -1 }  // NW
    ];

    for (const dir of directions) {
        const x = buildingTile.x + dir.dx;
        const y = buildingTile.y + dir.dy;
        const tile = getTile(x, y);

        if (tile && tile.isPassable && !tile.hasBuilding) {
            // Check if no unit/enemy is there
            if (!tile.getUnit() && !tile.getEnemy()) {
                return { x, y };
            }
        }
    }

    // Fallback to building tile position (shouldn't happen normally)
    return { x: buildingTile.x, y: buildingTile.y };
}

// Check if a unit is indoors
export function isUnitIndoors(unit) {
    return GameState.unitsIndoors.has(unit.id || unit.name);
}

// Get the interior a unit is in
export function getUnitInterior(unit) {
    return GameState.unitsIndoors.get(unit.id || unit.name);
}

// Move unit within interior
export function moveUnitIndoor(unit, targetTile) {
    const interior = GameState.currentInterior;
    if (!interior) return false;

    // Check if target is passable
    if (!targetTile.isPassable) {
        return false;
    }

    // Check if target has another unit
    if (targetTile.getUnit()) {
        return false;
    }

    // Remove from current tile
    const currentTile = interior.getTile(unit.x, unit.y);
    if (currentTile) {
        currentTile.removeContent(unit);
    }

    // Move to new tile
    unit.x = targetTile.x;
    unit.y = targetTile.y;
    targetTile.addContent(unit);

    // Update mesh position
    updateIndoorUnitPosition(unit, interior);

    return true;
}

// Get movement range for indoor movement
export function getIndoorMovementRange(unit, interior) {
    if (!unit || !interior) return [];

    const movableTiles = [];
    const maxRange = Math.floor(unit.actionPoints / 1);  // 1 AP per tile

    if (maxRange <= 0) return [];

    // BFS to find reachable tiles
    const visited = new Set();
    const queue = [{ x: unit.x, y: unit.y, cost: 0 }];
    visited.add(`${unit.x},${unit.y}`);

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.cost > 0) {
            const tile = interior.getTile(current.x, current.y);
            if (tile && tile.isPassable && !tile.getUnit()) {
                movableTiles.push(tile);
            }
        }

        if (current.cost >= maxRange) continue;

        // Check adjacent tiles
        const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];

        for (const dir of directions) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            const key = `${nx},${ny}`;

            if (visited.has(key)) continue;
            visited.add(key);

            const tile = interior.getTile(nx, ny);
            if (tile && tile.isPassable) {
                // Handle doors
                if (tile.isDoor() && tile.terrain.name === 'Locked Door') {
                    continue;  // Can't pass through locked doors
                }

                const moveCost = tile.movementCost || 1;
                queue.push({ x: nx, y: ny, cost: current.cost + moveCost });
            }
        }
    }

    return movableTiles;
}
