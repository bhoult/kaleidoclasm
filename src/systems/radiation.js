// Radiation tracking and ARS effects
import { getTile } from '../world/map.js';
import { RADIATION } from '../config.js';

export function applyRadiation(unit) {
    const tile = getTile(unit.x, unit.y);
    if (!tile) return;

    if (tile.radiationLevel > 0) {
        const dose = tile.radiationLevel * RADIATION.DOSE_PER_TURN;
        unit.addRadiation(dose);
    }

    // Apply ARS effects
    applyARSEffects(unit);
}

function applyARSEffects(unit) {
    switch (unit.arsStage) {
        case 1: // Mild - slight stat reduction
            // No immediate effect, just tracking
            break;

        case 2: // Moderate - HP drain
            unit.takeDamage(5);
            break;

        case 3: // Severe - HP drain, reduced AP
            unit.takeDamage(10);
            if (unit.maxActionPoints > 1) {
                unit.maxActionPoints = Math.max(1, unit.maxActionPoints - 1);
            }
            break;

        case 4: // Critical - heavy HP drain
            unit.takeDamage(20);
            unit.maxActionPoints = 1;
            break;
    }
}

export function getARSDescription(stage) {
    const descriptions = {
        0: 'Healthy',
        1: 'Mild ARS - Nausea, fatigue',
        2: 'Moderate ARS - Weakness, hair loss',
        3: 'Severe ARS - Hemorrhaging, infections',
        4: 'Critical ARS - Organ failure imminent'
    };
    return descriptions[stage] || 'Unknown';
}

export function calculateRadiationRisk(tile) {
    if (!tile) return 0;
    return tile.radiationLevel * 100;
}
