import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
// =================================================================
// CONFIGURATION
// =================================================================
const CONFIG = {
  camera: {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 2000,
    position: new THREE.Vector3(200, 15, -270),
    chaseDistance: 30,
    chaseHeight: 10,
    chaseDamping: 0.08,
    orbitTimeoutMs: 3000,
    transitionSpeed: 0.05,
  },
  lights: {
    ambient: { color: 0xffffff, intensity: 0.3 },
    directional: {
      color: 0xffffff,
      intensity: 2,
      position: new THREE.Vector3(10, 20, 5),
    },
  },
  environment: {
    path: "/textures/space-panorama.png",
  },
  audio: {
    ambientPath: "/sounds/space-ambient.mp3",
    engineStartPath: "/sounds/shuttle-engine-start.mp3",
    engineStopPath: "/sounds/shuttle-engine-stop.mp3",
    laserShootPath: "/sounds/laser-shoot.mp3",
    ambientVolume: 0.3, // 30% volume by default
    engineVolume: 0.4, // 40% volume for engine sounds
    laserVolume: 0.6, // 60% volume for laser sounds
    fadeInDuration: 2000, // 2 seconds fade in
    engineFadeDuration: 500, // 0.5 seconds for engine transitions
  },
  model: {
    path: "/models/star-wars-shuttle.glb",
    scale: 0.0025,
    position: new THREE.Vector3(200, 10, -300),
  },
  flight: {
    thrust: 0.003,
    maxVelocity: 0.2,
    velocityDamping: 0.985,
    rotationSpeed: 0.002,
    rollSpeed: 0.001,
    rotationDamping: 0.92,
  },
  // --- NEW: Laser configuration ---
  lasers: {
    speed: 1.5,
    color: 0x00ff00, // Bright green
    maxLength: 100,
    fireRate: 250,
    particleCount: 20, // How many particles per laser bolt
    particleSize: 0.2, // The size of each particle
  },
  thrusterEffect: {
    baseColor: 0x4488ff, // Professional blue engine color
    particleCount: 100,
    particleLife: 1.8, // seconds
    particleSpeed: 3.0,
    particleSize: 1.0,
    spread: 0.15,
    engineOffset: -5, // Much closer to shuttle
  },
};

// =================================================================
// LOADING AND UI STATE
// =================================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredPlanet = null;

// =================================================================
// PLANET INTERACTION FUNCTIONS
// =================================================================
function handlePlanetClick(event) {
  // Handle audio user interaction requirement
  if (!APP_STATE.audio.userInteracted) {
    APP_STATE.audio.userInteracted = true;
    startAmbientSound();
  }
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(APP_STATE.planets);
  
  if (intersects.length > 0) {
    const planet = intersects[0].object;
    if (planet.userData && planet.userData.name) {
      focusOnPlanet(planet);
    }
  } else {
    // Clicked on empty space - exit focus mode
    exitFocusMode();
  }
}

function exitFocusMode() {
  if (APP_STATE.cameraState.focusMode) {
    APP_STATE.cameraState.focusMode = false;
    APP_STATE.cameraState.focusedPlanet = null;
  }
}

function focusOnPlanet(planet) {
  // Switch to orbit mode if in chase mode
  if (APP_STATE.cameraState.mode === "chase") {
    switchToOrbitCam();
  }
  
  // Set focus mode and focused planet
  APP_STATE.cameraState.focusMode = true;
  APP_STATE.cameraState.focusedPlanet = planet;
  
  // Calculate optimal camera distance based on planet size
  let optimalDistance;
  if (planet.userData.name === "Sun") {
    optimalDistance = planet.userData.size * 3; // Better distance for sun viewing
  } else if (planet.userData.name === "Moon") {
    optimalDistance = Math.max(planet.userData.size * 15, 25); // Ensure minimum distance for moon
  } else {
    optimalDistance = planet.userData.size * 8; // Better distance for planets
  }
  
  const worldPosition = new THREE.Vector3();
  planet.getWorldPosition(worldPosition);

  console.log(`Focusing on ${planet.userData.name}:`);
  console.log(`  Size: ${planet.userData.size}`);
  console.log(`  Optimal distance: ${optimalDistance}`);
  console.log(`  World position:`, worldPosition);

  // Calculate camera position with better angles
  const cameraPosition = worldPosition.clone();
  const angle = Math.PI / 6; // 30 degrees above horizon
  cameraPosition.x += Math.cos(angle) * optimalDistance;
  cameraPosition.y += Math.sin(angle) * optimalDistance;
  cameraPosition.z += optimalDistance * 0.5;
  
  console.log(`  Camera position:`, cameraPosition);
  
  // Smooth camera transition
  animateCameraTo(cameraPosition, worldPosition);
}

