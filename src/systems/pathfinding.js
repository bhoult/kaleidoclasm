// A* pathfinding implementation
import { getTile, getNeighbors } from '../world/map.js';
import { MAP, RADIATION } from '../config.js';

class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item, priority) {
        this.items.push({ item, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.items.shift()?.item;
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

function heuristic(a, b) {
    // Diagonal distance (Chebyshev)
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function isDiagonal(from, to) {
    return Math.abs(from.x - to.x) === 1 && Math.abs(from.y - to.y) === 1;
}

export function findPath(startTile, endTile) {
    if (!startTile || !endTile || !endTile.isPassable) {
        return null;
    }

    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${startTile.x},${startTile.y}`;
    const endKey = `${endTile.x},${endTile.y}`;

    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startTile, endTile));
    openSet.enqueue(startTile, fScore.get(startKey));

    const closedSet = new Set();

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();
        const currentKey = `${current.x},${current.y}`;

        if (currentKey === endKey) {
            // Reconstruct path
            const path = [current];
            let pathKey = currentKey;
            while (cameFrom.has(pathKey)) {
                const prev = cameFrom.get(pathKey);
                path.unshift(prev);
                pathKey = `${prev.x},${prev.y}`;
            }
            return path;
        }

        closedSet.add(currentKey);

        for (const neighbor of getNeighbors(current.x, current.y)) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;

            if (closedSet.has(neighborKey)) continue;

            // Movement cost (diagonal costs more)
            const moveCost = isDiagonal(current, neighbor)
                ? neighbor.movementCost * 1.4
                : neighbor.movementCost;

            const tentativeG = gScore.get(currentKey) + moveCost;

            if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                fScore.set(neighborKey, tentativeG + heuristic(neighbor, endTile));
                openSet.enqueue(neighbor, fScore.get(neighborKey));
            }
        }
    }

    return null; // No path found
}

export function getMovementRange(unit) {
    if (!unit || unit.actionPoints <= 0) return [];

    const startTile = getTile(unit.x, unit.y);
    if (!startTile) return [];

    const reachable = [];
    const visited = new Map();
    const queue = [{ tile: startTile, cost: 0 }];

    visited.set(`${startTile.x},${startTile.y}`, 0);

    while (queue.length > 0) {
        const { tile, cost } = queue.shift();

        for (const neighbor of getNeighbors(tile.x, tile.y)) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;

            // Check if tile is occupied by enemy
            if (neighbor.getEnemy()) continue;

            // Calculate movement cost
            const moveCost = isDiagonal(tile, neighbor)
                ? neighbor.movementCost * 1.4
                : neighbor.movementCost;

            const totalCost = cost + moveCost;

            // Check if within movement range (based on AP)
            const maxRange = unit.moveRange * unit.actionPoints;

            if (totalCost <= maxRange) {
                if (!visited.has(neighborKey) || visited.get(neighborKey) > totalCost) {
                    visited.set(neighborKey, totalCost);
                    queue.push({ tile: neighbor, cost: totalCost });

                    // Don't add start tile or tiles with friendly units
                    if (neighbor !== startTile && !neighbor.getUnit()) {
                        if (!reachable.includes(neighbor)) {
                            reachable.push(neighbor);
                        }
                    }
                }
            }
        }
    }

    return reachable;
}

export function getPathCost(path) {
    if (!path || path.length < 2) return 0;

    let cost = 0;
    for (let i = 1; i < path.length; i++) {
        const from = path[i - 1];
        const to = path[i];
        const moveCost = isDiagonal(from, to) ? to.movementCost * 1.4 : to.movementCost;
        cost += moveCost;
    }

    return cost;
}

export function moveUnit(unit, targetTile) {
    const startTile = getTile(unit.x, unit.y);
    const path = findPath(startTile, targetTile);

    if (!path || path.length < 2) return false;

    const cost = Math.ceil(getPathCost(path) / unit.moveRange);

    if (cost > unit.actionPoints) return false;

    // Apply radiation for passing through toxic tiles (half dose for passing through)
    for (let i = 1; i < path.length; i++) {
        const tile = path[i];
        if (tile.radiationLevel > 0) {
            const dose = tile.radiationLevel * RADIATION.DOSE_PER_TURN * 0.5;
            unit.addRadiation(dose);
        }
    }

    // Move unit
    return unit.moveTo(targetTile.x, targetTile.y, cost);
}

export function getAttackRange(unit, range = 1) {
    const inRange = [];
    const startTile = getTile(unit.x, unit.y);

    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            if (dx === 0 && dy === 0) continue;

            const tile = getTile(unit.x + dx, unit.y + dy);
            if (tile && tile.getEnemy()) {
                inRange.push(tile);
            }
        }
    }

    return inRange;
}
