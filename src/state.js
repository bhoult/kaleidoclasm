// Central game state
import { PHASES, GAME } from './config.js';

export const GameState = {
    seed: Date.now(),
    turn: 1,
    phase: PHASES.ACTIONS,
    gameOver: false,
    victory: false,

    map: {
        seed: 0,
        chunks: new Map(),           // Map<"cx,cy", Chunk>
        tiles: new Map(),            // Map<"x,y", Tile> - sparse global storage
        revealedTiles: new Set(),    // Set<"x,y"> - tracks revealed tile positions
        visibleTileMeshes: []        // Cached array for raycasting
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

    // Interior/building state
    viewMode: 'outdoor',        // 'outdoor' or 'indoor'
    currentInterior: null,      // BuildingInterior instance when inside
    currentBuilding: null,      // Reference to outdoor building tile + return position
    interiorCache: new Map(),   // "x,y" -> BuildingInterior (cached generated interiors)
    unitsIndoors: new Map(),    // unitId -> BuildingInterior (tracks which units are indoors)

    // Methods
    reset() {
        this.seed = Date.now();
        this.turn = 1;
        this.phase = PHASES.ACTIONS;
        this.gameOver = false;
        this.victory = false;
        this.map.seed = 0;
        this.map.chunks.clear();
        this.map.tiles.clear();
        this.map.revealedTiles.clear();
        this.map.visibleTileMeshes = [];
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
        this.viewMode = 'outdoor';
        this.currentInterior = null;
        this.currentBuilding = null;
        this.interiorCache.clear();
        this.unitsIndoors.clear();
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