function animateCameraTo(targetPosition, targetLookAt) {
  const startPosition = camera.position.clone();
  const startLookAt = orbitControls.target.clone();
  
  let progress = 0;
  const duration = 2000; // 2 seconds
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    progress = Math.min(elapsed / duration, 1);
    
    // Smooth easing function
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    // Interpolate camera position
    camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
    
    // Interpolate look-at target
    orbitControls.target.lerpVectors(startLookAt, targetLookAt, easedProgress);
    orbitControls.update();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

// =================================================================
// TOOLTIP FUNCTIONS
// =================================================================
function updateTooltip(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(APP_STATE.planets);
  
  const tooltip = document.getElementById('planet-tooltip');
  
  if (intersects.length > 0) {
    const planet = intersects[0].object;
    if (planet.userData && planet.userData.name) {
      showTooltip(planet, event.clientX, event.clientY);
      hoveredPlanet = planet;
    }
  } else {
    hideTooltip();
    hoveredPlanet = null;
  }
}

function showTooltip(planet, x, y) {
  const tooltip = document.getElementById('planet-tooltip');
  const nameEl = document.getElementById('planet-name');
  const infoEl = document.getElementById('planet-info');
  const distanceEl = document.getElementById('planet-distance');
  
  if (APP_STATE.shuttleModel) {
    const distance = planet.position.distanceTo(APP_STATE.shuttleModel.position);
    distanceEl.textContent = `Distance from shuttle: ${distance.toFixed(1)} units`;
  } else {
    distanceEl.textContent = `Distance from center: ${planet.userData.distance} units`;
  }
  
  nameEl.textContent = planet.userData.name;
  infoEl.textContent = planet.userData.info;
  
  tooltip.style.left = x + 'px';
  tooltip.style.top = (y - 10) + 'px';
  tooltip.classList.remove('hidden');
}

function hideTooltip() {
  const tooltip = document.getElementById('planet-tooltip');
  tooltip.classList.add('hidden');
}

// =================================================================
// LOADING AND UI STATE
// =================================================================
let assetsLoaded = 0;
const totalAssets = 19; // Approximate count of textures + models + audio files

function updateLoadingProgress() {
  assetsLoaded++;
  if (assetsLoaded >= totalAssets) {
    hideLoadingScreen();
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
}

function toggleControlsHelp() {
  const helpOverlay = document.getElementById('controls-help');
  if (helpOverlay) {
    helpOverlay.classList.toggle('hidden');
  }
}

// =================================================================
// APPLICATION STATE
// =================================================================
const APP_STATE = {
  shuttleModel: null,
  planets: [],
  keyboard: {},
  shuttleControls: {
    velocity: new THREE.Vector3(),
    rotation: new THREE.Vector3(),
  },
  cameraState: {
    mode: "orbit",
    lastInputTime: 0,
    focusedPlanet: null,
    focusMode: false,
    transitioning: false,
    transitionStartTime: 0,
    transitionDuration: 1500, // 1.5 seconds for smooth transitions
  },
  // --- NEW: Laser state ---
  lasers: [],
  laserHardpoints: [],
  lastFireTime: 0,
  // --- NEW: Thruster particles ---
  thrusterParticles: null,
  thrusterPositions: [],
  thrusterVelocities: [],
  thrusterLife: [],
  timeSpeed: 1.0,
  // --- NEW: Audio state ---
  audio: {
    ambientSound: null,
    engineStartSound: null,
    engineStopSound: null,
    laserShootSound: null,
    isAmbientPlaying: false,
    isEngineRunning: false,
    userInteracted: false,
    engineFadeTimeout: null,
  },
};

// =================================================================
// AUDIO SYSTEM
// =================================================================

function initializeAudio() {
  // Create ambient audio element
  APP_STATE.audio.ambientSound = new Audio(CONFIG.audio.ambientPath);
  APP_STATE.audio.ambientSound.loop = true;
  APP_STATE.audio.ambientSound.volume = 0; // Start silent for fade in
  APP_STATE.audio.ambientSound.preload = 'auto';
  
  // Create engine start audio element
  APP_STATE.audio.engineStartSound = new Audio(CONFIG.audio.engineStartPath);
  APP_STATE.audio.engineStartSound.loop = true;
  APP_STATE.audio.engineStartSound.volume = 0; // Start silent for fade in
  APP_STATE.audio.engineStartSound.preload = 'auto';
  
  // Create engine stop audio element
  APP_STATE.audio.engineStopSound = new Audio(CONFIG.audio.engineStopPath);
  APP_STATE.audio.engineStopSound.loop = false; // Play once when stopping
  APP_STATE.audio.engineStopSound.volume = CONFIG.audio.engineVolume;
  APP_STATE.audio.engineStopSound.preload = 'auto';
  
  // Create laser shoot audio element
  APP_STATE.audio.laserShootSound = new Audio(CONFIG.audio.laserShootPath);
  APP_STATE.audio.laserShootSound.loop = false; // Play once per shot
  APP_STATE.audio.laserShootSound.volume = CONFIG.audio.laserVolume;
  APP_STATE.audio.laserShootSound.preload = 'auto';
  
  // Add event listeners for ambient sound
  APP_STATE.audio.ambientSound.addEventListener('canplaythrough', () => {
    console.log('Ambient sound loaded and ready to play');
    updateLoadingProgress();
  });
  
  APP_STATE.audio.ambientSound.addEventListener('error', (e) => {
    console.warn('Failed to load ambient sound:', e);
    updateLoadingProgress();
  });
  
  // Add event listeners for engine start sound
  APP_STATE.audio.engineStartSound.addEventListener('canplaythrough', () => {
    console.log('Engine start sound loaded and ready to play');
    updateLoadingProgress();
  });
  
  APP_STATE.audio.engineStartSound.addEventListener('error', (e) => {
    console.warn('Failed to load engine start sound:', e);
    updateLoadingProgress();
  });
  
  // Add event listeners for engine stop sound
  APP_STATE.audio.engineStopSound.addEventListener('canplaythrough', () => {
    console.log('Engine stop sound loaded and ready to play');
    updateLoadingProgress();
  });
  
  APP_STATE.audio.engineStopSound.addEventListener('error', (e) => {
    console.warn('Failed to load engine stop sound:', e);
    updateLoadingProgress();
  });
  
  // Add event listeners for laser shoot sound
  APP_STATE.audio.laserShootSound.addEventListener('canplaythrough', () => {
    console.log('Laser shoot sound loaded and ready to play');
    updateLoadingProgress();
  });
  
  APP_STATE.audio.laserShootSound.addEventListener('error', (e) => {
    console.warn('Failed to load laser shoot sound:', e);
    updateLoadingProgress();
  });
}

function startAmbientSound() {
  if (!APP_STATE.audio.ambientSound || APP_STATE.audio.isAmbientPlaying) return;
  
  try {
    const playPromise = APP_STATE.audio.ambientSound.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        APP_STATE.audio.isAmbientPlaying = true;
        fadeInAmbientSound();
        console.log('Ambient sound started successfully');
      }).catch((error) => {
        console.log('Autoplay prevented, will start on user interaction:', error);
      });
    }
  } catch (error) {
    console.log('Audio play failed:', error);
  }
}

function fadeInAmbientSound() {
  if (!APP_STATE.audio.ambientSound) return;
  
  const startTime = Date.now();
  const targetVolume = CONFIG.audio.ambientVolume;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / CONFIG.audio.fadeInDuration, 1);
    
    APP_STATE.audio.ambientSound.volume = progress * targetVolume;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

function setAmbientVolume(volume) {
  if (APP_STATE.audio.ambientSound) {
    APP_STATE.audio.ambientSound.volume = volume;
    CONFIG.audio.ambientVolume = volume;
  }
}

function setEngineVolume(volume) {
  CONFIG.audio.engineVolume = volume;
  if (APP_STATE.audio.engineStartSound) {
    APP_STATE.audio.engineStartSound.volume = APP_STATE.audio.isEngineRunning ? volume : 0;
  }
  if (APP_STATE.audio.engineStopSound) {
    APP_STATE.audio.engineStopSound.volume = volume;
  }
}

function setLaserVolume(volume) {
  CONFIG.audio.laserVolume = volume;
  if (APP_STATE.audio.laserShootSound) {
    APP_STATE.audio.laserShootSound.volume = volume;
  }
}

