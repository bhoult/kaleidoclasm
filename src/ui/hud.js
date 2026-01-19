// DOM HUD management
import { GameState } from '../state.js';
import { UNIT } from '../config.js';

export function initHUD() {
    updateHUD();
}

export function updateHUD() {
    // Update resources
    document.getElementById('scrap-count').textContent = GameState.globalResources.scrap;
    document.getElementById('medicine-count').textContent = GameState.globalResources.medicine;
    document.getElementById('food-count').textContent = GameState.globalResources.food;
    document.getElementById('water-count').textContent = GameState.globalResources.water;

    // Update location indicator
    updateLocationIndicator();
}

// Show/hide indoor location indicator
function updateLocationIndicator() {
    let indicator = document.getElementById('location-indicator');

    // Create indicator if it doesn't exist
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'location-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #8cf;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 0.9em;
            border: 1px solid #4a6a8a;
        `;
        document.getElementById('game-container').appendChild(indicator);
    }

    if (GameState.viewMode === 'indoor' && GameState.currentInterior) {
        indicator.style.display = 'block';
        indicator.textContent = `Inside: ${GameState.currentInterior.buildingType}`;
    } else {
        indicator.style.display = 'none';
    }
}

export function updateUnitInfo(unit) {
    const unitInfo = document.getElementById('unit-info');

    if (!unit) {
        unitInfo.classList.add('hidden');
        return;
    }

    unitInfo.classList.remove('hidden');

    // Name
    document.getElementById('unit-name').textContent = unit.name;

    // Health bar
    const healthPercent = (unit.health / unit.maxHealth) * 100;
    document.getElementById('health-bar').style.width = `${healthPercent}%`;
    document.getElementById('health-text').textContent = `${unit.health}/${unit.maxHealth}`;

    // AP bar
    const apPercent = (unit.actionPoints / unit.maxActionPoints) * 100;
    document.getElementById('ap-bar').style.width = `${apPercent}%`;
    document.getElementById('ap-text').textContent = `${unit.actionPoints}/${unit.maxActionPoints}`;

    // Radiation bar
    const radPercent = (unit.radiationDose / UNIT.MAX_RADIATION) * 100;
    document.getElementById('rad-bar').style.width = `${radPercent}%`;
    document.getElementById('rad-text').textContent = `${Math.round(unit.radiationDose)}/${UNIT.MAX_RADIATION}`;

    // Hydration bar
    const hydrationPercent = (unit.hydration / UNIT.MAX_HYDRATION) * 100;
    document.getElementById('hydration-bar').style.width = `${hydrationPercent}%`;
    document.getElementById('hydration-text').textContent = `${Math.round(unit.hydration)}/${UNIT.MAX_HYDRATION}`;

    // Nutrition bar
    const nutritionPercent = (unit.nutrition / UNIT.MAX_NUTRITION) * 100;
    document.getElementById('nutrition-bar').style.width = `${nutritionPercent}%`;
    document.getElementById('nutrition-text').textContent = `${Math.round(unit.nutrition)}/${UNIT.MAX_NUTRITION}`;
}

export function showMessage(text, duration = 2000) {
    // Create temporary message
    const msg = document.createElement('div');
    msg.className = 'game-message';
    msg.textContent = text;
    msg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 20px 40px;
        border-radius: 8px;
        font-size: 1.2em;
        z-index: 150;
        animation: fadeInOut ${duration}ms ease-in-out;
    `;

    document.getElementById('game-container').appendChild(msg);

    setTimeout(() => {
        msg.remove();
    }, duration);
}
