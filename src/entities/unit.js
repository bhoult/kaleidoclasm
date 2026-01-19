// Survivor unit class
import * as THREE from 'three';
import { scene } from '../core/renderer.js';
import { GameState } from '../state.js';
import { getTile } from '../world/map.js';
import { UNIT, COLORS, MAP, GAME, RADIATION } from '../config.js';
import { updateVisibility } from '../systems/fogOfWar.js';

let unitIdCounter = 0;

export class Unit {
    constructor(x, y, name = 'Survivor') {
        this.id = ++unitIdCounter;
        this.name = name;
        this.x = x;
        this.y = y;
        this.isUnit = true;

        // Stats
        this.health = UNIT.MAX_HEALTH;
        this.maxHealth = UNIT.MAX_HEALTH;
        this.stamina = 100;
        this.radiationDose = 0;
        this.arsStage = 0;
        this.hydration = UNIT.MAX_HYDRATION;
        this.nutrition = UNIT.MAX_NUTRITION;

        // Action points
        this.actionPoints = GAME.STARTING_AP;
        this.maxActionPoints = GAME.STARTING_AP;
        this.moveRange = UNIT.BASE_MOVE_RANGE;

        // Gear and skills
        this.skills = [];
        this.gear = [];

        // Visual
        this.mesh = null;
        this.selectionRing = null;
        this.isSelected = false;

        // Animation
        this.targetPosition = null;
        this.animating = false;

        this.createMesh();
        this.updateTilePosition();
    }

    createMesh() {
        // Body (capsule-like shape)
        const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.PLAYER_UNIT,
            roughness: 0.6,
            metalness: 0.2
        });
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        const headMesh = new THREE.Mesh(headGeometry, bodyMaterial);
        headMesh.position.y = 0.35;
        this.mesh.add(headMesh);

        // Position
        const tile = getTile(this.x, this.y);
        const elevation = tile ? tile.elevation : 0;
        this.mesh.position.set(
            this.x * MAP.TILE_SIZE,
            MAP.TILE_HEIGHT + elevation * 0.3 + 0.35,
            this.y * MAP.TILE_SIZE
        );
        this.mesh.castShadow = true;

        // Selection ring
        const ringGeometry = new THREE.RingGeometry(0.25, 0.35, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.selectionRing.rotation.x = -Math.PI / 2;
        this.selectionRing.position.y = -0.3;
        this.mesh.add(this.selectionRing);

        scene.add(this.mesh);
    }

    updateTilePosition() {
        // Update tile contents
        const oldTile = getTile(this.x, this.y);
        const newTile = getTile(this.x, this.y);

        if (oldTile) {
            oldTile.removeContent(this);
        }
        if (newTile) {
            newTile.addContent(this);
        }

        this.currentTile = newTile;
    }

    // Update mesh position to match current x,y coordinates
    updateMeshPosition() {
        if (!this.mesh) return;

        const tile = getTile(this.x, this.y);
        const elevation = tile ? tile.elevation : 0;

        this.mesh.position.set(
            this.x * MAP.TILE_SIZE,
            MAP.TILE_HEIGHT + elevation * 0.3 + 0.35,
            this.y * MAP.TILE_SIZE
        );
    }

    setSelected(selected) {
        this.isSelected = selected;
        if (this.selectionRing) {
            this.selectionRing.material.opacity = selected ? 0.8 : 0;
        }
    }

    moveTo(targetX, targetY, cost = 1) {
        if (this.actionPoints < cost) return false;

        // Remove from old tile
        const oldTile = getTile(this.x, this.y);
        if (oldTile) {
            oldTile.removeContent(this);
        }

        // Update position
        this.x = targetX;
        this.y = targetY;
        this.actionPoints -= cost;

        // Add to new tile
        const newTile = getTile(this.x, this.y);
        if (newTile) {
            newTile.addContent(this);
            this.currentTile = newTile;
        }

        // Animate
        const elevation = newTile ? newTile.elevation : 0;
        this.targetPosition = new THREE.Vector3(
            targetX * MAP.TILE_SIZE,
            MAP.TILE_HEIGHT + elevation * 0.3 + 0.35,
            targetY * MAP.TILE_SIZE
        );
        this.animating = true;

        // Reveal tiles around new position (fog of war)
        updateVisibility(this);

        return true;
    }

    updateAnimation() {
        if (!this.animating || !this.targetPosition) return;

        const speed = 0.15;
        this.mesh.position.lerp(this.targetPosition, speed);

        if (this.mesh.position.distanceTo(this.targetPosition) < 0.01) {
            this.mesh.position.copy(this.targetPosition);
            this.animating = false;
            this.targetPosition = null;
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addRadiation(dose) {
        this.radiationDose = Math.min(UNIT.MAX_RADIATION, this.radiationDose + dose);
        this.updateARSStage();
    }

    updateARSStage() {
        if (this.radiationDose >= RADIATION.ARS_THRESHOLD_4) {
            this.arsStage = 4;
        } else if (this.radiationDose >= RADIATION.ARS_THRESHOLD_3) {
            this.arsStage = 3;
        } else if (this.radiationDose >= RADIATION.ARS_THRESHOLD_2) {
            this.arsStage = 2;
        } else if (this.radiationDose >= RADIATION.ARS_THRESHOLD_1) {
            this.arsStage = 1;
        } else {
            this.arsStage = 0;
        }
    }

    resetAP() {
        this.actionPoints = this.maxActionPoints;
    }

    die() {
        // Remove from game
        const idx = GameState.units.indexOf(this);
        if (idx !== -1) {
            GameState.units.splice(idx, 1);
        }

        // Remove from tile
        if (this.currentTile) {
            this.currentTile.removeContent(this);
        }

        // Remove mesh
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

        // Deselect if selected
        if (GameState.selectedUnit === this) {
            GameState.selectedUnit = null;
        }
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            health: this.health,
            actionPoints: this.actionPoints,
            radiationDose: this.radiationDose,
            hydration: this.hydration,
            nutrition: this.nutrition
        };
    }
}

export function createStartingUnits() {
    const names = ['Alex', 'Jordan', 'Casey'];
    // Start near origin (0,0) for predictable initial chunks
    const startPositions = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 }
    ];

    for (let i = 0; i < GAME.STARTING_UNITS; i++) {
        const pos = startPositions[i];
        const unit = new Unit(pos.x, pos.y, names[i]);
        GameState.units.push(unit);
    }
}
