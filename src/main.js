import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { CONFIG } from './config/gameConfig.js';
import { updateLoadingProgress } from './utils/loaders.js';
import { AudioSystem } from './systems/audioSystem.js';
import { CameraSystem } from './systems/cameraSystem.js';
import { ControlsSystem } from './systems/controlsSystem.js';
import { ParticleSystem } from './systems/particleSystem.js';
import { SolarSystem } from './objects/solarSystem.js';
import { Shuttle } from './objects/shuttle.js';
import { EnemyShuttle } from './objects/enemyShuttle.js';
import { GUI } from './ui/gui.js';
import { Tooltips } from './ui/tooltips.js';

window.APP_STATE = {
  shuttleModel: null,
  enemyShuttleModels: [],
  planets: [],
  timeSpeed: 1.0,
};

window.DEBUG_ENEMY_ONCE = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,
  CONFIG.camera.aspect,
  CONFIG.camera.near,
  CONFIG.camera.far
);
camera.position.set(CONFIG.camera.position.x, CONFIG.camera.position.y, CONFIG.camera.position.z);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
composer.addPass(bloomPass);

const textureLoader = new THREE.TextureLoader();
textureLoader.load(
  CONFIG.environment.path, 
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
    scene.environment = texture;
    console.log("Environment map loaded.");
    updateLoadingProgress();
  },
  undefined,
  (error) => {
    console.warn("Failed to load environment texture:", error);
    updateLoadingProgress();
  }
);

const ambientLight = new THREE.AmbientLight(
  CONFIG.lights.ambient.color,
  CONFIG.lights.ambient.intensity
);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(
  CONFIG.lights.directional.color,
  CONFIG.lights.directional.intensity
);
directionalLight.position.set(CONFIG.lights.directional.position.x, CONFIG.lights.directional.position.y, CONFIG.lights.directional.position.z);
directionalLight.castShadow = true;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target.set(200, 10, -300);

const audioSystem = new AudioSystem();
window.audioSystem = audioSystem;
const cameraSystem = new CameraSystem(camera, orbitControls);
const controlsSystem = new ControlsSystem(cameraSystem, audioSystem);
const particleSystem = new ParticleSystem(scene, textureLoader, audioSystem);
window.particleSystem = particleSystem;
const solarSystem = new SolarSystem(scene, textureLoader, particleSystem);
const shuttle = new Shuttle(scene, particleSystem);

const enemyShuttles = [];
CONFIG.enemyModel.spawnPositions.forEach((position, index) => {
  const enemyShuttle = new EnemyShuttle(scene, position);
  enemyShuttles.push(enemyShuttle);
});
window.enemyShuttles = enemyShuttles;

const tooltips = new Tooltips();

window.APP_STATE.planets = solarSystem.getPlanets();

controlsSystem.showTooltip = (planet, x, y) => tooltips.show(planet, x, y, window.APP_STATE.shuttleModel);
controlsSystem.hideTooltip = () => tooltips.hide();

let gui;

window.initializeGUI = () => {
  if (!gui && window.APP_STATE.shuttleModel) {
    gui = new GUI(shuttle, cameraSystem, audioSystem, particleSystem, solarSystem, ambientLight, directionalLight, bloomPass);
  }
};

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  if (window.APP_STATE.shuttleModel) {
    controlsSystem.updateShuttleMovement(window.APP_STATE.shuttleModel);
    cameraSystem.updateCameraMode();
    cameraSystem.updateSmoothTransition();
    cameraSystem.updateChase(window.APP_STATE.shuttleModel);
    particleSystem.updateLasers(deltaTime);
    particleSystem.updateThrusterParticles(deltaTime, window.APP_STATE.shuttleModel, controlsSystem.isThrusterActive());
    
    if (controlsSystem.checkLaserFire()) {
      particleSystem.fireLaser(window.APP_STATE.shuttleModel);
    }
    
    if (cameraSystem.state.mode === "orbit" && !cameraSystem.state.transitioning) {
      if (cameraSystem.state.focusMode) {
        cameraSystem.updateFocus();
      } else {
        orbitControls.target.lerp(window.APP_STATE.shuttleModel.position, 0.1);
      }
    }
  }
  
  if (window.APP_STATE.enemyShuttleModel && window.DEBUG_ENEMY_ONCE) {
    console.log("Enemy shuttle in animate loop:", window.APP_STATE.enemyShuttleModel.position.x, window.APP_STATE.enemyShuttleModel.position.y, window.APP_STATE.enemyShuttleModel.position.z);
    console.log("Enemy shuttle visible:", window.APP_STATE.enemyShuttleModel.visible);
    console.log("Enemy shuttle in scene:", scene.children.includes(window.APP_STATE.enemyShuttleModel));
    console.log("Camera position:", camera.position.x, camera.position.y, camera.position.z);
    console.log("Distance from camera to enemy:", camera.position.distanceTo(window.APP_STATE.enemyShuttleModel.position));
    window.DEBUG_ENEMY_ONCE = false;
  }

  solarSystem.update();

  if (window.enemyShuttles) {
    window.enemyShuttles.forEach(enemyShuttle => {
      if (!enemyShuttle.getIsDestroyed()) {
        enemyShuttle.update(deltaTime);
        if (enemyShuttle.getModel() && !window.APP_STATE.enemyShuttleModels.includes(enemyShuttle.getModel())) {
          window.APP_STATE.enemyShuttleModels.push(enemyShuttle.getModel());
        }
      }
    });
  }

  if (cameraSystem.state.mode === "orbit" && !cameraSystem.state.transitioning) {
    orbitControls.update();
  }

  composer.render();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

animate();