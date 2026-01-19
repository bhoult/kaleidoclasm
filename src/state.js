// Central game state
import { PHASES, GAME } from './config.js';

export const GameState = {
    seed: Date.now(),
    turn: 1,
    phase: PHASES.ACTIONS,
    gameOver: false,
    victory: false,

    map: {
        width: 0,
        height: 0,
        tiles: [],
        revealed: new Set()
    },

    units: [],
    enemies: [],
    selectedUnit: null,
    hoveredTile: null,

    playerDeck: [],
    eventDeck: [],
    hand: [],
    discardPile: [],
    selectedCard: null,

    globalResources: {
        scrap: 10,
        medicine: 2,
        food: 5,
        water: 5
    },

    moveHighlights: [],

    // Methods
    reset() {
        this.seed = Date.now();
        this.turn = 1;
        this.phase = PHASES.ACTIONS;
        this.gameOver = false;
        this.victory = false;
        this.map.tiles = [];
        this.map.revealed.clear();
        this.units = [];
        this.enemies = [];
        this.selectedUnit = null;
        this.hoveredTile = null;
        this.playerDeck = [];
        this.eventDeck = [];
        this.hand = [];
        this.discardPile = [];
        this.selectedCard = null;
        this.globalResources = { scrap: 10, medicine: 2, food: 5, water: 5 };
        this.moveHighlights = [];
    },

    toJSON() {
        return {
            seed: this.seed,
            turn: this.turn,
            phase: this.phase,
            units: this.units.map(u => u.toJSON()),
            enemies: this.enemies.map(e => e.toJSON()),
            globalResources: { ...this.globalResources },
            playerDeck: this.playerDeck.map(c => c.id),
            hand: this.hand.map(c => c.id),
            discardPile: this.discardPile.map(c => c.id)
        };
    }
};
