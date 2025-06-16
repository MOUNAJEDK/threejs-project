export const CONFIG = {
  camera: {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 2000,
    position: { x: 200, y: 15, z: -270 },
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
      position: { x: 10, y: 20, z: 5 },
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
    ambientVolume: 0.3,
    engineVolume: 0.4,
    laserVolume: 0.6,
    fadeInDuration: 2000,
    engineFadeDuration: 500,
  },
  model: {
    path: "/models/star-wars-shuttle.glb",
    scale: 0.0025,
    position: { x: 200, y: 10, z: -300 },
  },
  flight: {
    thrust: 0.003,
    maxVelocity: 0.2,
    velocityDamping: 0.985,
    rotationSpeed: 0.002,
    rollSpeed: 0.001,
    rotationDamping: 0.92,
  },
  lasers: {
    speed: 1.5,
    color: 0x00ff00,
    maxLength: 100,
    fireRate: 250,
    particleCount: 20,
    particleSize: 0.2,
  },
  thrusterEffect: {
    baseColor: 0x4488ff,
    particleCount: 100,
    particleLife: 1.8,
    particleSpeed: 3.0,
    particleSize: 1.0,
    spread: 0.15,
    engineOffset: -5,
  },
  solarSystem: [
    { name: "Mercury", texture: "/textures/mercury.jpg", size: 2.4, distance: 300, speed: 0.0002, info: "Closest planet to the Sun. Surface temperature: 427°C" },
    { name: "Venus", texture: "/textures/venus.jpg", size: 6.0, distance: 380, speed: 0.00015, info: "Hottest planet in the solar system. Dense atmosphere of CO₂" },
    { name: "Earth", texture: "/textures/earth.jpg", size: 6.4, distance: 450, speed: 0.0001, info: "Our home planet. The only known planet with life" },
    { name: "Mars", texture: "/textures/mars.jpg", size: 3.4, distance: 550, speed: 0.00008, info: "The Red Planet. Has polar ice caps and the largest volcano" },
    { name: "Jupiter", texture: "/textures/jupiter.jpg", size: 22, distance: 750, speed: 0.00005, info: "Largest planet. A gas giant with over 80 moons" },
    { name: "Saturn", texture: "/textures/saturn.jpg", size: 19, distance: 900, speed: 0.00004, info: "Famous for its ring system. Less dense than water" },
    { name: "Uranus", texture: "/textures/uranus.jpg", size: 8, distance: 1050, speed: 0.00003, info: "Ice giant that rotates on its side. Made of water and methane" },
    { name: "Neptune", texture: "/textures/neptune.jpg", size: 7.8, distance: 1200, speed: 0.000025, info: "Windiest planet with speeds up to 2,100 km/h" }
  ],
  sun: {
    size: 35,
    texture: "/textures/sun.jpg",
    glowSize: 50,
    lightIntensity: 3,
    emissiveIntensity: 0.8,
    info: "The star at the center of our solar system. Surface temperature: 5,778K"
  },
  moon: {
    size: 1.7,
    texture: "/textures/moon.jpg",
    distance: 15,
    speed: 0.001,
    info: "Earth's natural satellite. Influences tides and stabilizes Earth's rotation"
  },
  saturn: {
    ringTexture: "/textures/saturn-ring.png",
    ringInnerRadius: 1.2,
    ringOuterRadius: 2.2
  },
  controlKeys: [
    "KeyW", "KeyS", "KeyA", "KeyD", "KeyQ", "KeyE",
    "ShiftLeft", "ShiftRight", "Space", "ControlLeft", "ControlRight"
  ]
};

export const ASSET_COUNT = 19;