// Combat resolution system
import { COMBAT } from '../config.js';

export function resolveCombat(attacker, defender) {
    if (!attacker || !defender) return null;

    // Check miss
    if (Math.random() < COMBAT.MISS_CHANCE) {
        return {
            hit: false,
            damage: 0,
            message: `${attacker.name} missed!`
        };
    }

    // Calculate damage
    const baseDamage = attacker.damage || COMBAT.BASE_DAMAGE;
    const variance = (Math.random() - 0.5) * 2 * COMBAT.DAMAGE_VARIANCE;
    const damage = Math.max(1, Math.round(baseDamage + variance));

    // Apply damage
    defender.takeDamage(damage);

    return {
        hit: true,
        damage,
        killed: defender.health <= 0,
        message: `${attacker.name} dealt ${damage} damage to ${defender.name}!`
    };
}

export function calculateHitChance(attacker, defender) {
    // Base hit chance
    let hitChance = 1 - COMBAT.MISS_CHANCE;

    // Could add modifiers based on:
    // - Distance
    // - Cover
    // - Status effects
    // - Equipment

    return Math.max(0.1, Math.min(0.95, hitChance));
}

export function calculateDamageRange(attacker) {
    const baseDamage = attacker.damage || COMBAT.BASE_DAMAGE;
    return {
        min: Math.max(1, baseDamage - COMBAT.DAMAGE_VARIANCE),
        max: baseDamage + COMBAT.DAMAGE_VARIANCE
    };
}

export function performAttack(unit, target) {
    if (!unit || !target) return false;

    // Check if target is in range
    const distance = Math.sqrt(
        Math.pow(unit.x - target.x, 2) +
        Math.pow(unit.y - target.y, 2)
    );

    if (distance > 1.5) { // Adjacent tiles only for melee
        return false;
    }

    // Cost AP
    if (unit.actionPoints < 1) {
        return false;
    }
    unit.actionPoints--;

    // Resolve combat
    const result = resolveCombat(unit, target);

    return result;
}
