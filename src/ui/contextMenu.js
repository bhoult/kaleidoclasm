// Context menu for tile interactions
import { GameState } from '../state.js';
import { TERRAIN } from '../config.js';
import { INTERIOR_TERRAIN } from '../world/interior.js';

let contextMenuElement = null;
let currentTile = null;
let currentScreenX = 0;
let currentScreenY = 0;

// Define available actions based on tile content
function getActionsForTile(tile) {
    // Route to indoor or outdoor actions based on view mode
    if (GameState.viewMode === 'indoor') {
        return getIndoorActionsForTile(tile);
    }
    return getOutdoorActionsForTile(tile);
}

// Get actions for outdoor tiles
function getOutdoorActionsForTile(tile) {
    const actions = [];

    if (!tile) return actions;

    // Check if a unit is adjacent to this tile (required for most actions)
    const hasAdjacentUnit = isUnitAdjacent(tile);

    // Check for enemy on tile - attack option
    const enemy = tile.getEnemy ? tile.getEnemy() : null;
    if (enemy) {
        if (hasAdjacentUnit) {
            actions.push({
                id: 'attack',
                label: `Attack ${enemy.name}`,
                icon: '⚔️',
                cost: 1,
                description: `Attack the ${enemy.name} (${enemy.health}/${enemy.maxHealth} HP)`,
                target: enemy
            });
        }
        // Enemy tiles don't have other actions
        return actions;
    }

    // Water tile - collect water
    if (tile.terrain === TERRAIN.WATER) {
        if (hasAdjacentUnit) {
            actions.push({
                id: 'collect_water',
                label: 'Collect Water',
                icon: '💧',
                cost: 1,
                description: 'Fill containers with water'
            });
        }
        return actions; // Water tiles don't have other actions
    }

    // Check for props/objects on the tile
    const propNames = tile.propNames || [];

    // Trees - harvest wood
    if (propNames.includes('Dead Tree')) {
        if (hasAdjacentUnit) {
            actions.push({
                id: 'harvest_wood',
                label: 'Harvest Wood',
                icon: '🪓',
                cost: 1,
                description: 'Chop tree for scrap materials'
            });
        }
    }

    // Buildings - enter building OR search
    if (tile.hasBuilding) {
        if (hasAdjacentUnit) {
            // Enter building action (primary)
            actions.push({
                id: 'enter_building',
                label: 'Enter Building',
                icon: '🚪',
                cost: 1,
                description: 'Enter and explore the building interior'
            });

            // Search from outside (alternative)
            actions.push({
                id: 'search_building',
                label: 'Search Outside',
                icon: '🔍',
                cost: 2,
                description: 'Quick search from outside'
            });
        }
    }

    // Toxic barrels - salvage chemicals
    if (propNames.includes('Toxic Barrel')) {
        if (hasAdjacentUnit) {
            actions.push({
                id: 'salvage_chemicals',
                label: 'Salvage Chemicals',
                icon: '☢️',
                cost: 1,
                description: 'Extract chemicals (radiation risk!)'
            });
        }
    }

    // Car wrecks - salvage parts
    if (propNames.includes('Car Wreck')) {
        if (hasAdjacentUnit) {
            actions.push({
                id: 'salvage_vehicle',
                label: 'Salvage Parts',
                icon: '🔧',
                cost: 2,
                description: 'Scavenge vehicle for parts'
            });
        }
    }

    // Debris - search rubble
    if (propNames.includes('Debris')) {
        if (hasAdjacentUnit) {
            actions.push({
                id: 'search_debris',
                label: 'Search Debris',
                icon: '🗑️',
                cost: 1,
                description: 'Dig through rubble for items'
            });
        }
    }

    // Generic ground actions for passable tiles without special objects
    if (tile.isPassable && actions.length === 0) {
        if (hasAdjacentUnit) {
            actions.push({
                id: 'search_ground',
                label: 'Search Area',
                icon: '👁️',
                cost: 1,
                description: 'Search the ground for resources'
            });
        }

        // Digging only on certain terrain
        if (tile.terrain === TERRAIN.DIRT || tile.terrain === TERRAIN.SAND || tile.terrain === TERRAIN.MUD) {
            if (hasAdjacentUnit) {
                actions.push({
                    id: 'dig',
                    label: 'Dig',
                    icon: '⛏️',
                    cost: 2,
                    description: 'Dig for buried items'
                });
            }
        }
    }

    return actions;
}

