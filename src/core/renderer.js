// Three.js renderer setup
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MAP, CAMERA } from '../config.js';

export let scene, camera, renderer, controls;
export let indoorScene = null;      // Separate scene for building interiors
export let activeScene = null;      // Currently active scene (outdoor or indoor)

// Camera positions for indoor/outdoor
let outdoorCameraState = null;      // Saved outdoor camera position/target

export function initRenderer() {
    const canvas = document.getElementById('game-canvas');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Orthographic camera for isometric view
    const aspect = window.innerWidth / window.innerHeight;
    const frustum = CAMERA.ZOOM;
    camera = new THREE.OrthographicCamera(
        -frustum * aspect,
        frustum * aspect,
        frustum,
        -frustum,
        0.1,
        1000
    );

    // Position camera for isometric view (centered at origin for chunk-based map)
    const centerX = 0;
    const centerZ = 0;
    camera.position.set(centerX + 20, 20, centerZ + 20);
    camera.lookAt(centerX, 0, centerZ);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Orbit controls (target at origin for chunk-based map)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minZoom = 0.5;
    controls.maxZoom = 3;
    controls.target.set(0, 0, 0);

    // Prevent camera from going below the landscape
    controls.minPolarAngle = 0.1;              // Prevent looking straight down
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below horizon

    controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    // Hemisphere light for better ambient
    const hemiLight = new THREE.HemisphereLight(0x606080, 0x404040, 0.4);
    scene.add(hemiLight);

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Set active scene to outdoor by default
    activeScene = scene;

    // Create indoor scene
    initIndoorScene();

    return { scene, camera, renderer, controls };
}

// Initialize the indoor scene
function initIndoorScene() {
    indoorScene = new THREE.Scene();
    indoorScene.background = new THREE.Color(0x0a0a0a);  // Darker background for indoors
}

// Switch to indoor scene for building interiors
export function switchToIndoorScene(interior) {
    // Save outdoor camera state and control settings
    outdoorCameraState = {
        position: camera.position.clone(),
        target: controls.target.clone(),
        zoom: camera.zoom,
        minPolarAngle: controls.minPolarAngle,
        maxPolarAngle: controls.maxPolarAngle
    };

    // Clear and prepare indoor scene
    clearIndoorScene();

    // Adjust camera for interior view - isometric angle looking at center
    const interiorWidth = interior.width * 0.5;  // INTERIOR_SCALE
    const interiorHeight = interior.height * 0.5;

    // Position camera for isometric view of interior (similar to outdoor but closer)
    camera.position.set(3, 4, 3);
    camera.zoom = 3.0;  // Zoom in for interior detail
    camera.updateProjectionMatrix();

    // Update controls for indoor view
    controls.target.set(0, 0, 0);
    controls.minPolarAngle = 0.3;  // Allow more overhead view
    controls.maxPolarAngle = Math.PI / 2.2;  // Still prevent going below ground
    controls.update();

    // Switch active scene
    activeScene = indoorScene;
}

// Switch back to outdoor scene
export function switchToOutdoorScene() {
    // Restore outdoor camera state and control settings
    if (outdoorCameraState) {
        camera.position.copy(outdoorCameraState.position);
        controls.target.copy(outdoorCameraState.target);
        camera.zoom = outdoorCameraState.zoom || 1;
        controls.minPolarAngle = outdoorCameraState.minPolarAngle || 0.1;
        controls.maxPolarAngle = outdoorCameraState.maxPolarAngle || Math.PI / 2 - 0.1;
        camera.updateProjectionMatrix();
        controls.update();
    }

    // Switch active scene
    activeScene = scene;
}

// Clear indoor scene objects
export function clearIndoorScene() {
    if (!indoorScene) return;

    while (indoorScene.children.length > 0) {
        const obj = indoorScene.children[0];
        indoorScene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else {
                obj.material.dispose();
            }
        }
    }
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustum = CAMERA.ZOOM;

    camera.left = -frustum * aspect;
    camera.right = frustum * aspect;
    camera.top = frustum;
    camera.bottom = -frustum;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function render() {
    renderer.render(activeScene || scene, camera);
}

export function addLights() {
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0x606080, 0x404040, 0.4);
    scene.add(hemiLight);
}

export function clearScene() {
    while (scene.children.length > 0) {
        const obj = scene.children[0];
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else {
                obj.material.dispose();
            }
        }
    }
}