function toggleAmbientSound() {
  if (!APP_STATE.audio.ambientSound) return;
  
  if (APP_STATE.audio.isAmbientPlaying) {
    APP_STATE.audio.ambientSound.pause();
    APP_STATE.audio.isAmbientPlaying = false;
  } else {
    startAmbientSound();
  }
}

// Laser sound function
function playLaserSound() {
  if (!APP_STATE.audio.laserShootSound || !APP_STATE.audio.userInteracted) return;
  
  try {
    // Reset to beginning for rapid fire capability
    APP_STATE.audio.laserShootSound.currentTime = 0;
    const playPromise = APP_STATE.audio.laserShootSound.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Laser sound played successfully');
      }).catch((error) => {
        console.log('Laser sound play failed:', error);
      });
    }
  } catch (error) {
    console.log('Laser audio play failed:', error);
  }
}

// Engine sound functions
function startEngineSound() {
  if (!APP_STATE.audio.engineStartSound || APP_STATE.audio.isEngineRunning) return;
  if (!APP_STATE.audio.userInteracted) return; // Respect autoplay policy
  
  // Clear any pending fade timeout
  if (APP_STATE.audio.engineFadeTimeout) {
    clearTimeout(APP_STATE.audio.engineFadeTimeout);
    APP_STATE.audio.engineFadeTimeout = null;
  }
  
  try {
    const playPromise = APP_STATE.audio.engineStartSound.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        APP_STATE.audio.isEngineRunning = true;
        fadeInEngineSound();
        console.log('Engine sound started successfully');
      }).catch((error) => {
        console.log('Engine sound play failed:', error);
      });
    }
  } catch (error) {
    console.log('Engine audio play failed:', error);
  }
}

function stopEngineSound() {
  if (!APP_STATE.audio.isEngineRunning) return;
  
  // Fade out engine start sound
  fadeOutEngineSound();
  
  // Play engine stop sound
  if (APP_STATE.audio.engineStopSound && APP_STATE.audio.userInteracted) {
    try {
      APP_STATE.audio.engineStopSound.currentTime = 0; // Reset to beginning
      APP_STATE.audio.engineStopSound.play();
      console.log('Engine stop sound played');
    } catch (error) {
      console.log('Engine stop sound play failed:', error);
    }
  }
  
  APP_STATE.audio.isEngineRunning = false;
}

function fadeInEngineSound() {
  if (!APP_STATE.audio.engineStartSound) return;
  
  const startTime = Date.now();
  const targetVolume = CONFIG.audio.engineVolume;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / CONFIG.audio.engineFadeDuration, 1);
    
    APP_STATE.audio.engineStartSound.volume = progress * targetVolume;
    
    if (progress < 1 && APP_STATE.audio.isEngineRunning) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

function fadeOutEngineSound() {
  if (!APP_STATE.audio.engineStartSound) return;
  
  const startTime = Date.now();
  const startVolume = APP_STATE.audio.engineStartSound.volume;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / CONFIG.audio.engineFadeDuration, 1);
    
    APP_STATE.audio.engineStartSound.volume = startVolume * (1 - progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Pause the engine sound after fade out
      APP_STATE.audio.engineStartSound.pause();
      APP_STATE.audio.engineStartSound.currentTime = 0; // Reset for next play
    }
  }
  
  animate();
}

// =================================================================
// SCENE SETUP
// =================================================================

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,
  CONFIG.camera.aspect,
  CONFIG.camera.near,
  CONFIG.camera.far
);
camera.position.copy(new THREE.Vector3(200, 15, -270));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // strength
  0.4, // radius
  0.85 // threshold
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
directionalLight.position.copy(CONFIG.lights.directional.position);
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

// Initialize audio system
initializeAudio();

// =================================================================
// HELPER FUNCTIONS
// =================================================================

function resetShuttlePosition() {
  if (!APP_STATE.shuttleModel) return;
  APP_STATE.shuttleModel.position.copy(CONFIG.model.position);
  APP_STATE.shuttleModel.rotation.set(0, 0, 0);
  APP_STATE.shuttleControls.velocity.set(0, 0, 0);
  APP_STATE.shuttleControls.rotation.set(0, 0, 0);
}

function createPlanet(radius, textureFile, position) {
  const planetTexture = textureLoader.load(textureFile);
  planetTexture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(radius, 64, 64);
  const material = new THREE.MeshStandardMaterial({ map: planetTexture });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.copy(position);
  planet.receiveShadow = true;
  scene.add(planet);
  APP_STATE.planets.push(planet);
}

// =================================================================
// CONTROLS & MOVEMENT
// =================================================================

const CONTROL_KEYS = [
  "KeyW",
  "KeyS",
  "KeyA",
  "KeyD",
  "KeyQ",
  "KeyE",
  "ShiftLeft",
  "ShiftRight",
  "Space",
  "ControlLeft",
  "ControlRight",
];

window.addEventListener("keydown", (e) => {
  // Handle audio user interaction requirement
  if (!APP_STATE.audio.userInteracted) {
    APP_STATE.audio.userInteracted = true;
    startAmbientSound();
  }
  
  APP_STATE.keyboard[e.code] = true;
  if (CONTROL_KEYS.includes(e.code)) {
    APP_STATE.cameraState.lastInputTime = Date.now();
    if (APP_STATE.cameraState.mode === "orbit") switchToChaseCam();
  }
  // --- NEW: Fire laser on F key press ---
  if (e.code === "KeyF" && APP_STATE.shuttleModel) {
    fireLaser();
  }
  // --- NEW: Toggle controls help on H key press ---
  if (e.code === "KeyH") {
    toggleControlsHelp();
  }
  // --- NEW: Exit focus mode on Escape key press ---
  if (e.code === "Escape") {
    exitFocusMode();
  }
  // --- NEW: Toggle ambient sound on M key press ---
  if (e.code === "KeyM") {
    toggleAmbientSound();
  }
});

window.addEventListener("keyup", (e) => (APP_STATE.keyboard[e.code] = false));