// Get actions for indoor tiles
function getIndoorActionsForTile(tile) {
    const actions = [];

    if (!tile) return actions;

    // Check if a unit is adjacent/on this tile
    const hasAdjacentUnit = isUnitAdjacentIndoor(tile);

    // Exit actions - for exit tiles or windows
    if (tile.isExit || tile.terrain === INTERIOR_TERRAIN.EXIT) {
        if (hasAdjacentUnit) {
            actions.push({
                id: 'exit_building',
                label: 'Exit Building',
                icon: '🚪',
                cost: 1,
                description: 'Leave the building and return outside'
            });
        }
    }

    // Window exit (alternative exit)
    if (tile.terrain === INTERIOR_TERRAIN.WINDOW) {
        if (hasAdjacentUnit) {
            actions.push({
                id: 'exit_window',
                label: 'Exit Through Window',
                icon: '🪟',
                cost: 1,
                description: 'Climb out through the window'
            });
        }
    }

    // Door actions
    if (tile.isDoor && tile.isDoor()) {
        if (hasAdjacentUnit) {
            if (tile.terrain === INTERIOR_TERRAIN.DOOR_LOCKED) {
                // Locked door options
                actions.push({
                    id: 'unlock_door',
                    label: 'Pick Lock',
                    icon: '🔓',
                    cost: 1,
                    description: 'Attempt to unlock (50% success)'
                });
                actions.push({
                    id: 'break_door',
                    label: 'Break Door',
                    icon: '💥',
                    cost: 2,
                    description: 'Force the door open (always succeeds)'
                });
            } else if (tile.terrain === INTERIOR_TERRAIN.DOOR_CLOSED) {
                actions.push({
                    id: 'open_door',
                    label: 'Open Door',
                    icon: '🚪',
                    cost: 0,
                    description: 'Open the door'
                });
            } else if (tile.terrain === INTERIOR_TERRAIN.DOOR_OPEN) {
                actions.push({
                    id: 'close_door',
                    label: 'Close Door',
                    icon: '🚪',
                    cost: 0,
                    description: 'Close the door'
                });
            }
        }
    }

    // Furniture actions
    if (tile.furniture) {
        if (hasAdjacentUnit) {
            // Search furniture (if searchable and not already searched)
            if (tile.furniture.searchable && !tile.searched) {
                if (tile.furniture.locked) {
                    // Locked furniture
                    actions.push({
                        id: 'unlock_furniture',
                        label: `Unlock ${tile.furniture.name}`,
                        icon: '🔓',
                        cost: 1,
                        description: 'Attempt to unlock (60% success)'
                    });
                    actions.push({
                        id: 'break_furniture',
                        label: `Break Open ${tile.furniture.name}`,
                        icon: '💥',
                        cost: 2,
                        description: 'Force it open (always succeeds)'
                    });
                } else {
                    actions.push({
                        id: 'search_furniture',
                        label: `Search ${tile.furniture.name}`,
                        icon: '🔍',
                        cost: 1,
                        description: 'Search for useful items'
                    });
                }
            } else if (tile.searched) {
                // Already searched
                actions.push({
                    id: 'search_furniture_again',
                    label: `Search Again`,
                    icon: '🔍',
                    cost: 1,
                    description: 'Search again (lower chance)'
                });
            }
        }
    }

    return actions;
}

// Check if any player unit is adjacent in indoor mode
function isUnitAdjacentIndoor(tile) {
    const interior = GameState.currentInterior;
    if (!interior) return false;

    for (const unit of GameState.units) {
        // Check if unit is in this interior
        if (!GameState.unitsIndoors.has(unit.id || unit.name)) continue;

        const dx = Math.abs(unit.x - tile.x);
        const dy = Math.abs(unit.y - tile.y);
        // Adjacent includes diagonals and the tile itself
        if (dx <= 1 && dy <= 1) {
            return true;
        }
    }
    return false;
}

// Check if any player unit is adjacent to (or on) the tile
function isUnitAdjacent(tile) {
    for (const unit of GameState.units) {
        const dx = Math.abs(unit.x - tile.x);
        const dy = Math.abs(unit.y - tile.y);
        // Adjacent includes diagonals and the tile itself
        if (dx <= 1 && dy <= 1) {
            return true;
        }
    }
    return false;
}

