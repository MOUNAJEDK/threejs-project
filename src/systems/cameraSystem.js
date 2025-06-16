import * as THREE from "three";
import { CONFIG } from '../config/gameConfig.js';
import { animateCameraTo } from '../utils/helpers.js';

export class CameraSystem {
  constructor(camera, orbitControls) {
    this.camera = camera;
    this.orbitControls = orbitControls;
    this.state = {
      mode: "orbit",
      lastInputTime: 0,
      focusedPlanet: null,
      focusMode: false,
      transitioning: false,
      transitionStartTime: 0,
      transitionDuration: 1500,
      transitionData: null
    };
  }

  switchToChase() {
    if (this.state.mode === "chase") return;
    this.state.mode = "chase";
    this.state.focusMode = false;
    this.state.focusedPlanet = null;
    this.orbitControls.enabled = false;
  }

  switchToOrbit(shuttleModel) {
    if (this.state.mode === "orbit") return;
    
    if (shuttleModel && !this.state.transitioning) {
      this.startSmoothTransitionToOrbit(shuttleModel);
    } else {
      this.state.mode = "orbit";
      this.orbitControls.enabled = true;
    }
  }

  startSmoothTransitionToOrbit(shuttleModel) {
    const currentPos = this.camera.position.clone();
    const currentTarget = new THREE.Vector3();
    this.camera.getWorldDirection(currentTarget);
    currentTarget.multiplyScalar(10).add(this.camera.position);
    
    const orbitPosition = shuttleModel.position.clone().add(new THREE.Vector3(0, 20, 50));
    
    this.state.transitioning = true;
    this.state.transitionStartTime = Date.now();
    
    this.state.transitionData = {
      startPosition: currentPos,
      startTarget: currentTarget,
      endPosition: orbitPosition,
      endTarget: shuttleModel.position.clone()
    };
  }

  updateSmoothTransition() {
    if (!this.state.transitioning) return;
    
    const elapsed = Date.now() - this.state.transitionStartTime;
    const progress = Math.min(elapsed / this.state.transitionDuration, 1);
    
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    const transitionData = this.state.transitionData;
    
    this.camera.position.lerpVectors(
      transitionData.startPosition, 
      transitionData.endPosition, 
      easedProgress
    );
    
    const currentTarget = new THREE.Vector3();
    currentTarget.lerpVectors(
      transitionData.startTarget,
      transitionData.endTarget,
      easedProgress
    );
    
    this.camera.lookAt(currentTarget);
    
    if (easedProgress > 0.5) {
      this.orbitControls.target.lerpVectors(
        transitionData.startTarget,
        transitionData.endTarget,
        (easedProgress - 0.5) * 2
      );
    }
    
    if (progress >= 1) {
      this.state.mode = "orbit";
      this.state.transitioning = false;
      this.orbitControls.enabled = true;
      this.orbitControls.target.copy(transitionData.endTarget);
      this.orbitControls.update();
      
      this.state.transitionData = null;
    }
  }

  updateCameraMode() {
    const now = Date.now();
    const timeSinceLastInput = now - this.state.lastInputTime;
    if (
      this.state.mode === "chase" &&
      timeSinceLastInput > CONFIG.camera.orbitTimeoutMs
    ) {
      this.switchToOrbit();
    }
  }

  updateChase(shuttleModel) {
    if (!shuttleModel || this.state.mode !== "chase") return;
    const cameraParams = CONFIG.camera;
    const idealOffset = new THREE.Vector3(
      0,
      cameraParams.chaseHeight,
      -cameraParams.chaseDistance
    );
    idealOffset.applyQuaternion(shuttleModel.quaternion);
    const idealCameraPos = shuttleModel.position.clone().add(idealOffset);
    this.camera.position.lerp(idealCameraPos, cameraParams.chaseDamping);
    const forwardVector = new THREE.Vector3(0, 0, 3);
    forwardVector.applyQuaternion(shuttleModel.quaternion);
    const lookAtTarget = shuttleModel.position.clone().add(forwardVector);
    this.camera.lookAt(lookAtTarget);
  }

  updateFocus() {
    if (!this.state.focusMode || !this.state.focusedPlanet) return;
    
    const planet = this.state.focusedPlanet;
    const worldPosition = new THREE.Vector3();
    planet.getWorldPosition(worldPosition);
    
    this.orbitControls.target.lerp(worldPosition, 0.02);
    this.orbitControls.update();
  }

  focusOnPlanet(planet) {
    if (this.state.mode === "chase") {
      this.switchToOrbit();
    }
    
    this.state.focusMode = true;
    this.state.focusedPlanet = planet;
    
    let optimalDistance;
    if (planet.userData.name === "Sun") {
      optimalDistance = planet.userData.size * 3;
    } else if (planet.userData.name === "Moon") {
      optimalDistance = Math.max(planet.userData.size * 15, 25);
    } else {
      optimalDistance = planet.userData.size * 8;
    }
    
    const worldPosition = new THREE.Vector3();
    planet.getWorldPosition(worldPosition);

    console.log(`Focusing on ${planet.userData.name}:`);
    console.log(`  Size: ${planet.userData.size}`);
    console.log(`  Optimal distance: ${optimalDistance}`);
    console.log(`  World position:`, worldPosition);

    const cameraPosition = worldPosition.clone();
    const angle = Math.PI / 6;
    cameraPosition.x += Math.cos(angle) * optimalDistance;
    cameraPosition.y += Math.sin(angle) * optimalDistance;
    cameraPosition.z += optimalDistance * 0.5;
    
    console.log(`  Camera position:`, cameraPosition);
    
    animateCameraTo(this.camera, this.orbitControls, cameraPosition, worldPosition);
  }

  exitFocus() {
    if (this.state.focusMode) {
      this.state.focusMode = false;
      this.state.focusedPlanet = null;
    }
  }

  onInput() {
    this.state.lastInputTime = Date.now();
    if (this.state.mode === "orbit") this.switchToChase();
  }
}