// --- REWRITTEN: LASER LOGIC FOR PARTICLES ---
function fireLaser() {
  const now = Date.now();
  if (now - APP_STATE.lastFireTime < CONFIG.lasers.fireRate) return; // Cooldown
  APP_STATE.lastFireTime = now;

  // Play laser sound effect
  playLaserSound();

  const shuttle = APP_STATE.shuttleModel;
  const laserConfig = CONFIG.lasers;

  const particleTexture = textureLoader.load(
    "/textures/particle.png",
    () => updateLoadingProgress(),
    undefined,
    (error) => {
      console.warn("Failed to load laser particle texture:", error);
      updateLoadingProgress();
    }
  );

  // Fire from each hardpoint
  APP_STATE.laserHardpoints.forEach((hardpoint) => {
    // --- Create Particle Geometry ---
    const positions = [];
    for (let i = 0; i < laserConfig.particleCount; i++) {
      // Create a small, linear streak of particles
      const x = THREE.MathUtils.randFloatSpread(0.1);
      const y = THREE.MathUtils.randFloatSpread(0.1);
      const z = THREE.MathUtils.randFloat(0, 2); // Spread them out in a line
      positions.push(x, y, z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    // --- Create Particle Material ---
    const material = new THREE.PointsMaterial({
      color: laserConfig.color,
      size: laserConfig.particleSize,
      map: particleTexture,
      blending: THREE.AdditiveBlending, // Makes particles glow when they overlap
      depthWrite: false, // Prevents weird visual artifacts
      transparent: true,
    });

    // --- Create the final particle system (our laser bolt) ---
    const laserBolt = new THREE.Points(geometry, material);

    // Get world position and rotation of the hardpoint
    const position = new THREE.Vector3();
    hardpoint.getWorldPosition(position);

    laserBolt.position.copy(position);
    laserBolt.quaternion.copy(shuttle.quaternion);

    // Set laser velocity
    const velocity = new THREE.Vector3(0, 0, laserConfig.speed);
    velocity.applyQuaternion(shuttle.quaternion);

    laserBolt.userData = { velocity, distanceTraveled: 0 };

    APP_STATE.lasers.push(laserBolt);
    scene.add(laserBolt);
  });
}

function updateLasers(deltaTime) {
  const laserConfig = CONFIG.lasers;
  for (let i = APP_STATE.lasers.length - 1; i >= 0; i--) {
    const laser = APP_STATE.lasers[i];

    const distanceThisFrame = laser.userData.velocity.length();
    laser.position.add(laser.userData.velocity);
    laser.userData.distanceTraveled += distanceThisFrame;

    // Cleanup lasers that have traveled too far
    if (laser.userData.distanceTraveled > laserConfig.maxLength) {
      scene.remove(laser);
      laser.geometry.dispose();
      laser.material.dispose();
      APP_STATE.lasers.splice(i, 1);
    }
  }
}

function switchToChaseCam() {
  if (APP_STATE.cameraState.mode === "chase") return;
  APP_STATE.cameraState.mode = "chase";
  APP_STATE.cameraState.focusMode = false;
  APP_STATE.cameraState.focusedPlanet = null;
  orbitControls.enabled = false;
}

function switchToOrbitCam() {
  if (APP_STATE.cameraState.mode === "orbit") return;
  
  // Start smooth transition to orbit mode
  if (APP_STATE.shuttleModel && !APP_STATE.cameraState.transitioning) {
    startSmoothTransitionToOrbit();
  } else {
    // Fallback to immediate switch if no shuttle or already transitioning
    APP_STATE.cameraState.mode = "orbit";
    orbitControls.enabled = true;
  }
}

function startSmoothTransitionToOrbit() {
  const shuttle = APP_STATE.shuttleModel;
  const currentPos = camera.position.clone();
  const currentTarget = new THREE.Vector3();
  camera.getWorldDirection(currentTarget);
  currentTarget.multiplyScalar(10).add(camera.position);
  
  // Use the original orbit position calculation (0, 20, 50 offset)
  const orbitPosition = shuttle.position.clone().add(new THREE.Vector3(0, 20, 50));
  
  // Start transition
  APP_STATE.cameraState.transitioning = true;
  APP_STATE.cameraState.transitionStartTime = Date.now();
  
  // Store transition data
  APP_STATE.cameraState.transitionData = {
    startPosition: currentPos,
    startTarget: currentTarget,
    endPosition: orbitPosition,
    endTarget: shuttle.position.clone()
  };
}

function updateSmoothTransition() {
  if (!APP_STATE.cameraState.transitioning) return;
  
  const elapsed = Date.now() - APP_STATE.cameraState.transitionStartTime;
  const progress = Math.min(elapsed / APP_STATE.cameraState.transitionDuration, 1);
  
  // Smooth easing function (ease-out cubic)
  const easedProgress = 1 - Math.pow(1 - progress, 3);
  
  const transitionData = APP_STATE.cameraState.transitionData;
  
  // Interpolate camera position
  camera.position.lerpVectors(
    transitionData.startPosition, 
    transitionData.endPosition, 
    easedProgress
  );
  
  // Create smooth target interpolation
  const currentTarget = new THREE.Vector3();
  currentTarget.lerpVectors(
    transitionData.startTarget,
    transitionData.endTarget,
    easedProgress
  );
  
  // Look at the interpolated target
  camera.lookAt(currentTarget);
  
  // Update orbit controls target smoothly
  if (easedProgress > 0.5) { // Start enabling orbit controls halfway through
    orbitControls.target.lerpVectors(
      transitionData.startTarget,
      transitionData.endTarget,
      (easedProgress - 0.5) * 2 // Remap 0.5-1.0 to 0.0-1.0
    );
  }
  
  // Complete transition
  if (progress >= 1) {
    APP_STATE.cameraState.mode = "orbit";
    APP_STATE.cameraState.transitioning = false;
    orbitControls.enabled = true;
    orbitControls.target.copy(transitionData.endTarget);
    orbitControls.update();
    
    // Clean up transition data
    delete APP_STATE.cameraState.transitionData;
  }
}

function updateCameraMode() {
  const now = Date.now();
  const timeSinceLastInput = now - APP_STATE.cameraState.lastInputTime;
  if (
    APP_STATE.cameraState.mode === "chase" &&
    timeSinceLastInput > CONFIG.camera.orbitTimeoutMs
  ) {
    switchToOrbitCam(); // This now handles smooth transitions automatically
  }
}

function updateChaseCamera() {
  if (!APP_STATE.shuttleModel || APP_STATE.cameraState.mode !== "chase") return;
  const shuttle = APP_STATE.shuttleModel;
  const cameraParams = CONFIG.camera;
  const idealOffset = new THREE.Vector3(
    0,
    cameraParams.chaseHeight,
    -cameraParams.chaseDistance
  );
  idealOffset.applyQuaternion(shuttle.quaternion);
  const idealCameraPos = shuttle.position.clone().add(idealOffset);
  camera.position.lerp(idealCameraPos, cameraParams.chaseDamping);
  const forwardVector = new THREE.Vector3(0, 0, 3);
  forwardVector.applyQuaternion(shuttle.quaternion);
  const lookAtTarget = shuttle.position.clone().add(forwardVector);
  camera.lookAt(lookAtTarget);
}

function updateFocusCamera() {
  if (!APP_STATE.cameraState.focusMode || !APP_STATE.cameraState.focusedPlanet) return;
  
  const planet = APP_STATE.cameraState.focusedPlanet;
  const worldPosition = new THREE.Vector3();
  planet.getWorldPosition(worldPosition);
  
  // Smoothly update the orbit controls target to follow the planet
  orbitControls.target.lerp(worldPosition, 0.02);
  orbitControls.update();
}

function updateShuttleMovement() {
  // This function remains the same as your provided version
  if (!APP_STATE.shuttleModel) return;
  const shuttle = APP_STATE.shuttleModel;
  const controls = APP_STATE.shuttleControls;
  const params = CONFIG.flight;
  if (APP_STATE.keyboard["KeyS"]) controls.rotation.x -= params.rotationSpeed;
  if (APP_STATE.keyboard["KeyW"]) controls.rotation.x += params.rotationSpeed;
  if (APP_STATE.keyboard["KeyA"]) controls.rotation.y += params.rotationSpeed;
  if (APP_STATE.keyboard["KeyD"]) controls.rotation.y -= params.rotationSpeed;
  if (APP_STATE.keyboard["KeyQ"]) controls.rotation.z -= params.rollSpeed;
  if (APP_STATE.keyboard["KeyE"]) controls.rotation.z += params.rollSpeed;
  controls.rotation.multiplyScalar(params.rotationDamping);
  shuttle.rotation.x += controls.rotation.x;
  shuttle.rotation.y += controls.rotation.y;
  shuttle.rotation.z += controls.rotation.z;
  const isThrusting =
    APP_STATE.keyboard["ShiftLeft"] || APP_STATE.keyboard["ShiftRight"];
  const isAscending = APP_STATE.keyboard["Space"];
  const isDescending =
    APP_STATE.keyboard["ControlLeft"] || APP_STATE.keyboard["ControlRight"];
  
  // Handle engine sound based on thruster activity
  const isAnyThrusterActive = isThrusting || isAscending || isDescending;
  
  if (isAnyThrusterActive && !APP_STATE.audio.isEngineRunning) {
    // Start engine sound when thrusters become active
    startEngineSound();
  } else if (!isAnyThrusterActive && APP_STATE.audio.isEngineRunning) {
    // Stop engine sound when thrusters become inactive
    stopEngineSound();
  }
  
  if (isThrusting) {
    const forwardVector = new THREE.Vector3(0, 0, 1);
    forwardVector.applyQuaternion(shuttle.quaternion);
    controls.velocity.multiplyScalar(0.95);
    controls.velocity.add(forwardVector.multiplyScalar(params.thrust * 1.5));
  }
  if (isAscending) controls.velocity.y += params.thrust * 0.25;
  if (isDescending) controls.velocity.y -= params.thrust * 0.25;
  if (!isThrusting && !isAscending && !isDescending) {
    controls.velocity.multiplyScalar(params.velocityDamping);
  }
  if (controls.velocity.length() > params.maxVelocity) {
    controls.velocity.normalize().multiplyScalar(params.maxVelocity);
  }
  shuttle.position.add(controls.velocity);
}

// --- NEW: THRUSTER PARTICLE SYSTEM ---
function createThrusterParticles() {
    const config = CONFIG.thrusterEffect;
    
    // Initialize particle arrays
    APP_STATE.thrusterPositions = [];
    APP_STATE.thrusterVelocities = [];
    APP_STATE.thrusterLife = [];
    APP_STATE.thrusterParticles = []; // Array of individual spheres
    
    // Load glow texture
    const glowTexture = textureLoader.load(
      '/textures/glow.png',
      () => updateLoadingProgress(),
      undefined,
      (error) => {
        console.warn("Failed to load glow texture:", error);
        updateLoadingProgress();
      }
    );
    
    // Create individual sprite particles with glow texture
    for (let i = 0; i < config.particleCount; i++) {
        const material = new THREE.SpriteMaterial({
            map: glowTexture,
            color: config.baseColor,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Sprite(material);
        particle.scale.setScalar(config.particleSize);
        particle.position.set(-10000, -10000, -10000); // Hide initially
        scene.add(particle);
        
        // Store original color for reset
        particle.userData.originalColor = config.baseColor;
        
        APP_STATE.thrusterParticles.push(particle);
        APP_STATE.thrusterPositions.push(new THREE.Vector3());
        APP_STATE.thrusterVelocities.push(new THREE.Vector3());
        APP_STATE.thrusterLife.push(0);
    }
}

function updateThrusterParticles(deltaTime) {
    if (!APP_STATE.shuttleModel || !APP_STATE.thrusterParticles.length) return;
    
    const shuttle = APP_STATE.shuttleModel;
    const config = CONFIG.thrusterEffect;
    const isThrusting = APP_STATE.keyboard['ShiftLeft'] || APP_STATE.keyboard['ShiftRight'];
    
    
    for (let i = 0; i < config.particleCount; i++) {
        const life = APP_STATE.thrusterLife[i];
        const particle = APP_STATE.thrusterParticles[i];
        
        if (isThrusting && life <= 0) {
            // Spawn particle very close behind the shuttle
            const enginePos = new THREE.Vector3(0, 0, config.engineOffset);
            enginePos.applyQuaternion(shuttle.quaternion);
            enginePos.add(shuttle.position);
            
            // Add cone-shaped spread for realistic engine exhaust
            const spread = 3;
            enginePos.add(new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                Math.random() * -2 // Additional backward offset
            ));
            
            APP_STATE.thrusterPositions[i].copy(enginePos);
            
            // Velocity with turbulent exhaust behavior
            const exhaustVelocity = new THREE.Vector3(0, 0, -config.particleSpeed);
            exhaustVelocity.applyQuaternion(shuttle.quaternion);
            
            // Add turbulence and expansion
            exhaustVelocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 0.8
            ));
            
            APP_STATE.thrusterVelocities[i].copy(exhaustVelocity);
            APP_STATE.thrusterLife[i] = config.particleLife;
            
        }
        
        if (life > 0) {
            // Update particle
            APP_STATE.thrusterLife[i] -= deltaTime;
            
            // Apply drag and subtle turbulence
            APP_STATE.thrusterVelocities[i].multiplyScalar(0.99);
            APP_STATE.thrusterVelocities[i].add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                0
            ));
            
            APP_STATE.thrusterPositions[i].add(
                APP_STATE.thrusterVelocities[i].clone().multiplyScalar(deltaTime * 60)
            );
            
            // Update sprite position
            particle.position.copy(APP_STATE.thrusterPositions[i]);
            
            // Professional fade and scale effects
            const lifePercent = APP_STATE.thrusterLife[i] / config.particleLife;
            const fadeOut = Math.pow(lifePercent, 0.8); // Smooth fade
            particle.material.opacity = fadeOut * 0.8;
            
            // Gradual expansion for professional look
            const expansion = 1 + (1 - lifePercent) * 1.5;
            particle.scale.setScalar(config.particleSize * expansion);
            
            // Dynamic color with intensity variation
            const intensity = 0.3 + lifePercent * 0.7; // Brighter when fresh
            const baseColor = new THREE.Color(particle.userData.originalColor || CONFIG.thrusterEffect.baseColor);
            particle.material.color.setRGB(
                baseColor.r * intensity,
                baseColor.g * intensity, 
                baseColor.b * intensity
            );
            
            particle.visible = true;
        } else {
            // Reset dead particles completely
            particle.visible = false;
            particle.scale.setScalar(config.particleSize);
            particle.material.color.setHex(particle.userData.originalColor);
            particle.material.opacity = 0.8;
        }
    }
}

