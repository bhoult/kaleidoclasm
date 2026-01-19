// Input handling - mouse, raycasting, selection
import * as THREE from 'three';
import { camera, renderer } from './renderer.js';
import { GameState } from '../state.js';
import { getTile, clearMapHighlights, highlightTiles } from '../world/map.js';
import { COLORS } from '../config.js';
import { showContextMenu, hideContextMenu, initContextMenu } from '../ui/contextMenu.js';
import { clearInteriorHighlights, highlightInteriorTiles } from '../systems/interiorRenderer.js';

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

    // Initialize context menu
    initContextMenu();
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Use indoor tile meshes when in indoor mode, otherwise outdoor
    const tileMeshes = GameState.viewMode === 'indoor' && GameState.currentInterior
        ? GameState.currentInterior.tileMeshes
        : GameState.map.visibleTileMeshes;

    const intersects = raycaster.intersectObjects(tileMeshes, true);

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
        // Handle both direct tile and nested objects (like door groups)
        let tile = intersects[0].object.userData.tile;
        if (!tile && intersects[0].object.parent) {
            tile = intersects[0].object.parent.userData.tile;
        }

        if (tile) {
            GameState.hoveredTile = tile;
            if (onTileHover) onTileHover(tile);

            // Update tooltip
            if (tooltip) {
                let tooltipContent = `<strong>${tile.terrain.name}</strong>`;

                // Indoor mode - show furniture info
                if (GameState.viewMode === 'indoor') {
                    if (tile.furniture) {
                        tooltipContent += `<br>${tile.furniture.name}`;
                        if (tile.furniture.locked) {
                            tooltipContent += ' (Locked)';
                        }
                        if (tile.searched) {
                            tooltipContent += ' (Searched)';
                        }
                    }
                    if (tile.isExit) {
                        tooltipContent += `<br><em>Exit</em>`;
                    }
                } else {
                    // Outdoor mode - show objects on tile if present
                    if (tile.propNames && tile.propNames.length > 0) {
                        tooltipContent += `<br>Objects: ${tile.propNames.join(', ')}`;
                    } else if (tile.propName) {
                        // Legacy fallback
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
    // Hide context menu on any left click
    hideContextMenu();

    // Ignore if clicking on UI elements
    if (event.target.closest('#hud') || event.target.closest('#card-hand')) {
        return;
    }

    raycaster.setFromCamera(mouse, camera);

    // Use indoor tile meshes when in indoor mode, otherwise outdoor
    const tileMeshes = GameState.viewMode === 'indoor' && GameState.currentInterior
        ? GameState.currentInterior.tileMeshes
        : GameState.map.visibleTileMeshes;

    const intersects = raycaster.intersectObjects(tileMeshes, true);

    if (intersects.length > 0) {
        // Handle both direct tile and nested objects
        let tile = intersects[0].object.userData.tile;
        if (!tile && intersects[0].object.parent) {
            tile = intersects[0].object.parent.userData.tile;
        }

        if (tile && onTileClick) {
            onTileClick(tile, 'left');
        }
    }
}

function onRightClick(event) {
    event.preventDefault();

    // Ignore if clicking on UI
    if (event.target.closest('#hud') || event.target.closest('#card-hand') || event.target.closest('#context-menu')) {
        return;
    }

    raycaster.setFromCamera(mouse, camera);

    // Use indoor tile meshes when in indoor mode, otherwise outdoor
    const tileMeshes = GameState.viewMode === 'indoor' && GameState.currentInterior
        ? GameState.currentInterior.tileMeshes
        : GameState.map.visibleTileMeshes;

    const intersects = raycaster.intersectObjects(tileMeshes, true);

    if (intersects.length > 0) {
        // Handle both direct tile and nested objects
        let tile = intersects[0].object.userData.tile;
        if (!tile && intersects[0].object.parent) {
            tile = intersects[0].object.parent.userData.tile;
        }

        if (tile) {
            // Show context menu for tile interactions
            showContextMenu(tile, event.clientX, event.clientY);
        }
    } else {
        hideContextMenu();
    }
}

export function getMouseWorldPosition() {
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    return intersection;
}
