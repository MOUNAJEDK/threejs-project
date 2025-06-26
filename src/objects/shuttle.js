import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CONFIG } from '../config/gameConfig.js';
import { updateLoadingProgress } from '../utils/loaders.js';

export class Shuttle {
  constructor(scene, particleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.model = null;
    this.hardpoints = [];
    this.loader = new GLTFLoader();
    
    this.load();
  }

  load() {
    this.loader.load(
      CONFIG.model.path,
      (gltf) => {
        this.model = gltf.scene;
        this.model.scale.setScalar(CONFIG.model.scale);
        this.model.position.set(CONFIG.model.position.x, CONFIG.model.position.y, CONFIG.model.position.z);
        this.model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        this.createHardpoints();
        this.particleSystem.createThrusterParticles();
        this.particleSystem.setLaserHardpoints(this.hardpoints);
        
        console.log("Thruster particle system created");
        console.log("Number of particles created:", this.particleSystem.thrusterParticles.length);

        this.scene.add(this.model);
        updateLoadingProgress();
        console.log("Shuttle model loaded successfully.");
        
        if (window.APP_STATE) {
          window.APP_STATE.shuttleModel = this.model;
          
          if (window.initializeGUI && typeof window.initializeGUI === 'function') {
            window.initializeGUI();
          }
        }
      },
      undefined,
      (error) => {
        console.error("An error occurred while loading the model:", error);
        updateLoadingProgress();
      }
    );
  }

  createHardpoints() {
    const hardpointL = new THREE.Object3D();
    const hardpointR = new THREE.Object3D();

    hardpointL.position.set(-775, -50, 400);
    hardpointR.position.set(775, -50, 400);

    this.model.add(hardpointL);
    this.model.add(hardpointR);
    this.hardpoints.push(hardpointL, hardpointR);
  }

  getModel() {
    return this.model;
  }

  getHardpoints() {
    return this.hardpoints;
  }

  reset() {
    if (!this.model) return;
    this.model.position.set(CONFIG.model.position.x, CONFIG.model.position.y, CONFIG.model.position.z);
    this.model.rotation.set(0, 0, 0);
  }
}