// =================================================================
// OBJECT CREATION & MODEL LOADING
// =================================================================

// Solar system configuration with realistic proportions and distances
const solarSystemConfig = [
  { name: "Mercury", texture: "/textures/mercury.jpg", size: 2.4, distance: 300, speed: 0.0002, info: "Closest planet to the Sun. Surface temperature: 427°C" },
  { name: "Venus", texture: "/textures/venus.jpg", size: 6.0, distance: 380, speed: 0.00015, info: "Hottest planet in the solar system. Dense atmosphere of CO₂" },
  { name: "Earth", texture: "/textures/earth.jpg", size: 6.4, distance: 450, speed: 0.0001, info: "Our home planet. The only known planet with life" },
  { name: "Mars", texture: "/textures/mars.jpg", size: 3.4, distance: 550, speed: 0.00008, info: "The Red Planet. Has polar ice caps and the largest volcano" },
  { name: "Jupiter", texture: "/textures/jupiter.jpg", size: 22, distance: 750, speed: 0.00005, info: "Largest planet. A gas giant with over 80 moons" },
  { name: "Saturn", texture: "/textures/saturn.jpg", size: 19, distance: 900, speed: 0.00004, info: "Famous for its ring system. Less dense than water" },
  { name: "Uranus", texture: "/textures/uranus.jpg", size: 8, distance: 1050, speed: 0.00003, info: "Ice giant that rotates on its side. Made of water and methane" },
  { name: "Neptune", texture: "/textures/neptune.jpg", size: 7.8, distance: 1200, speed: 0.000025, info: "Windiest planet with speeds up to 2,100 km/h" }
];