// Get the unit adjacent to the tile (prefer selected unit)
export function getAdjacentUnit(tile) {
    // Handle indoor mode
    if (GameState.viewMode === 'indoor') {
        return getAdjacentUnitIndoor(tile);
    }

    // First check if selected unit is adjacent
    if (GameState.selectedUnit) {
        const dx = Math.abs(GameState.selectedUnit.x - tile.x);
        const dy = Math.abs(GameState.selectedUnit.y - tile.y);
        if (dx <= 1 && dy <= 1) {
            return GameState.selectedUnit;
        }
    }

    // Otherwise find any adjacent unit
    for (const unit of GameState.units) {
        const dx = Math.abs(unit.x - tile.x);
        const dy = Math.abs(unit.y - tile.y);
        if (dx <= 1 && dy <= 1) {
            return unit;
        }
    }
    return null;
}

// Get adjacent unit for indoor tiles
function getAdjacentUnitIndoor(tile) {
    // First check if selected unit is adjacent and indoors
    if (GameState.selectedUnit) {
        if (GameState.unitsIndoors.has(GameState.selectedUnit.id || GameState.selectedUnit.name)) {
            const dx = Math.abs(GameState.selectedUnit.x - tile.x);
            const dy = Math.abs(GameState.selectedUnit.y - tile.y);
            if (dx <= 1 && dy <= 1) {
                return GameState.selectedUnit;
            }
        }
    }

    // Otherwise find any adjacent unit that's indoors
    for (const unit of GameState.units) {
        if (!GameState.unitsIndoors.has(unit.id || unit.name)) continue;

        const dx = Math.abs(unit.x - tile.x);
        const dy = Math.abs(unit.y - tile.y);
        if (dx <= 1 && dy <= 1) {
            return unit;
        }
    }
    return null;
}

// Initialize the context menu
export function initContextMenu() {
    contextMenuElement = document.getElementById('context-menu');

    // Close menu when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#context-menu')) {
            hideContextMenu();
        }
    });

    // Close menu on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideContextMenu();
        }
    });
}

// Show context menu for a tile
export function showContextMenu(tile, screenX, screenY) {
    if (!contextMenuElement) {
        initContextMenu();
    }

    currentTile = tile;
    currentScreenX = screenX;
    currentScreenY = screenY;

    const actions = getActionsForTile(tile);

    if (actions.length === 0) {
        // Show a "no actions" message briefly or just don't show menu
        hideContextMenu();
        return;
    }

    // Build menu HTML
    let html = `<div class="context-menu-header">${tile.terrain.name}</div>`;

    for (const action of actions) {
        const canAfford = canAffordAction(action);
        const disabledClass = canAfford ? '' : 'disabled';

        html += `
            <div class="context-menu-item ${disabledClass}" data-action="${action.id}">
                <span class="context-menu-icon">${action.icon}</span>
                <span class="context-menu-label">${action.label}</span>
                <span class="context-menu-cost">${action.cost} AP</span>
            </div>
        `;
    }

    contextMenuElement.innerHTML = html;

    // Position menu
    const menuWidth = 180;
    const menuHeight = contextMenuElement.offsetHeight || 150;

    let x = screenX;
    let y = screenY;

    // Keep menu on screen
    if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10;
    }

    contextMenuElement.style.left = `${x}px`;
    contextMenuElement.style.top = `${y}px`;
    contextMenuElement.classList.remove('hidden');

    // Add click handlers
    const items = contextMenuElement.querySelectorAll('.context-menu-item:not(.disabled)');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const actionId = item.dataset.action;
            executeAction(actionId, currentTile);
            hideContextMenu();
        });
    });
}

// Hide the context menu
export function hideContextMenu() {
    if (contextMenuElement) {
        contextMenuElement.classList.add('hidden');
    }
    currentTile = null;
}

// Check if player can afford an action
function canAffordAction(action) {
    const unit = getAdjacentUnit(currentTile);
    return unit && unit.actionPoints >= action.cost;
}

// Execute an interaction action
function executeAction(actionId, tile) {
    // Import dynamically to avoid circular dependencies
    import('../systems/interactions.js').then(module => {
        module.executeInteraction(actionId, tile);
    });
}
