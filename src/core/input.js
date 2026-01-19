// Input handling - mouse, raycasting, selection
import * as THREE from 'three';
import { camera, renderer } from './renderer.js';
import { GameState } from '../state.js';
import { getTile, clearMapHighlights, highlightTiles } from '../world/map.js';
import { COLORS } from '../config.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let onTileClick = null;
let onTileHover = null;

export function initInput(clickHandler, hoverHandler) {
    onTileClick = clickHandler;
    onTileHover = hoverHandler;

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('contextmenu', onRightClick);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const tileMeshes = [];
    for (const row of GameState.map.tiles) {
        for (const tile of row) {
            if (tile.mesh) tileMeshes.push(tile.mesh);
        }
    }

    const intersects = raycaster.intersectObjects(tileMeshes);

    // Clear previous hover
    if (GameState.hoveredTile) {
        if (GameState.hoveredTile !== GameState.selectedUnit?.currentTile) {
            // Don't clear if it's part of movement highlights
            const isHighlighted = GameState.moveHighlights.length > 0;
            if (!isHighlighted) {
                GameState.hoveredTile.clearHighlight();
            }
        }
    }

    const tooltip = document.getElementById('tooltip');

    if (intersects.length > 0) {
        const tile = intersects[0].object.userData.tile;
        if (tile) {
            GameState.hoveredTile = tile;
            if (onTileHover) onTileHover(tile);

            // Update tooltip
            if (tooltip) {
                let tooltipContent = `<strong>${tile.terrain.name}</strong>`;

                // Show object on tile if present
                if (tile.propName) {
                    tooltipContent += `<br>Object: ${tile.propName}`;
                }

                // Show if tile has road
                if (tile.hasRoad) {
                    tooltipContent += `<br>Road`;
                }

                // Show radiation level
                if (tile.radiationLevel > 0) {
                    tooltipContent += `<br>Radiation: ${Math.round(tile.radiationLevel * 100)}%`;
                }

                // Show movement cost if not standard
                if (tile.movementCost !== 1) {
                    tooltipContent += `<br>Move cost: ${tile.movementCost}x`;
                }

                // Show if impassable
                if (!tile.isPassable) {
                    tooltipContent += `<br><em>Impassable</em>`;
                }

                tooltip.innerHTML = tooltipContent;
                tooltip.classList.remove('hidden');
                tooltip.style.left = `${event.clientX + 15}px`;
                tooltip.style.top = `${event.clientY + 15}px`;
            }
        }
    } else {
        GameState.hoveredTile = null;
        if (tooltip) {
            tooltip.classList.add('hidden');
        }
    }
}

function onClick(event) {
    // Ignore if clicking on UI elements
    if (event.target.closest('#hud') || event.target.closest('#card-hand')) {
        return;
    }

    raycaster.setFromCamera(mouse, camera);

    const tileMeshes = [];
    for (const row of GameState.map.tiles) {
        for (const tile of row) {
            if (tile.mesh) tileMeshes.push(tile.mesh);
        }
    }

    const intersects = raycaster.intersectObjects(tileMeshes);

    if (intersects.length > 0) {
        const tile = intersects[0].object.userData.tile;
        if (tile && onTileClick) {
            onTileClick(tile, 'left');
        }
    }
}

function onRightClick(event) {
    event.preventDefault();

    // Ignore if clicking on UI
    if (event.target.closest('#hud') || event.target.closest('#card-hand')) {
        return;
    }

    raycaster.setFromCamera(mouse, camera);

    const tileMeshes = [];
    for (const row of GameState.map.tiles) {
        for (const tile of row) {
            if (tile.mesh) tileMeshes.push(tile.mesh);
        }
    }

    const intersects = raycaster.intersectObjects(tileMeshes);

    if (intersects.length > 0) {
        const tile = intersects[0].object.userData.tile;
        if (tile && onTileClick) {
            onTileClick(tile, 'right');
        }
    }
}

export function getMouseWorldPosition() {
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    return intersection;
}