// Sun at the center with intense lighting effects
const sunGeometry = new THREE.SphereGeometry(35, 64, 64);
const sunTexture = textureLoader.load(
  "/textures/sun.jpg",
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    console.log("Sun texture loaded successfully");
    updateLoadingProgress();
  },
  undefined,
  (error) => {
    console.warn("Failed to load sun texture:", error);
    updateLoadingProgress();
  }
);
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissiveMap: sunTexture,
  emissive: 0xffddaa,
  emissiveIntensity: 0.8,
  toneMapped: true
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, 0);
sun.userData = {
  name: "Sun",
  info: "The star at the center of our solar system. Surface temperature: 5,778K",
  size: 35,
  distance: 0
};
console.log("Sun created:", sun);
console.log("Sun position:", sun.position);
console.log("Sun scale:", sun.scale);
scene.add(sun);
console.log("Sun added to scene");
APP_STATE.planets.push(sun); // Add sun to planets array for interaction

// Add intense sun light source
const sunLight = new THREE.PointLight(0xffaa44, 3, 2000);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 2000;
scene.add(sunLight);

// Add sun glow effect with outer sphere
const sunGlowGeometry = new THREE.SphereGeometry(50, 32, 32);
const sunGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffaa00,
  transparent: true,
  opacity: 0.1,
  side: THREE.BackSide
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
sunGlow.position.set(0, 0, 0);
scene.add(sunGlow);

// Add heat haze particles around the sun
function createSunHeatEffect() {
  const particleCount = 300;
  const positions = [];
  const colors = [];
  
  for (let i = 0; i < particleCount; i++) {
    const radius = 40 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    positions.push(x, y, z);
    
    const intensity = 0.5 + Math.random() * 0.5;
    colors.push(1.0 * intensity, 0.6 * intensity, 0.2 * intensity);
  }
  
  const heatGeometry = new THREE.BufferGeometry();
  heatGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  heatGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  
  const heatTexture = textureLoader.load(
    '/textures/particle.png',
    () => updateLoadingProgress(),
    undefined,
    (error) => {
      console.warn("Failed to load particle texture:", error);
      updateLoadingProgress();
    }
  );
  const heatMaterial = new THREE.PointsMaterial({
    size: 3,
    map: heatTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    vertexColors: true,
    opacity: 0.6
  });
  
  const heatParticles = new THREE.Points(heatGeometry, heatMaterial);
  heatParticles.position.set(0, 0, 0);
  scene.add(heatParticles);
  
  return heatParticles;
}

const sunHeatEffect = createSunHeatEffect();

// Create orbital lines
function createOrbitalLine(radius) {
  const points = [];
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    ));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ 
    color: 0x444444, 
    transparent: true, 
    opacity: 0.3 
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  return line;
}

