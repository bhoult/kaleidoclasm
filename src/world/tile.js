// Tile class for map grid
import * as THREE from 'three';
import { MAP, TERRAIN, COLORS } from '../config.js';

// Texture loader and cache
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

function getTexture(path) {
    if (!textureCache.has(path)) {
        const texture = textureLoader.load(path);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        textureCache.set(path, texture);
    }
    return textureCache.get(path);
}

export class Tile {
    constructor(x, y, elevation, moisture, radiationLevel = 0) {
        this.x = x;
        this.y = y;
        this.elevation = elevation;
        this.moisture = moisture;
        this.radiationLevel = radiationLevel;
        this.terrain = this.determineTerrain();
        this.isPassable = this.terrain.passable;
        this.movementCost = this.terrain.moveCost;
        this.contents = [];
        this.mesh = null;
        this.baseMaterial = null;
        this.glowMesh = null;
        this.props = [];
        this.hasBuilding = false;
        this.hasRoad = false;
        this.revealed = false;       // Fog of war state
        this.chunk = null;           // Reference to parent chunk
    }

    determineTerrain() {
        // Any significant radiation = toxic terrain
        if (this.radiationLevel > 0.2) {
            return TERRAIN.TOXIC;
        }

        // Water in low elevation + high moisture areas
        if (this.elevation < 0.15 && this.moisture > 0.6) {
            return TERRAIN.WATER;
        }

        // Mud near water (low elevation, moderate moisture)
        if (this.elevation < 0.25 && this.moisture > 0.45) {
            return TERRAIN.MUD;
        }

        // Sand in dry, low areas
        if (this.moisture < 0.25 && this.elevation < 0.35) {
            return TERRAIN.SAND;
        }

        // Grass in moderate moisture areas
        if (this.moisture > 0.35 && this.moisture < 0.6) {
            return TERRAIN.GRASS;
        }

        // Default to dirt
        return TERRAIN.DIRT;
    }

    // Set terrain type directly (used by props/roads)
    setTerrain(terrainType) {
        this.terrain = terrainType;
        this.isPassable = terrainType.passable;
        this.movementCost = terrainType.moveCost;
        this.radiationLevel = terrainType.radiation;

        // Update material if already created
        if (this.baseMaterial) {
            if (terrainType === TERRAIN.GRASS) {
                // Switch to grass texture
                const grassTexture = getTexture('images/tiles/grass.jpg');
                this.baseMaterial.map = grassTexture;
                this.baseMaterial.color.setHex(0xffffff);
                this.baseMaterial.needsUpdate = true;
            } else {
                // Switch to color
                this.baseMaterial.map = null;
                const baseColor = new THREE.Color(terrainType.color);
                const variation = (Math.random() - 0.5) * 0.08;
                baseColor.offsetHSL(0, 0, variation);
                this.baseMaterial.color = baseColor;
                this.baseMaterial.needsUpdate = true;
            }
        }
    }

    createMesh() {
        const geometry = new THREE.BoxGeometry(
            MAP.TILE_SIZE * 0.98,
            MAP.TILE_HEIGHT + this.elevation * 0.3,
            MAP.TILE_SIZE * 0.98
        );

        // Use texture for grass, color for other terrains
        if (this.terrain === TERRAIN.GRASS) {
            const grassTexture = getTexture('images/tiles/grass.jpg');
            this.baseMaterial = new THREE.MeshStandardMaterial({
                map: grassTexture,
                roughness: 0.85,
                metalness: 0.05
            });
        } else {
            // Add slight color variation for non-textured tiles
            const baseColor = new THREE.Color(this.terrain.color);
            const variation = (Math.random() - 0.5) * 0.08;
            baseColor.offsetHSL(0, 0, variation);

            this.baseMaterial = new THREE.MeshStandardMaterial({
                color: baseColor,
                roughness: this.terrain === TERRAIN.WATER ? 0.3 : 0.85,
                metalness: this.terrain === TERRAIN.WATER ? 0.2 : 0.05
            });
        }

        this.mesh = new THREE.Mesh(geometry, this.baseMaterial);
        this.mesh.position.set(
            this.x * MAP.TILE_SIZE,
            (MAP.TILE_HEIGHT + this.elevation * 0.3) / 2,
            this.y * MAP.TILE_SIZE
        );
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.tile = this;

        // Add radiation glow if toxic
        if (this.radiationLevel > 0.3 || this.terrain === TERRAIN.TOXIC) {
            this.addRadiationGlow();
        }

        return this.mesh;
    }

    // Reveal this tile (fog of war)
    reveal(scene, visibleMeshCache) {
        if (this.revealed) return;
        this.revealed = true;

        // Create mesh if it doesn't exist
        if (!this.mesh) {
            this.createMesh();
        }

        // Add to scene
        if (scene && this.mesh && !this.mesh.parent) {
            scene.add(this.mesh);
            if (this.glowMesh) {
                scene.add(this.glowMesh);
            }
        }

        // Add to visible mesh cache for raycasting
        if (visibleMeshCache && this.mesh) {
            visibleMeshCache.push(this.mesh);
        }
    }

    addRadiationGlow() {
        const glowGeometry = new THREE.BoxGeometry(
            MAP.TILE_SIZE * 0.99,
            0.05,
            MAP.TILE_SIZE * 0.99
        );
        const intensity = this.terrain === TERRAIN.TOXIC ? 0.5 : this.radiationLevel;
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.RADIATION_GLOW,
            transparent: true,
            opacity: intensity * 0.35
        });
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.position.set(
            this.x * MAP.TILE_SIZE,
            MAP.TILE_HEIGHT + this.elevation * 0.3 + 0.03,
            this.y * MAP.TILE_SIZE
        );
    }

    setHighlight(color) {
        if (this.baseMaterial) {
            this.baseMaterial.emissive.setHex(color);
            this.baseMaterial.emissiveIntensity = 0.3;
        }
    }

    clearHighlight() {
        if (this.baseMaterial) {
            this.baseMaterial.emissive.setHex(0x000000);
            this.baseMaterial.emissiveIntensity = 0;
        }
    }

    getUnit() {
        return this.contents.find(c => c.isUnit);
    }

    getEnemy() {
        return this.contents.find(c => c.isEnemy);
    }

    addContent(entity) {
        if (!this.contents.includes(entity)) {
            this.contents.push(entity);
        }
    }

    removeContent(entity) {
        const idx = this.contents.indexOf(entity);
        if (idx !== -1) {
            this.contents.splice(idx, 1);
        }
    }

    // For tooltip/UI display
    get biome() {
        return this.terrain;
    }

    // Dispose of GPU resources
    dispose(scene) {
        if (this.mesh) {
            if (scene) scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.baseMaterial) this.baseMaterial.dispose();
            this.mesh = null;
            this.baseMaterial = null;
        }
        if (this.glowMesh) {
            if (scene) scene.remove(this.glowMesh);
            if (this.glowMesh.geometry) this.glowMesh.geometry.dispose();
            if (this.glowMesh.material) this.glowMesh.material.dispose();
            this.glowMesh = null;
        }
        // Dispose props
        for (const prop of this.props) {
            if (scene) scene.remove(prop);
            prop.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                // Don't dispose shared materials from cachedMaterials
            });
        }
        this.props = [];
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
            elevation: this.elevation,
            moisture: this.moisture,
            radiationLevel: this.radiationLevel,
            terrain: this.terrain.name
        };
    }
}
