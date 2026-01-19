// Turn state machine
import { GameState } from '../state.js';
import { PHASES } from '../config.js';

let onTurnEndCallback = null;

export function initTurnSystem() {
    GameState.turn = 1;
    GameState.phase = PHASES.ACTIONS;

    // Set up end turn button
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', () => {
            if (!GameState.gameOver) {
                endTurn();
            }
        });
    }

    updatePhaseDisplay();
}

export function setTurnEndCallback(callback) {
    onTurnEndCallback = callback;
}

export function endTurn() {
    if (GameState.gameOver) return;

    // Progress through phases
    switch (GameState.phase) {
        case PHASES.EVENT_DRAW:
            GameState.phase = PHASES.PLAYER_HAND;
            break;

        case PHASES.PLAYER_HAND:
            GameState.phase = PHASES.ACTIONS;
            break;

        case PHASES.ACTIONS:
            GameState.phase = PHASES.END_PHASE;
            processEndPhase();
            break;

        case PHASES.END_PHASE:
            // Start new turn
            GameState.turn++;
            GameState.phase = PHASES.ACTIONS; // Simplified: skip to actions
            break;
    }

    updatePhaseDisplay();
}

function processEndPhase() {
    // Call the turn end callback from main.js
    if (onTurnEndCallback) {
        onTurnEndCallback();
    }

    // Auto-advance to next turn
    GameState.turn++;
    GameState.phase = PHASES.ACTIONS;
    updatePhaseDisplay();
}

export function updatePhaseDisplay() {
    const turnCounter = document.getElementById('turn-counter');
    const phaseIndicator = document.getElementById('phase-indicator');

    if (turnCounter) {
        turnCounter.textContent = `Turn ${GameState.turn}`;
    }

    if (phaseIndicator) {
        const phaseNames = {
            [PHASES.EVENT_DRAW]: 'Event Phase',
            [PHASES.PLAYER_HAND]: 'Draw Phase',
            [PHASES.ACTIONS]: 'Action Phase',
            [PHASES.END_PHASE]: 'End Phase'
        };
        phaseIndicator.textContent = phaseNames[GameState.phase] || 'Unknown';
    }
}

export function getCurrentPhase() {
    return GameState.phase;
}

export function getTurnNumber() {
    return GameState.turn;
}
