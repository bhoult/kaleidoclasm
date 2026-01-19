// Main game bootstrap and loop
import { initRenderer, render, scene, addLights, clearScene } from './core/renderer.js';
import { initInput } from './core/input.js';
import { GameState } from './state.js';
import { generateMap, renderMap, clearMapHighlights, highlightTiles } from './world/map.js';
import { COLORS, PHASES } from './config.js';
import { Unit, createStartingUnits } from './entities/unit.js';
import { getMovementRange, moveUnit } from './systems/pathfinding.js';
import { initTurnSystem, setTurnEndCallback, updatePhaseDisplay } from './core/turn.js';
import { initHUD, updateHUD, updateUnitInfo, showMessage } from './ui/hud.js';
import { initCards, drawCards } from './systems/cards.js';
import { renderHand } from './ui/cardhand.js';
import { Enemy, spawnEnemies, updateEnemies } from './entities/enemy.js';
import { applyRadiation } from './systems/radiation.js';
import { consumeResources } from './systems/resources.js';
import { initialReveal, revealAroundPosition } from './systems/fogOfWar.js';

let animationId = null;

function init() {
    // Initialize renderer
    initRenderer();

    // Initialize map (chunk-based, generates on demand)
    generateMap();

    // Create starting units (near origin)
    createStartingUnits();

    // Reveal tiles around starting units (fog of war)
    initialReveal(GameState.units);

    // Initialize systems
    initTurnSystem();
    setTurnEndCallback(onTurnEnd);
    initHUD();
    initCards();

    // Draw starting hand
    drawCards(5);
    renderHand();

    // Initialize input with handlers
    initInput(handleTileClick, handleTileHover);

    // Set up save/load buttons
    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('load-btn').addEventListener('click', loadGame);

    // Start game loop
    gameLoop();

    console.log('Echoes of the Fall initialized');
}

function gameLoop() {
    animationId = requestAnimationFrame(gameLoop);

    // Update animations
    updateAnimations();

    // Render
    render();
}

function updateAnimations() {
    // Update unit animations
    for (const unit of GameState.units) {
        if (unit.updateAnimation) {
            unit.updateAnimation();
        }
    }
    for (const enemy of GameState.enemies) {
        if (enemy.updateAnimation) {
            enemy.updateAnimation();
        }
    }
}

function handleTileClick(tile, button) {
    if (GameState.gameOver) return;
    if (GameState.phase !== PHASES.ACTIONS) return;

    if (button === 'left') {
        // Check if clicking on a unit
        const unit = tile.getUnit();
        if (unit && GameState.units.includes(unit)) {
            selectUnit(unit);
            return;
        }

        // If unit is selected and tile is in movement range, move there
        if (GameState.selectedUnit) {
            const movableTiles = getMovementRange(GameState.selectedUnit);
            if (movableTiles.includes(tile)) {
                moveUnit(GameState.selectedUnit, tile);
                clearMapHighlights();
                // Re-show movement range after move
                setTimeout(() => {
                    if (GameState.selectedUnit && GameState.selectedUnit.actionPoints > 0) {
                        const newRange = getMovementRange(GameState.selectedUnit);
                        highlightTiles(newRange, COLORS.MOVE_RANGE);
                    }
                    updateUnitInfo(GameState.selectedUnit);
                }, 300);
            }
        }
    } else if (button === 'right') {
        // Deselect
        deselectUnit();
    }
}

function handleTileHover(tile) {
    if (!tile) return;

    // Tooltip is updated via mousemove in input.js
}

function selectUnit(unit) {
    // Deselect previous
    if (GameState.selectedUnit) {
        GameState.selectedUnit.setSelected(false);
    }

    GameState.selectedUnit = unit;
    unit.setSelected(true);

    // Show movement range
    clearMapHighlights();
    if (unit.actionPoints > 0) {
        const movableTiles = getMovementRange(unit);
        highlightTiles(movableTiles, COLORS.MOVE_RANGE);
    }

    // Update HUD
    updateUnitInfo(unit);
}

function deselectUnit() {
    if (GameState.selectedUnit) {
        GameState.selectedUnit.setSelected(false);
        GameState.selectedUnit = null;
    }
    clearMapHighlights();
    updateUnitInfo(null);
}

