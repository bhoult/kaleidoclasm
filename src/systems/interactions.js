// Interaction system - handles resource gathering and object interactions
import { GameState } from '../state.js';
import { getAdjacentUnit } from '../ui/contextMenu.js';
import { showMessage, updateUnitInfo, updateHUD } from '../ui/hud.js';
import { scene, indoorScene } from '../core/renderer.js';
import { performAttack } from './combat.js';
import { INTERIOR_TERRAIN, LOOT_TABLES } from '../world/interior.js';
import { enterBuilding, exitBuilding } from './interiorManager.js';
import { updateFurnitureAppearance, updateDoorAppearance } from './interiorRenderer.js';

// Execute an interaction action on a tile
export function executeInteraction(actionId, tile) {
    const unit = getAdjacentUnit(tile);
    if (!unit) {
        showMessage('No unit nearby!', 1500);
        return false;
    }

    const actions = {
        'attack': attackEnemy,
        'collect_water': collectWater,
        'harvest_wood': harvestWood,
        'search_building': searchBuilding,
        'salvage_chemicals': salvageChemicals,
        'salvage_vehicle': salvageVehicle,
        'search_debris': searchDebris,
        'search_ground': searchGround,
        'dig': dig,
        // Indoor/building actions
        'enter_building': enterBuildingAction,
        'exit_building': exitBuildingAction,
        'exit_window': exitWindowAction,
        'search_furniture': searchFurniture,
        'search_furniture_again': searchFurnitureAgain,
        'unlock_door': unlockDoor,
        'break_door': breakDoor,
        'open_door': openDoor,
        'close_door': closeDoor,
        'unlock_furniture': unlockFurniture,
        'break_furniture': breakFurniture
    };

    const handler = actions[actionId];
    if (handler) {
        return handler(tile, unit);
    }

    console.warn(`Unknown action: ${actionId}`);
    return false;
}

// Attack an enemy
function attackEnemy(tile, unit) {
    const enemy = tile.getEnemy ? tile.getEnemy() : null;
    if (!enemy) {
        showMessage('No enemy here!', 1500);
        return false;
    }

    const result = performAttack(unit, enemy);
    if (result) {
        showMessage(result.message, 1500);
        updateUnitInfo(unit);
        updateHUD();
        return true;
    } else {
        if (unit.actionPoints < 1) {
            showMessage('Not enough AP!', 1500);
        } else {
            showMessage('Enemy not in range!', 1500);
        }
        return false;
    }
}

// Collect water from water tile
function collectWater(tile, unit) {
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 1;

    // Add water to global resources
    const amount = 1 + Math.floor(Math.random() * 2);
    GameState.globalResources.water += amount;

    showMessage(`Collected ${amount} water!`, 1500);
    return true;
}

// Harvest wood from a tree
function harvestWood(tile, unit) {
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 1;

    // Add scrap (wood counts as scrap)
    const amount = 2 + Math.floor(Math.random() * 3);
    GameState.globalResources.scrap += amount;

    // Remove the tree from the tile
    removePropFromTile(tile, 'Dead Tree');

    showMessage(`Harvested ${amount} wood!`, 1500);
    return true;
}

// Search a building for supplies
function searchBuilding(tile, unit) {
    if (unit.actionPoints < 2) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 2;

    // Random loot table
    const lootRoll = Math.random();
    let message = '';

    if (lootRoll < 0.3) {
        // Found food
        const amount = 1 + Math.floor(Math.random() * 2);
        GameState.globalResources.food += amount;
        message = `Found ${amount} food!`;
    } else if (lootRoll < 0.5) {
        // Found medicine
        const amount = 1;
        GameState.globalResources.medicine += amount;
        message = `Found ${amount} medicine!`;
    } else if (lootRoll < 0.7) {
        // Found water
        const amount = 1 + Math.floor(Math.random() * 2);
        GameState.globalResources.water += amount;
        message = `Found ${amount} water!`;
    } else if (lootRoll < 0.9) {
        // Found scrap
        const amount = 2 + Math.floor(Math.random() * 4);
        GameState.globalResources.scrap += amount;
        message = `Found ${amount} scrap!`;
    } else {
        // Found nothing
        message = 'Found nothing useful.';
    }

    // Mark building as searched (reduce future yields)
    if (!tile.searched) {
        tile.searched = 0;
    }
    tile.searched++;

    showMessage(message, 1500);
    return true;
}