// Create planets and orbital lines
solarSystemConfig.forEach((planetConfig) => {
  // Create orbital line
  createOrbitalLine(planetConfig.distance);
  
  // Create planet
  const planetTexture = textureLoader.load(
    planetConfig.texture,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      updateLoadingProgress();
    },
    undefined,
    (error) => {
      console.warn(`Failed to load ${planetConfig.name} texture:`, error);
      updateLoadingProgress();
    }
  );
  const geometry = new THREE.SphereGeometry(planetConfig.size, 64, 64);
  const material = new THREE.MeshStandardMaterial({ map: planetTexture });
  const planet = new THREE.Mesh(geometry, material);
  
  // Add Saturn's rings
  if (planetConfig.name === "Saturn") {
    const ringTexture = textureLoader.load(
      "/textures/saturn-ring.png",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        updateLoadingProgress();
      },
      undefined,
      (error) => {
        console.warn("Failed to load Saturn ring texture:", error);
        updateLoadingProgress();
      }
    );
    const ringGeometry = new THREE.RingGeometry(planetConfig.size * 1.2, planetConfig.size * 2.2, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({ 
      map: ringTexture, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    planet.add(rings);
  }
  
  // Add Moon to Earth
  if (planetConfig.name === "Earth") {
    const moonTexture = textureLoader.load(
      "/textures/moon.jpg",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        updateLoadingProgress();
      },
      undefined,
      (error) => {
        console.warn("Failed to load moon texture:", error);
        updateLoadingProgress();
      }
    );
    const moonGeometry = new THREE.SphereGeometry(1.7, 32, 32);
    const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(15, 0, 0);
    moon.userData = { 
      distance: 15, 
      speed: 0.001, 
      angle: 0,
      name: "Moon",
      size: 1.7, // Same as the moon geometry radius
      info: "Earth's natural satellite. Influences tides and stabilizes Earth's rotation"
    };
    planet.add(moon);
    APP_STATE.planets.push(moon);
  }
  
  // Set initial position
  planet.position.set(planetConfig.distance, 0, 0);
  planet.receiveShadow = true;
  
  // Store orbital data
  planet.userData = {
    distance: planetConfig.distance,
    speed: planetConfig.speed,
    angle: 0,
    name: planetConfig.name,
    info: planetConfig.info,
    size: planetConfig.size
  };
  
  scene.add(planet);
  APP_STATE.planets.push(planet);
});

const gltfLoader = new GLTFLoader();
gltfLoader.load(
  CONFIG.model.path,
  (gltf) => {
    APP_STATE.shuttleModel = gltf.scene;
    APP_STATE.shuttleModel.scale.setScalar(CONFIG.model.scale);
    APP_STATE.shuttleModel.position.copy(CONFIG.model.position);
    APP_STATE.shuttleModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // --- NEW: Create and attach hardpoints ---
    const hardpointL = new THREE.Object3D();
    const hardpointR = new THREE.Object3D();

    // IMPORTANT: You will need to tweak these x, y, z values
    // to position the lasers correctly on your shuttle model's wings.
    hardpointL.position.set(-775, -50, 400); // Guess for left wingtip
    hardpointR.position.set(775, -50, 400); // Guess for right wingtip

    APP_STATE.shuttleModel.add(hardpointL);
    APP_STATE.shuttleModel.add(hardpointR);
    APP_STATE.laserHardpoints.push(hardpointL, hardpointR);

    // Create thruster particle system
    createThrusterParticles();
    console.log("Thruster particle system created");
    console.log("Number of particles created:", APP_STATE.thrusterParticles.length);
    // --- END OF NEW BLOCK ---

    scene.add(APP_STATE.shuttleModel);
    
    // Initialize GUI after shuttle loads
    setupCustomGUI();
    updateLoadingProgress();
    console.log("Shuttle model loaded successfully.");
  },
  undefined,
  (error) => {
    console.error("An error occurred while loading the model:", error);
    updateLoadingProgress();
  }
);

