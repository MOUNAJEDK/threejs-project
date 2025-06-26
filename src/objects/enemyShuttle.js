import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CONFIG } from '../config/gameConfig.js';
import { updateLoadingProgress } from '../utils/loaders.js';

export class EnemyShuttle {
  constructor(scene, spawnPosition) {
    this.scene = scene;
    this.model = null;
    this.hitbox = null;
    this.isDestroyed = false;
    this.loader = new GLTFLoader();
    this.spawnPosition = spawnPosition;
    
    this.startPosition = new THREE.Vector3(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    this.currentTarget = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.lastDirectionChange = 0;
    
    this.generateNewTarget();
    
    this.load();
  }

  load() {
    console.log("Starting to load enemy shuttle from:", CONFIG.enemyModel.path);
    this.loader.load(
      CONFIG.enemyModel.path,
      (gltf) => {
        console.log("Enemy shuttle GLTF loaded successfully:", gltf);
        this.model = gltf.scene;
        this.model.scale.setScalar(CONFIG.enemyModel.scale);
        this.model.position.set(this.spawnPosition.x, this.spawnPosition.y, this.spawnPosition.z);
        this.model.rotation.set(CONFIG.enemyModel.rotation.x, CONFIG.enemyModel.rotation.y, CONFIG.enemyModel.rotation.z);
        
        console.log("Enemy shuttle positioned at:", this.model.position.x, this.model.position.y, this.model.position.z);
        console.log("Enemy shuttle scale:", this.model.scale.x, this.model.scale.y, this.model.scale.z);
        console.log("Enemy shuttle rotation:", this.model.rotation.x, this.model.rotation.y, this.model.rotation.z);
        
        this.model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            console.log("Found enemy shuttle mesh:", node.name, "visible:", node.visible);
          }
        });

        this.createHitbox();
        
        this.scene.add(this.model);
        console.log("Enemy shuttle added to scene. Scene children count:", this.scene.children.length);
        
        updateLoadingProgress();
        console.log("Enemy shuttle model loaded successfully.");
        
        if (window.APP_STATE) {
          window.APP_STATE.enemyShuttleModel = this.model;
          console.log("Enemy shuttle model set in APP_STATE");
        }
      },
      (progress) => {
        console.log("Enemy shuttle loading progress:", progress);
      },
      (error) => {
        console.error("An error occurred while loading the enemy model:", error);
        updateLoadingProgress();
      }
    );
  }

  createHitbox() {
    const scale = CONFIG.enemyModel.scale;
    const hitboxGeometry = new THREE.BoxGeometry(15/scale, 12/scale, 20/scale);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    this.hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    this.hitbox.position.set(0, 0, 0);
    this.hitbox.visible = false;
    this.model.add(this.hitbox);
    
    console.log("Enemy shuttle hitbox created with dimensions:", 15/scale, 8/scale, 20/scale);
    console.log("Model scale:", scale);
  }

  checkCollision(position, radius = 1) {
    if (this.isDestroyed || !this.hitbox) return false;
    
    const worldPosition = new THREE.Vector3();
    this.hitbox.getWorldPosition(worldPosition);
    const distance = worldPosition.distanceTo(position);
    const hitboxSize = Math.max(15, 12, 20) / 2;
    
    return distance <= (hitboxSize + radius);
  }

  destroy() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    const explosionPosition = new THREE.Vector3();
    this.model.getWorldPosition(explosionPosition);
    
    if (window.audioSystem) {
      window.audioSystem.playExplosion();
    }
    
    if (window.particleSystem) {
      window.particleSystem.createExplosion(explosionPosition, 2);
    }
    
    setTimeout(() => {
      if (this.model && this.model.parent) {
        this.scene.remove(this.model);
      }
      
      if (window.APP_STATE && window.APP_STATE.enemyShuttleModels) {
        const index = window.APP_STATE.enemyShuttleModels.indexOf(this.model);
        if (index > -1) {
          window.APP_STATE.enemyShuttleModels.splice(index, 1);
        }
      }
    }, 200);
    
    console.log("Enemy shuttle destroyed with explosion!");
  }

  getModel() {
    return this.model;
  }

  getHitbox() {
    return this.hitbox;
  }

  getIsDestroyed() {
    return this.isDestroyed;
  }

  generateNewTarget() {
    const config = CONFIG.enemyMovement;
    this.currentTarget.copy(this.startPosition);
    this.currentTarget.x += (Math.random() - 0.5) * config.maxDistance;
    this.currentTarget.y += (Math.random() - 0.5) * config.maxDistance;
    this.currentTarget.z += (Math.random() - 0.5) * config.maxDistance;
  }

  update(deltaTime) {
    if (this.isDestroyed || !this.model) return;

    const config = CONFIG.enemyMovement;
    const direction = new THREE.Vector3();
    direction.subVectors(this.currentTarget, this.model.position);
    
    if (direction.length() < 3) {
      this.generateNewTarget();
    }
    
    direction.subVectors(this.currentTarget, this.model.position);
    direction.normalize();
    
    this.velocity.lerp(direction.multiplyScalar(config.speed), config.smoothing);
    this.model.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    const lookDirection = this.velocity.clone().normalize();
    if (lookDirection.length() > 0.1) {
      const targetRotation = Math.atan2(lookDirection.x, lookDirection.z);
      this.model.rotation.y = THREE.MathUtils.lerp(this.model.rotation.y, targetRotation + Math.PI, 0.03);
    }
  }
}