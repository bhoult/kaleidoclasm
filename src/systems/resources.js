// Resource management - hydration, nutrition, survival
import { GameState } from '../state.js';
import { UNIT } from '../config.js';

export function consumeResources() {
    for (const unit of GameState.units) {
        // Decrease hydration
        unit.hydration = Math.max(0, unit.hydration - UNIT.HYDRATION_DECAY);

        // Decrease nutrition
        unit.nutrition = Math.max(0, unit.nutrition - UNIT.NUTRITION_DECAY);

        // Apply starvation/dehydration effects
        if (unit.hydration <= 0) {
            unit.takeDamage(10);
        } else if (unit.hydration < 20) {
            unit.takeDamage(3);
        }

        if (unit.nutrition <= 0) {
            unit.takeDamage(5);
        } else if (unit.nutrition < 20) {
            unit.takeDamage(2);
        }
    }
}

export function useWater(unit) {
    if (GameState.globalResources.water > 0) {
        GameState.globalResources.water--;
        unit.hydration = Math.min(UNIT.MAX_HYDRATION, unit.hydration + 30);
        return true;
    }
    return false;
}

export function useFood(unit) {
    if (GameState.globalResources.food > 0) {
        GameState.globalResources.food--;
        unit.nutrition = Math.min(UNIT.MAX_NUTRITION, unit.nutrition + 25);
        return true;
    }
    return false;
}

export function useMedicine(unit) {
    if (GameState.globalResources.medicine > 0) {
        GameState.globalResources.medicine--;
        unit.heal(40);
        return true;
    }
    return false;
}

export function addResources(type, amount) {
    if (GameState.globalResources.hasOwnProperty(type)) {
        GameState.globalResources[type] += amount;
    }
}

export function getResourceStatus() {
    const { scrap, medicine, food, water } = GameState.globalResources;
    const warnings = [];

    if (water < 3) warnings.push('Water supplies critical!');
    if (food < 3) warnings.push('Food supplies low!');
    if (medicine === 0) warnings.push('No medicine remaining!');

    return {
        resources: GameState.globalResources,
        warnings
    };
}
