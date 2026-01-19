// Game configuration constants

export const MAP = {
    WIDTH: 20,
    HEIGHT: 20,
    TILE_SIZE: 1,
    TILE_HEIGHT: 0.3
};

export const CAMERA = {
    ZOOM: 15,
    ANGLE: Math.PI / 4,  // 45 degrees
    MIN_ZOOM: 8,
    MAX_ZOOM: 30
};

export const GAME = {
    MAX_TURNS: 30,
    STARTING_UNITS: 3,
    STARTING_AP: 3,
    AP_PER_TURN: 3
};

export const UNIT = {
    MAX_HEALTH: 100,
    MAX_HYDRATION: 100,
    MAX_NUTRITION: 100,
    MAX_RADIATION: 100,
    BASE_MOVE_RANGE: 3,
    HYDRATION_DECAY: 5,
    NUTRITION_DECAY: 3
};

export const RADIATION = {
    DOSE_PER_TURN: 10,
    ARS_THRESHOLD_1: 25,  // Mild symptoms
    ARS_THRESHOLD_2: 50,  // Moderate
    ARS_THRESHOLD_3: 75,  // Severe
    ARS_THRESHOLD_4: 100  // Critical
};

export const COMBAT = {
    BASE_DAMAGE: 20,
    DAMAGE_VARIANCE: 10,
    MISS_CHANCE: 0.1
};

export const TERRAIN = {
    GRASS: { name: 'Grass', color: 0x4a6b3a, moveCost: 1, radiation: 0, passable: true },
    DIRT: { name: 'Dirt', color: 0x8b7355, moveCost: 1, radiation: 0, passable: true },
    MUD: { name: 'Mud', color: 0x5c4a3a, moveCost: 1.5, radiation: 0, passable: true },
    SAND: { name: 'Sand', color: 0xc2a86b, moveCost: 1.2, radiation: 0, passable: true },
    PAVEMENT: { name: 'Pavement', color: 0x4a4a4a, moveCost: 0.8, radiation: 0, passable: true },
    CONCRETE: { name: 'Concrete', color: 0x6a6a6a, moveCost: 0.8, radiation: 0, passable: true },
    TOXIC: { name: 'Toxic', color: 0x3a5a2a, moveCost: 1.5, radiation: 0.5, passable: true },
    WATER: { name: 'Water', color: 0x2a4a5a, moveCost: 3, radiation: 0, passable: false },
    RUBBLE: { name: 'Rubble', color: 0x5a5a5a, moveCost: 2, radiation: 0, passable: true }
};

// Legacy biomes for compatibility
export const BIOMES = {
    WASTELAND: { name: 'Wasteland', color: 0x8b7355, moveCost: 1, radChance: 0.1 },
    RUINS: { name: 'Ruins', color: 0x555555, moveCost: 1.5, radChance: 0.2 },
    FOREST: { name: 'Dead Forest', color: 0x3d5c3d, moveCost: 1.5, radChance: 0.05 },
    TOXIC: { name: 'Toxic Zone', color: 0x4a7a3d, moveCost: 2, radChance: 0.8 }
};

export const COLORS = {
    TILE_HOVER: 0x88ff88,
    TILE_SELECTED: 0xffff88,
    MOVE_RANGE: 0x4488ff,
    ATTACK_RANGE: 0xff4444,
    RADIATION_GLOW: 0x44ff44,
    PLAYER_UNIT: 0x4488ff,
    ENEMY_UNIT: 0xff4444
};

export const CARD_TYPES = {
    ACTION: 'action',
    SKILL: 'skill',
    ITEM: 'item',
    EVENT: 'event'
};

export const PHASES = {
    EVENT_DRAW: 'EVENT_DRAW',
    PLAYER_HAND: 'PLAYER_HAND',
    ACTIONS: 'ACTIONS',
    END_PHASE: 'END_PHASE'
};
