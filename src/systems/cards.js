// Card system - deck management and card effects
import { GameState } from '../state.js';
import { CARD_TYPES } from '../config.js';

let cardIdCounter = 0;

export class Card {
    constructor(data) {
        this.id = ++cardIdCounter;
        this.name = data.name;
        this.type = data.type;
        this.description = data.description;
        this.cost = data.cost || 1;
        this.effects = data.effects || [];
        this.targetType = data.targetType || 'self'; // 'self', 'unit', 'tile', 'enemy'
    }

    canPlay(unit) {
        return unit && unit.actionPoints >= this.cost;
    }

    play(unit, target = null) {
        if (!this.canPlay(unit)) return false;

        unit.actionPoints -= this.cost;

        for (const effect of this.effects) {
            applyEffect(effect, unit, target);
        }

        return true;
    }
}

function applyEffect(effect, unit, target) {
    switch (effect.type) {
        case 'heal':
            unit.heal(effect.value);
            break;

        case 'move_bonus':
            unit.moveRange += effect.value;
            // Reset at end of turn
            setTimeout(() => {
                unit.moveRange -= effect.value;
            }, 100);
            break;

        case 'ap_restore':
            unit.actionPoints = Math.min(
                unit.maxActionPoints,
                unit.actionPoints + effect.value
            );
            break;

        case 'damage':
            if (target && target.takeDamage) {
                target.takeDamage(effect.value);
            }
            break;

        case 'radiation_cure':
            unit.radiationDose = Math.max(0, unit.radiationDose - effect.value);
            unit.updateARSStage();
            break;

        case 'hydration':
            unit.hydration = Math.min(100, unit.hydration + effect.value);
            break;

        case 'nutrition':
            unit.nutrition = Math.min(100, unit.nutrition + effect.value);
            break;

        case 'scrap':
            GameState.globalResources.scrap += effect.value;
            break;

        case 'defense':
            // Temporary defense boost (simplified)
            break;
    }
}

// Starter card definitions
const STARTER_CARDS = [
    {
        name: 'Sprint',
        type: CARD_TYPES.ACTION,
        description: '+2 movement range this turn',
        cost: 1,
        effects: [{ type: 'move_bonus', value: 2 }],
        targetType: 'self'
    },
    {
        name: 'First Aid',
        type: CARD_TYPES.ITEM,
        description: 'Heal 25 HP',
        cost: 1,
        effects: [{ type: 'heal', value: 25 }],
        targetType: 'self'
    },
    {
        name: 'Scavenge',
        type: CARD_TYPES.ACTION,
        description: 'Gain 5 scrap',
        cost: 1,
        effects: [{ type: 'scrap', value: 5 }],
        targetType: 'self'
    },
    {
        name: 'Rad-Away',
        type: CARD_TYPES.ITEM,
        description: 'Remove 30 radiation',
        cost: 1,
        effects: [{ type: 'radiation_cure', value: 30 }],
        targetType: 'self'
    },
    {
        name: 'Purified Water',
        type: CARD_TYPES.ITEM,
        description: '+40 hydration',
        cost: 0,
        effects: [{ type: 'hydration', value: 40 }],
        targetType: 'self'
    },
    {
        name: 'Canned Food',
        type: CARD_TYPES.ITEM,
        description: '+30 nutrition',
        cost: 0,
        effects: [{ type: 'nutrition', value: 30 }],
        targetType: 'self'
    },
    {
        name: 'Second Wind',
        type: CARD_TYPES.SKILL,
        description: '+1 AP',
        cost: 0,
        effects: [{ type: 'ap_restore', value: 1 }],
        targetType: 'self'
    },
    {
        name: 'Combat Stim',
        type: CARD_TYPES.ITEM,
        description: '+2 AP, take 10 damage',
        cost: 0,
        effects: [
            { type: 'ap_restore', value: 2 },
            { type: 'damage', value: -10 } // Self damage
        ],
        targetType: 'self'
    },
    {
        name: 'Bandage',
        type: CARD_TYPES.ITEM,
        description: 'Heal 15 HP',
        cost: 0,
        effects: [{ type: 'heal', value: 15 }],
        targetType: 'self'
    },
    {
        name: 'Emergency Ration',
        type: CARD_TYPES.ITEM,
        description: '+20 nutrition, +20 hydration',
        cost: 1,
        effects: [
            { type: 'nutrition', value: 20 },
            { type: 'hydration', value: 20 }
        ],
        targetType: 'self'
    }
];

export function initCards() {
    GameState.playerDeck = [];
    GameState.hand = [];
    GameState.discardPile = [];

    // Create deck with multiple copies of starter cards
    for (let i = 0; i < 2; i++) {
        for (const cardData of STARTER_CARDS) {
            GameState.playerDeck.push(new Card(cardData));
        }
    }

    shuffleDeck();
}

export function shuffleDeck() {
    const deck = GameState.playerDeck;
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

export function drawCards(count) {
    for (let i = 0; i < count; i++) {
        if (GameState.playerDeck.length === 0) {
            // Shuffle discard pile into deck
            if (GameState.discardPile.length === 0) return;

            GameState.playerDeck = [...GameState.discardPile];
            GameState.discardPile = [];
            shuffleDeck();
        }

        const card = GameState.playerDeck.pop();
        if (card && GameState.hand.length < 7) {
            GameState.hand.push(card);
        }
    }
}

export function playCard(card, unit, target = null) {
    if (!card || !unit) return false;

    const idx = GameState.hand.indexOf(card);
    if (idx === -1) return false;

    if (card.play(unit, target)) {
        GameState.hand.splice(idx, 1);
        GameState.discardPile.push(card);
        return true;
    }

    return false;
}

export function discardCard(card) {
    const idx = GameState.hand.indexOf(card);
    if (idx !== -1) {
        GameState.hand.splice(idx, 1);
        GameState.discardPile.push(card);
    }
}
