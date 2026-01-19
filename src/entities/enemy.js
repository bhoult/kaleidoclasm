// Enemy AI and behavior
import * as THREE from 'three';
import { scene } from '../core/renderer.js';
import { GameState } from '../state.js';
import { getTile, getNeighbors } from '../world/map.js';
import { findPath } from '../systems/pathfinding.js';
import { resolveCombat } from '../systems/combat.js';
import { COLORS, MAP, COMBAT } from '../config.js';

let enemyIdCounter = 0;

const AI_STATES = {
    PATROL: 'PATROL',
    CHASE: 'CHASE',
    ATTACK: 'ATTACK',
    FLEE: 'FLEE'
};

export class Enemy {
    constructor(x, y, type = 'Raider') {
        this.id = ++enemyIdCounter;
        this.name = type;
        this.x = x;
        this.y = y;
        this.isEnemy = true;

        // Stats
        this.health = 60;
        this.maxHealth = 60;
        this.damage = COMBAT.BASE_DAMAGE;
        this.moveRange = 2;
        this.attackRange = 1;
        this.sightRange = 6;

        // AI state
        this.aiState = AI_STATES.PATROL;
        this.targetUnit = null;
        this.patrolTarget = null;

        // Visual
        this.mesh = null;
        this.targetPosition = null;
        this.animating = false;

        this.createMesh();
        this.updateTilePosition();
    }

    createMesh() {
        // Menacing enemy shape
        const bodyGeometry = new THREE.ConeGeometry(0.2, 0.5, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.ENEMY_UNIT,
            roughness: 0.5,
            metalness: 0.3
        });
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Position
        const tile = getTile(this.x, this.y);
        const elevation = tile ? tile.elevation : 0;
        this.mesh.position.set(
            this.x * MAP.TILE_SIZE,
            MAP.TILE_HEIGHT + elevation * 0.3 + 0.35,
            this.y * MAP.TILE_SIZE
        );
        this.mesh.castShadow = true;

        scene.add(this.mesh);
    }

    updateTilePosition() {
        const tile = getTile(this.x, this.y);
        if (tile) {
            tile.addContent(this);
        }
        this.currentTile = tile;
    }

    update() {
        // Find nearest player unit
        this.targetUnit = this.findNearestUnit();

        if (!this.targetUnit) {
            this.aiState = AI_STATES.PATROL;
        } else {
            const distance = this.distanceTo(this.targetUnit);

            if (this.health < this.maxHealth * 0.2) {
                this.aiState = AI_STATES.FLEE;
            } else if (distance <= this.attackRange) {
                this.aiState = AI_STATES.ATTACK;
            } else if (distance <= this.sightRange) {
                this.aiState = AI_STATES.CHASE;
            } else {
                this.aiState = AI_STATES.PATROL;
            }
        }

        // Execute behavior
        switch (this.aiState) {
            case AI_STATES.PATROL:
                this.patrol();
                break;
            case AI_STATES.CHASE:
                this.chase();
                break;
            case AI_STATES.ATTACK:
                this.attack();
                break;
            case AI_STATES.FLEE:
                this.flee();
                break;
        }
    }

    findNearestUnit() {
        let nearest = null;
        let nearestDist = Infinity;

        for (const unit of GameState.units) {
            const dist = this.distanceTo(unit);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = unit;
            }
        }

        return nearest;
    }

    distanceTo(entity) {
        return Math.sqrt(
            Math.pow(this.x - entity.x, 2) +
            Math.pow(this.y - entity.y, 2)
        );
    }

    patrol() {
        // Random movement
        if (!this.patrolTarget || Math.random() < 0.3) {
            const neighbors = getNeighbors(this.x, this.y);
            if (neighbors.length > 0) {
                this.patrolTarget = neighbors[Math.floor(Math.random() * neighbors.length)];
            }
        }

        if (this.patrolTarget) {
            this.moveToward(this.patrolTarget.x, this.patrolTarget.y);
            this.patrolTarget = null;
        }
    }

    chase() {
        if (!this.targetUnit) return;

        // Path toward target
        this.moveToward(this.targetUnit.x, this.targetUnit.y);
    }

    attack() {
        if (!this.targetUnit) return;

        // Deal damage
        resolveCombat(this, this.targetUnit);
    }

    flee() {
        if (!this.targetUnit) return;

        // Move away from target
        const dx = this.x - this.targetUnit.x;
        const dy = this.y - this.targetUnit.y;

        const targetX = this.x + Math.sign(dx);
        const targetY = this.y + Math.sign(dy);

        const tile = getTile(targetX, targetY);
        if (tile && tile.isPassable && !tile.getUnit() && !tile.getEnemy()) {
            this.moveTo(targetX, targetY);
        }
    }

    moveToward(targetX, targetY) {
        const startTile = getTile(this.x, this.y);
        const endTile = getTile(targetX, targetY);

        if (!startTile || !endTile) return;

        const path = findPath(startTile, endTile);
        if (path && path.length > 1) {
            // Move up to moveRange tiles
            const steps = Math.min(this.moveRange, path.length - 1);
            const destination = path[steps];

            // Don't move onto player units
            if (!destination.getUnit()) {
                this.moveTo(destination.x, destination.y);
            }
        }
    }

    moveTo(targetX, targetY) {
        // Remove from old tile
        const oldTile = getTile(this.x, this.y);
        if (oldTile) {
            oldTile.removeContent(this);
        }

        // Update position
        this.x = targetX;
        this.y = targetY;

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
    }

    updateAnimation() {
        if (!this.animating || !this.targetPosition) return;

        const speed = 0.1;
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

    die() {
        // Remove from game
        const idx = GameState.enemies.indexOf(this);
        if (idx !== -1) {
            GameState.enemies.splice(idx, 1);
        }

        // Remove from tile
        if (this.currentTile) {
            this.currentTile.removeContent(this);
        }

        // Remove mesh
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

        // Drop loot
        GameState.globalResources.scrap += Math.floor(Math.random() * 5) + 1;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            health: this.health
        };
    }
}

export function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        // Find valid spawn location (away from player units)
        let attempts = 0;
        while (attempts < 50) {
            const x = Math.floor(Math.random() * MAP.WIDTH);
            const y = Math.floor(Math.random() * MAP.HEIGHT);
            const tile = getTile(x, y);

            if (tile && tile.isPassable && !tile.getUnit() && !tile.getEnemy()) {
                // Check distance from player units
                let tooClose = false;
                for (const unit of GameState.units) {
                    const dist = Math.sqrt(
                        Math.pow(x - unit.x, 2) + Math.pow(y - unit.y, 2)
                    );
                    if (dist < 8) {
                        tooClose = true;
                        break;
                    }
                }

                if (!tooClose) {
                    const enemy = new Enemy(x, y);
                    GameState.enemies.push(enemy);
                    break;
                }
            }
            attempts++;
        }
    }
}

export function updateEnemies() {
    for (const enemy of [...GameState.enemies]) {
        enemy.update();
    }
}