// Salvage chemicals from toxic barrel (risky!)
function salvageChemicals(tile, unit) {
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 1;

    // Risk of radiation exposure
    if (Math.random() < 0.4) {
        const radDose = 5 + Math.floor(Math.random() * 10);
        unit.addRadiation(radDose);
        showMessage(`Exposed to radiation! (+${radDose} RAD)`, 2000);
    }

    // Get medicine (chemicals can be refined)
    if (Math.random() < 0.6) {
        GameState.globalResources.medicine += 1;
        showMessage('Salvaged chemical compounds! (+1 Medicine)', 1500);
    } else {
        GameState.globalResources.scrap += 1;
        showMessage('Salvaged container for scrap.', 1500);
    }

    // Remove the barrel
    removePropFromTile(tile, 'Toxic Barrel');

    return true;
}

// Salvage parts from vehicle wreck
function salvageVehicle(tile, unit) {
    if (unit.actionPoints < 2) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 2;

    // Good chance of scrap, small chance of fuel/parts
    const amount = 3 + Math.floor(Math.random() * 5);
    GameState.globalResources.scrap += amount;

    showMessage(`Salvaged ${amount} scrap from vehicle!`, 1500);

    // Mark as salvaged (can still search again but less effective)
    if (!tile.salvaged) {
        tile.salvaged = 0;
        // Remove the car wreck visual after first salvage
        removePropFromTile(tile, 'Car Wreck');
    }
    tile.salvaged++;

    return true;
}

// Search debris pile
function searchDebris(tile, unit) {
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 1;

    // Small chance of finding something useful
    const roll = Math.random();

    if (roll < 0.4) {
        const amount = 1 + Math.floor(Math.random() * 2);
        GameState.globalResources.scrap += amount;
        showMessage(`Found ${amount} scrap in debris!`, 1500);
    } else if (roll < 0.5) {
        GameState.globalResources.food += 1;
        showMessage('Found canned food!', 1500);
    } else {
        showMessage('Nothing useful in the rubble.', 1500);
    }

    return true;
}

// Search the ground
function searchGround(tile, unit) {
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 1;

    // Low chance of finding anything
    const roll = Math.random();

    if (roll < 0.15) {
        GameState.globalResources.scrap += 1;
        showMessage('Found some scrap!', 1500);
    } else if (roll < 0.2) {
        GameState.globalResources.food += 1;
        showMessage('Found edible plants!', 1500);
    } else {
        showMessage('Nothing here.', 1500);
    }

    return true;
}

// Dig in the ground
function dig(tile, unit) {
    if (unit.actionPoints < 2) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 2;

    // Chance of finding buried items
    const roll = Math.random();

    if (roll < 0.2) {
        const amount = 2 + Math.floor(Math.random() * 4);
        GameState.globalResources.scrap += amount;
        showMessage(`Dug up ${amount} buried scrap!`, 1500);
    } else if (roll < 0.3) {
        GameState.globalResources.water += 1;
        showMessage('Found an underground water source!', 1500);
    } else if (roll < 0.35) {
        GameState.globalResources.medicine += 1;
        showMessage('Dug up a buried med kit!', 1500);
    } else {
        showMessage('Just dirt.', 1500);
    }

    return true;
}

// === INDOOR/BUILDING ACTIONS ===

// Enter a building
function enterBuildingAction(tile, unit) {
    return enterBuilding(unit, tile);
}

// Exit building through door
function exitBuildingAction(tile, unit) {
    return exitBuilding(unit, tile);
}

// Exit building through window
function exitWindowAction(tile, unit) {
    // Same as door exit but through window
    return exitBuilding(unit, tile);
}

// Search furniture for loot
function searchFurniture(tile, unit) {
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    if (!tile.furniture) {
        showMessage('Nothing to search here.', 1500);
        return false;
    }

    if (tile.furniture.locked) {
        showMessage('This is locked! Unlock it first.', 1500);
        return false;
    }

    unit.actionPoints -= 1;

    // Get loot table
    const lootTableName = tile.furniture.lootTable;
    const loot = rollLootTable(lootTableName);

    if (loot.type && loot.amount > 0) {
        GameState.globalResources[loot.type] += loot.amount;
        showMessage(`Found ${loot.amount} ${loot.type}!`, 1500);
    } else {
        showMessage('Nothing useful here.', 1500);
    }

    // Mark as searched
    tile.searched = true;
    updateFurnitureAppearance(tile);
    updateHUD();

    return true;
}

