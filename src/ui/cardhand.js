// Card hand UI rendering
import { GameState } from '../state.js';
import { playCard } from '../systems/cards.js';
import { updateUnitInfo } from './hud.js';
import { getMovementRange } from '../systems/pathfinding.js';
import { clearMapHighlights, highlightTiles } from '../world/map.js';
import { COLORS } from '../config.js';

export function renderHand() {
    const handContainer = document.getElementById('card-hand');
    handContainer.innerHTML = '';

    for (const card of GameState.hand) {
        const cardEl = createCardElement(card);
        handContainer.appendChild(cardEl);
    }
}

function createCardElement(card) {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.cardId = card.id;

    el.innerHTML = `
        <span class="card-cost">${card.cost} AP</span>
        <div class="card-name">${card.name}</div>
        <div class="card-type">${card.type}</div>
        <div class="card-description">${card.description}</div>
    `;

    // Click to select/play
    el.addEventListener('click', () => handleCardClick(card, el));

    return el;
}

function handleCardClick(card, element) {
    const unit = GameState.selectedUnit;

    // If no unit selected, prompt to select one
    if (!unit) {
        showCardMessage('Select a unit first');
        return;
    }

    // Check if can play
    if (!card.canPlay(unit)) {
        showCardMessage('Not enough AP');
        return;
    }

    // For self-target cards, play immediately
    if (card.targetType === 'self') {
        if (playCard(card, unit)) {
            renderHand();
            updateUnitInfo(unit);

            // Update movement display if movement was affected
            clearMapHighlights();
            if (unit.actionPoints > 0) {
                const range = getMovementRange(unit);
                highlightTiles(range, COLORS.MOVE_RANGE);
            }
        }
    } else {
        // For targeted cards, enter targeting mode
        GameState.selectedCard = card;
        highlightSelectedCard(element);
        showCardMessage('Select a target');
    }
}

function highlightSelectedCard(element) {
    // Remove previous selection
    document.querySelectorAll('.card.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selection
    element.classList.add('selected');
}

function showCardMessage(text) {
    // Brief message near cards
    const msg = document.createElement('div');
    msg.className = 'card-message';
    msg.textContent = text;
    msg.style.cssText = `
        position: absolute;
        bottom: 200px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #ffcc00;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 0.9em;
        z-index: 100;
    `;

    document.getElementById('game-container').appendChild(msg);

    setTimeout(() => {
        msg.remove();
    }, 1500);
}

export function cancelCardSelection() {
    GameState.selectedCard = null;
    document.querySelectorAll('.card.selected').forEach(el => {
        el.classList.remove('selected');
    });
}