// =================================================================
// GUI SETUP
// =================================================================
function setupCustomGUI() {
  const gui = document.getElementById('custom-gui');
  gui.style.display = 'block';

  // Accordion functionality
  const headers = document.querySelectorAll('.gui-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      section.classList.toggle('open');
    });
  });

  // Flight Controls
  document.getElementById('thrust').addEventListener('input', e => CONFIG.flight.thrust = parseFloat(e.target.value));
  document.getElementById('max-velocity').addEventListener('input', e => CONFIG.flight.maxVelocity = parseFloat(e.target.value));
  document.getElementById('rotation-speed').addEventListener('input', e => CONFIG.flight.rotationSpeed = parseFloat(e.target.value));
  document.getElementById('roll-speed').addEventListener('input', e => CONFIG.flight.rollSpeed = parseFloat(e.target.value));
  document.getElementById('reset-shuttle').addEventListener('click', resetShuttlePosition);

  // Camera Controls
  document.getElementById('camera-mode').addEventListener('change', e => {
    if (e.target.value === 'chase') switchToChaseCam();
    else switchToOrbitCam();
  });
  document.getElementById('chase-distance').addEventListener('input', e => CONFIG.camera.chaseDistance = parseInt(e.target.value));
  document.getElementById('chase-height').addEventListener('input', e => CONFIG.camera.chaseHeight = parseInt(e.target.value));

  // Weapons & Effects
  document.getElementById('laser-color').addEventListener('input', e => CONFIG.lasers.color = parseInt(e.target.value.replace('#', '0x')));
  document.getElementById('laser-speed').addEventListener('input', e => CONFIG.lasers.speed = parseFloat(e.target.value));
  document.getElementById('fire-rate').addEventListener('input', e => CONFIG.lasers.fireRate = parseInt(e.target.value));
  document.getElementById('fire-laser').addEventListener('click', fireLaser);

  // Thruster Effects
  document.getElementById('thruster-color').addEventListener('input', e => {
    const color = parseInt(e.target.value.replace('#', '0x'));
    CONFIG.thrusterEffect.baseColor = color;
    APP_STATE.thrusterParticles?.forEach(p => p.userData.originalColor = color);
  });
  document.getElementById('particle-count').addEventListener('input', e => {
    CONFIG.thrusterEffect.particleCount = parseInt(e.target.value);
    createThrusterParticles();
  });
  document.getElementById('particle-life').addEventListener('input', e => CONFIG.thrusterEffect.particleLife = parseFloat(e.target.value));

  // Lighting
  document.getElementById('ambient-intensity').addEventListener('input', e => ambientLight.intensity = parseFloat(e.target.value));
  document.getElementById('directional-intensity').addEventListener('input', e => directionalLight.intensity = parseFloat(e.target.value));

  // Visual Effects
  document.getElementById('toggle-wireframe').addEventListener('change', e => {
    APP_STATE.shuttleModel.traverse(child => {
      if (child.isMesh) child.material.wireframe = e.target.checked;
    });
  });
  document.getElementById('bloom-strength').addEventListener('input', e => bloomPass.strength = parseFloat(e.target.value));
  document.getElementById('bloom-radius').addEventListener('input', e => bloomPass.radius = parseFloat(e.target.value));
  document.getElementById('bloom-threshold').addEventListener('input', e => bloomPass.threshold = parseFloat(e.target.value));

  // Audio Controls
  document.getElementById('ambient-volume').addEventListener('input', e => setAmbientVolume(parseFloat(e.target.value)));
  document.getElementById('engine-volume').addEventListener('input', e => setEngineVolume(parseFloat(e.target.value)));
  document.getElementById('laser-volume').addEventListener('input', e => setLaserVolume(parseFloat(e.target.value)));
  document.getElementById('toggle-ambient').addEventListener('click', toggleAmbientSound);

  // Time Controls
  const timePreset = document.getElementById('time-preset');
  const timeSpeed = document.getElementById('time-speed');
  timePreset.addEventListener('change', e => {
    switch (e.target.value) {
      case 'Pause': timeSpeed.value = 0; break;
      case 'Slow': timeSpeed.value = 0.5; break;
      case 'Normal': timeSpeed.value = 1; break;
      case 'Fast': timeSpeed.value = 3; break;
      case 'Very Fast': timeSpeed.value = 5; break;
    }
    APP_STATE.timeSpeed = parseFloat(timeSpeed.value);
  });
  timeSpeed.addEventListener('input', e => {
    APP_STATE.timeSpeed = parseFloat(e.target.value);
    // You might want to update the preset dropdown here as well
  });

  // Set initial values
  document.getElementById('thrust').value = CONFIG.flight.thrust;
  document.getElementById('max-velocity').value = CONFIG.flight.maxVelocity;
  document.getElementById('rotation-speed').value = CONFIG.flight.rotationSpeed;
  document.getElementById('roll-speed').value = CONFIG.flight.rollSpeed;
  document.getElementById('chase-distance').value = CONFIG.camera.chaseDistance;
  document.getElementById('chase-height').value = CONFIG.camera.chaseHeight;
  document.getElementById('laser-color').value = '#' + CONFIG.lasers.color.toString(16).padStart(6, '0');
  document.getElementById('laser-speed').value = CONFIG.lasers.speed;
  document.getElementById('fire-rate').value = CONFIG.lasers.fireRate;
  document.getElementById('thruster-color').value = '#' + CONFIG.thrusterEffect.baseColor.toString(16).padStart(6, '0');
  document.getElementById('particle-count').value = CONFIG.thrusterEffect.particleCount;
  document.getElementById('particle-life').value = CONFIG.thrusterEffect.particleLife;
  document.getElementById('ambient-intensity').value = ambientLight.intensity;
  document.getElementById('directional-intensity').value = directionalLight.intensity;
  document.getElementById('bloom-strength').value = bloomPass.strength;
  document.getElementById('bloom-radius').value = bloomPass.radius;
  document.getElementById('bloom-threshold').value = bloomPass.threshold;
  document.getElementById('ambient-volume').value = CONFIG.audio.ambientVolume;
  document.getElementById('engine-volume').value = CONFIG.audio.engineVolume;
  document.getElementById('laser-volume').value = CONFIG.audio.laserVolume;
  timeSpeed.value = APP_STATE.timeSpeed;

  // FPS Counter
  const fpsCounter = document.getElementById('fps-counter');
  let frames = 0;
  let lastTime = performance.now();
  function updateFPS() {
    frames++;
    const now = performance.now();
    if (now >= lastTime + 1000) {
      fpsCounter.textContent = Math.round((frames * 1000) / (now - lastTime));
      frames = 0;
      lastTime = now;
    }
    requestAnimationFrame(updateFPS);
  }
  updateFPS();
}

// =================================================================
// ANIMATION LOOP
// =================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  if (APP_STATE.shuttleModel) {
    updateShuttleMovement();
    updateCameraMode();
    updateSmoothTransition(); // NEW: Handle smooth camera transitions
    updateChaseCamera();
    updateLasers(deltaTime); // NEW
    updateThrusterParticles(deltaTime); // NEW
    
    // Handle camera target updates based on mode (only if not transitioning)
    if (APP_STATE.cameraState.mode === "orbit" && !APP_STATE.cameraState.transitioning) {
      if (APP_STATE.cameraState.focusMode) {
        // Follow focused planet when in focus mode
        updateFocusCamera();
      } else {
        // Follow shuttle when not focused on a planet
        orbitControls.target.lerp(APP_STATE.shuttleModel.position, 0.1);
      }
    }
  }

  // Update planet rotations and orbital movement
  APP_STATE.planets.forEach((planet) => {
    // Rotate planet on its axis
    planet.rotation.y += 0.0005;
    
    // Orbital movement around the sun (only for planets, not moons or sun)
    if (planet.userData && planet.userData.name !== "Moon" && planet.userData.name !== "Sun") {
      planet.userData.angle += planet.userData.speed * APP_STATE.timeSpeed;
      planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
      planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;
    }
    
    // Handle Moon orbital movement around Earth
    if (planet.userData && planet.userData.name === "Moon") {
      planet.userData.angle += planet.userData.speed * APP_STATE.timeSpeed;
      planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
      planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;
    }
  });

  // Animate the sun and its effects
  if (typeof sun !== 'undefined') {
    sun.rotation.y += 0.001;
    
    // Pulsing sun glow effect
    if (typeof sunGlow !== 'undefined') {
      sunGlow.material.opacity = 0.05 + Math.sin(Date.now() * 0.001) * 0.03;
      sunGlow.rotation.y += 0.002;
    }
    
    // Animate heat particles around the sun
    if (typeof sunHeatEffect !== 'undefined') {
      sunHeatEffect.rotation.y += 0.0005;
      sunHeatEffect.rotation.z += 0.0003;
      
      // Update particle positions for heat shimmer effect
      const positions = sunHeatEffect.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const time = Date.now() * 0.001;
        positions[i] += Math.sin(time + i) * 0.02;
        positions[i + 1] += Math.cos(time + i) * 0.02;
        positions[i + 2] += Math.sin(time * 0.5 + i) * 0.02;
      }
      sunHeatEffect.geometry.attributes.position.needsUpdate = true;
    }
    
    // Dynamic sun light intensity
    if (typeof sunLight !== 'undefined') {
      sunLight.intensity = 2.8 + Math.sin(Date.now() * 0.002) * 0.4;
    }
  }

  if (APP_STATE.cameraState.mode === "orbit" && !APP_STATE.cameraState.transitioning) {
    orbitControls.update();
  }

  composer.render();
}

// =================================================================
// EVENT LISTENERS & APP START
// =================================================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Add mouse move listener for tooltips
window.addEventListener("mousemove", updateTooltip);

// Add click listener for planet focusing
window.addEventListener("click", handlePlanetClick);

animate();
