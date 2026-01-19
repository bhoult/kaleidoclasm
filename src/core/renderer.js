// Three.js renderer setup
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MAP, CAMERA } from '../config.js';

export let scene, camera, renderer, controls;

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

    return { scene, camera, renderer, controls };
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
    renderer.render(scene, camera);
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