// Expose for turn system
export function onTurnEnd() {
    // Apply radiation to all units
    for (const unit of GameState.units) {
        applyRadiation(unit);
    }

    // Consume resources
    consumeResources();

    // Update enemies
    updateEnemies();

    // Spawn new enemies occasionally
    if (GameState.turn % 3 === 0) {
        spawnEnemies(1);
    }

    // Draw new cards
    drawCards(2);
    renderHand();

    // Reset unit AP
    for (const unit of GameState.units) {
        unit.resetAP();
    }

    // Check win/lose conditions
    checkGameEnd();

    // Update displays
    updateHUD();
    if (GameState.selectedUnit) {
        updateUnitInfo(GameState.selectedUnit);
        const movableTiles = getMovementRange(GameState.selectedUnit);
        highlightTiles(movableTiles, COLORS.MOVE_RANGE);
    }
}

function checkGameEnd() {
    // Lose if all units dead
    if (GameState.units.length === 0) {
        endGame(false, 'All survivors have perished.');
        return;
    }

    // Win if survived 30 turns
    if (GameState.turn > 30) {
        endGame(true, 'You survived 30 turns in the wasteland!');
        return;
    }
}

function endGame(victory, message) {
    GameState.gameOver = true;
    GameState.victory = victory;

    const gameOverEl = document.getElementById('game-over');
    const titleEl = document.getElementById('game-over-title');
    const messageEl = document.getElementById('game-over-message');

    gameOverEl.classList.remove('hidden', 'victory', 'defeat');
    gameOverEl.classList.add(victory ? 'victory' : 'defeat');
    titleEl.textContent = victory ? 'Victory!' : 'Game Over';
    messageEl.textContent = message;

    document.getElementById('restart-btn').onclick = restartGame;
}

function restartGame() {
    // Clear scene
    clearScene();

    // Reset state
    GameState.reset();

    // Hide game over screen
    document.getElementById('game-over').classList.add('hidden');

    // Reinitialize (add lights back, don't recreate renderer)
    addLights();
    generateMap();
    createStartingUnits();
    initialReveal(GameState.units);
    initCards();
    drawCards(5);
    renderHand();
    updateHUD();
    updatePhaseDisplay();
}

// Save/Load functionality
function saveGame() {
    const saveData = {
        seed: GameState.seed,
        turn: GameState.turn,
        phase: GameState.phase,
        units: GameState.units.map(u => u.toJSON()),
        enemies: GameState.enemies.map(e => e.toJSON()),
        globalResources: { ...GameState.globalResources },
        hand: GameState.hand.map(c => ({ name: c.name, type: c.type })),
        deckSize: GameState.playerDeck.length,
        discardSize: GameState.discardPile.length,
        revealedTiles: Array.from(GameState.map.revealedTiles)  // Save revealed tile positions
    };

    localStorage.setItem('echoesOfTheFall_save', JSON.stringify(saveData));
    showMessage('Game Saved!', 1500);
}

function loadGame() {
    const saveDataStr = localStorage.getItem('echoesOfTheFall_save');
    if (!saveDataStr) {
        showMessage('No save found', 1500);
        return false;
    }

    try {
        const saveData = JSON.parse(saveDataStr);

        // Clear current game
        clearScene();
        GameState.reset();

        // Restore state
        GameState.seed = saveData.seed;
        GameState.turn = saveData.turn;
        GameState.phase = saveData.phase;
        GameState.globalResources = saveData.globalResources;

        // Regenerate map with same seed (deterministic)
        addLights();
        generateMap(saveData.seed);

        // Restore revealed tiles from save
        if (saveData.revealedTiles && Array.isArray(saveData.revealedTiles)) {
            // Reveal each saved tile position (radius 0 reveals just that tile)
            for (const key of saveData.revealedTiles) {
                const [x, y] = key.split(',').map(Number);
                revealAroundPosition(x, y, 0);
            }
        }

        // Recreate units
        for (const unitData of saveData.units) {
            const unit = new Unit(unitData.x, unitData.y, unitData.name);
            unit.health = unitData.health;
            unit.actionPoints = unitData.actionPoints;
            unit.radiationDose = unitData.radiationDose;
            unit.hydration = unitData.hydration;
            unit.nutrition = unitData.nutrition;
            GameState.units.push(unit);
        }

        // Recreate enemies
        for (const enemyData of saveData.enemies) {
            const enemy = new Enemy(enemyData.x, enemyData.y, enemyData.name);
            enemy.health = enemyData.health;
            GameState.enemies.push(enemy);
        }

        // Reinitialize cards
        initCards();
        drawCards(saveData.hand.length);
        renderHand();
        updateHUD();
        updatePhaseDisplay();

        showMessage('Game Loaded!', 1500);
        return true;
    } catch (e) {
        showMessage('Failed to load save', 1500);
        console.error('Failed to load save:', e);
        return false;
    }
}

// Expose save/load globally for debugging
window.saveGame = saveGame;
window.loadGame = loadGame;

// Start game when DOM loaded
document.addEventListener('DOMContentLoaded', init);
