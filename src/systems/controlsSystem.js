import * as THREE from "three";
import { CONFIG } from '../config/gameConfig.js';

export class ControlsSystem {
  constructor(cameraSystem, audioSystem) {
    this.cameraSystem = cameraSystem;
    this.audioSystem = audioSystem;
    this.keyboard = {};
    this.shuttleControls = {
      velocity: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
    };
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredPlanet = null;
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("keyup", this.onKeyUp.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("click", this.onClick.bind(this));
  }

  onKeyDown(event) {
    if (!this.audioSystem.userInteracted) {
      this.audioSystem.userInteracted = true;
      this.audioSystem.startAmbient();
    }
    
    this.keyboard[event.code] = true;
    if (CONFIG.controlKeys.includes(event.code)) {
      this.cameraSystem.onInput();
    }
    
    if (event.code === "KeyH") {
      this.toggleControlsHelp();
    }
    
    if (event.code === "Escape") {
      this.cameraSystem.exitFocus();
    }
    
    if (event.code === "KeyM") {
      this.audioSystem.toggleAmbient();
    }
  }

  onKeyUp(event) {
    this.keyboard[event.code] = false;
  }

  onMouseMove(event) {
    this.updateTooltip(event);
  }

  onClick(event) {
    this.handlePlanetClick(event);
  }

  toggleControlsHelp() {
    const helpOverlay = document.getElementById('controls-help');
    if (helpOverlay) {
      helpOverlay.classList.toggle('hidden');
    }
  }

  updateTooltip(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.cameraSystem.camera);
    const intersects = this.raycaster.intersectObjects(window.APP_STATE.planets);
    
    const tooltip = document.getElementById('planet-tooltip');
    
    if (intersects.length > 0) {
      const planet = intersects[0].object;
      if (planet.userData && planet.userData.name) {
        this.showTooltip(planet, event.clientX, event.clientY);
        this.hoveredPlanet = planet;
      }
    } else {
      this.hideTooltip();
      this.hoveredPlanet = null;
    }
  }

  showTooltip(planet, x, y) {
    const tooltip = document.getElementById('planet-tooltip');
    const nameEl = document.getElementById('planet-name');
    const infoEl = document.getElementById('planet-info');
    const distanceEl = document.getElementById('planet-distance');
    
    if (window.APP_STATE.shuttleModel) {
      const distance = planet.position.distanceTo(window.APP_STATE.shuttleModel.position);
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

  hideTooltip() {
    const tooltip = document.getElementById('planet-tooltip');
    tooltip.classList.add('hidden');
  }

  handlePlanetClick(event) {
    if (!this.audioSystem.userInteracted) {
      this.audioSystem.userInteracted = true;
      this.audioSystem.startAmbient();
    }
    
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.cameraSystem.camera);
    const intersects = this.raycaster.intersectObjects(window.APP_STATE.planets);
    
    if (intersects.length > 0) {
      const planet = intersects[0].object;
      if (planet.userData && planet.userData.name) {
        this.cameraSystem.focusOnPlanet(planet);
      }
    } else {
      this.cameraSystem.exitFocus();
    }
  }

  updateShuttleMovement(shuttleModel) {
    if (!shuttleModel) return;
    const controls = this.shuttleControls;
    const params = CONFIG.flight;
    
    if (this.keyboard["KeyS"]) controls.rotation.x -= params.rotationSpeed;
    if (this.keyboard["KeyW"]) controls.rotation.x += params.rotationSpeed;
    if (this.keyboard["KeyA"]) controls.rotation.y += params.rotationSpeed;
    if (this.keyboard["KeyD"]) controls.rotation.y -= params.rotationSpeed;
    if (this.keyboard["KeyQ"]) controls.rotation.z -= params.rollSpeed;
    if (this.keyboard["KeyE"]) controls.rotation.z += params.rollSpeed;
    
    controls.rotation.multiplyScalar(params.rotationDamping);
    shuttleModel.rotation.x += controls.rotation.x;
    shuttleModel.rotation.y += controls.rotation.y;
    shuttleModel.rotation.z += controls.rotation.z;
    
    const isThrusting = this.keyboard["ShiftLeft"] || this.keyboard["ShiftRight"];
    const isAscending = this.keyboard["Space"];
    const isDescending = this.keyboard["ControlLeft"] || this.keyboard["ControlRight"];
    
    const isAnyThrusterActive = isThrusting || isAscending || isDescending;
    
    if (isAnyThrusterActive && !this.audioSystem.isEngineRunning) {
      this.audioSystem.startEngine();
    } else if (!isAnyThrusterActive && this.audioSystem.isEngineRunning) {
      this.audioSystem.stopEngine();
    }
    
    if (isThrusting) {
      const forwardVector = new THREE.Vector3(0, 0, 1);
      forwardVector.applyQuaternion(shuttleModel.quaternion);
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
    shuttleModel.position.add(controls.velocity);
  }

  checkLaserFire() {
    return this.keyboard["KeyF"];
  }

  isThrusterActive() {
    return this.keyboard['ShiftLeft'] || this.keyboard['ShiftRight'];
  }
}