// Search furniture again (lower chance)
function searchFurnitureAgain(tile, unit) {
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 1;

    // Lower chance of finding anything (halved)
    if (Math.random() < 0.3) {
        const scrap = Math.floor(Math.random() * 2) + 1;
        GameState.globalResources.scrap += scrap;
        showMessage(`Found ${scrap} scrap!`, 1500);
    } else {
        showMessage('Nothing more here.', 1500);
    }

    updateHUD();
    return true;
}

// Unlock a door
function unlockDoor(tile, unit) {
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 1;

    // 50% success chance
    if (Math.random() < 0.5) {
        tile.unlock();
        updateDoorAppearance(tile, GameState.currentInterior, indoorScene);
        showMessage('Lock picked successfully!', 1500);
    } else {
        showMessage('Failed to pick the lock.', 1500);
    }

    updateHUD();
    return true;
}

// Break down a locked door
function breakDoor(tile, unit) {
    if (unit.actionPoints < 2) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 2;

    tile.breakDoor();
    updateDoorAppearance(tile, GameState.currentInterior, indoorScene);
    showMessage('Door broken open!', 1500);
    updateHUD();

    return true;
}

// Open a closed door
function openDoor(tile, unit) {
    // Free action
    tile.toggleDoor();
    updateDoorAppearance(tile, GameState.currentInterior, indoorScene);
    showMessage('Door opened.', 1000);
    return true;
}

// Close an open door
function closeDoor(tile, unit) {
    // Free action
    tile.toggleDoor();
    updateDoorAppearance(tile, GameState.currentInterior, indoorScene);
    showMessage('Door closed.', 1000);
    return true;
}

// Unlock furniture
function unlockFurniture(tile, unit) {
    if (unit.actionPoints < 1) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 1;

    // 60% success chance
    if (Math.random() < 0.6) {
        tile.furniture = { ...tile.furniture, locked: false };
        showMessage(`Unlocked the ${tile.furniture.name}!`, 1500);
    } else {
        showMessage('Failed to unlock.', 1500);
    }

    updateHUD();
    return true;
}

// Break open locked furniture
function breakFurniture(tile, unit) {
    if (unit.actionPoints < 2) {
        showMessage('Not enough AP!', 1500);
        return false;
    }

    unit.actionPoints -= 2;

    tile.furniture = { ...tile.furniture, locked: false };
    showMessage(`Forced open the ${tile.furniture.name}!`, 1500);
    updateHUD();

    return true;
}

// Roll on a loot table
function rollLootTable(tableName) {
    const table = LOOT_TABLES[tableName];
    if (!table) return { type: null, amount: 0 };

    const roll = Math.random();
    let cumulative = 0;

    for (const entry of table) {
        cumulative += entry.chance;
        if (roll < cumulative) {
            if (!entry.type) return { type: null, amount: 0 };
            const amount = entry.amount[0] + Math.floor(Math.random() * (entry.amount[1] - entry.amount[0] + 1));
            return { type: entry.type, amount };
        }
    }

    return { type: null, amount: 0 };
}

// Helper: Remove a prop from a tile
function removePropFromTile(tile, propName) {
    if (!tile.propNames) return;

    const index = tile.propNames.indexOf(propName);
    if (index === -1) return;

    // Remove from propNames
    tile.propNames.splice(index, 1);

    // Update legacy propName
    tile.propName = tile.propNames.join(', ') || null;

    // Remove the mesh from scene
    if (tile.props && tile.props.length > index) {
        const prop = tile.props[index];
        if (prop) {
            scene.remove(prop);
            prop.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        tile.props.splice(index, 1);
    }

    // Also check pendingProps
    if (tile.pendingProps) {
        // Find and remove matching prop
        for (let i = tile.pendingProps.length - 1; i >= 0; i--) {
            const prop = tile.pendingProps[i];
            if (prop.parent) {
                scene.remove(prop);
            }
            tile.pendingProps.splice(i, 1);
            break; // Remove one at a time
        }
    }
}
