import * as THREE from "three";
import { CONFIG } from '../config/gameConfig.js';
import { updateLoadingProgress } from '../utils/loaders.js';

export class ParticleSystem {
  constructor(scene, textureLoader, audioSystem) {
    this.scene = scene;
    this.textureLoader = textureLoader;
    this.audioSystem = audioSystem;
    this.lasers = [];
    this.laserHardpoints = [];
    this.lastFireTime = 0;
    this.thrusterParticles = [];
    this.thrusterPositions = [];
    this.thrusterVelocities = [];
    this.thrusterLife = [];
  }

  createThrusterParticles() {
    const config = CONFIG.thrusterEffect;
    
    this.thrusterPositions = [];
    this.thrusterVelocities = [];
    this.thrusterLife = [];
    this.thrusterParticles = [];
    
    const glowTexture = this.textureLoader.load(
      '/textures/glow.png',
      () => updateLoadingProgress(),
      undefined,
      (error) => {
        console.warn("Failed to load glow texture:", error);
        updateLoadingProgress();
      }
    );
    
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
      particle.position.set(-10000, -10000, -10000);
      this.scene.add(particle);
      
      particle.userData.originalColor = config.baseColor;
      
      this.thrusterParticles.push(particle);
      this.thrusterPositions.push(new THREE.Vector3());
      this.thrusterVelocities.push(new THREE.Vector3());
      this.thrusterLife.push(0);
    }
  }

  updateThrusterParticles(deltaTime, shuttleModel, isThrusting) {
    if (!shuttleModel || !this.thrusterParticles.length) return;
    
    const config = CONFIG.thrusterEffect;
    
    for (let i = 0; i < config.particleCount; i++) {
      const life = this.thrusterLife[i];
      const particle = this.thrusterParticles[i];
      
      if (isThrusting && life <= 0) {
        const enginePos = new THREE.Vector3(0, 0, config.engineOffset);
        enginePos.applyQuaternion(shuttleModel.quaternion);
        enginePos.add(shuttleModel.position);
        
        const spread = 3;
        enginePos.add(new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          Math.random() * -2
        ));
        
        this.thrusterPositions[i].copy(enginePos);
        
        const exhaustVelocity = new THREE.Vector3(0, 0, -config.particleSpeed);
        exhaustVelocity.applyQuaternion(shuttleModel.quaternion);
        
        exhaustVelocity.add(new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 0.8
        ));
        
        this.thrusterVelocities[i].copy(exhaustVelocity);
        this.thrusterLife[i] = config.particleLife;
      }
      
      if (life > 0) {
        this.thrusterLife[i] -= deltaTime;
        
        this.thrusterVelocities[i].multiplyScalar(0.99);
        this.thrusterVelocities[i].add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          0
        ));
        
        this.thrusterPositions[i].add(
          this.thrusterVelocities[i].clone().multiplyScalar(deltaTime * 60)
        );
        
        particle.position.copy(this.thrusterPositions[i]);
        
        const lifePercent = this.thrusterLife[i] / config.particleLife;
        const fadeOut = Math.pow(lifePercent, 0.8);
        particle.material.opacity = fadeOut * 0.8;
        
        const expansion = 1 + (1 - lifePercent) * 1.5;
        particle.scale.setScalar(config.particleSize * expansion);
        
        const intensity = 0.3 + lifePercent * 0.7;
        const baseColor = new THREE.Color(particle.userData.originalColor || CONFIG.thrusterEffect.baseColor);
        particle.material.color.setRGB(
          baseColor.r * intensity,
          baseColor.g * intensity, 
          baseColor.b * intensity
        );
        
        particle.visible = true;
      } else {
        particle.visible = false;
        particle.scale.setScalar(config.particleSize);
        particle.material.color.setHex(particle.userData.originalColor);
        particle.material.opacity = 0.8;
      }
    }
  }

  fireLaser(shuttleModel) {
    const now = Date.now();
    if (now - this.lastFireTime < CONFIG.lasers.fireRate) return;
    this.lastFireTime = now;

    this.audioSystem.playLaser();

    const laserConfig = CONFIG.lasers;

    const particleTexture = this.textureLoader.load(
      "/textures/particle.png",
      () => updateLoadingProgress(),
      undefined,
      (error) => {
        console.warn("Failed to load laser particle texture:", error);
        updateLoadingProgress();
      }
    );

    this.laserHardpoints.forEach((hardpoint) => {
      const positions = [];
      for (let i = 0; i < laserConfig.particleCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(0.1);
        const y = THREE.MathUtils.randFloatSpread(0.1);
        const z = THREE.MathUtils.randFloat(0, 2);
        positions.push(x, y, z);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );

      const material = new THREE.PointsMaterial({
        color: laserConfig.color,
        size: laserConfig.particleSize,
        map: particleTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      });

      const laserBolt = new THREE.Points(geometry, material);

      const position = new THREE.Vector3();
      hardpoint.getWorldPosition(position);

      laserBolt.position.copy(position);
      laserBolt.quaternion.copy(shuttleModel.quaternion);

      const velocity = new THREE.Vector3(0, 0, laserConfig.speed);
      velocity.applyQuaternion(shuttleModel.quaternion);

      laserBolt.userData = { velocity, distanceTraveled: 0 };

      this.lasers.push(laserBolt);
      this.scene.add(laserBolt);
    });
  }

  updateLasers(deltaTime) {
    const laserConfig = CONFIG.lasers;
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];

      const distanceThisFrame = laser.userData.velocity.length();
      laser.position.add(laser.userData.velocity);
      laser.userData.distanceTraveled += distanceThisFrame;

      if (laser.userData.distanceTraveled > laserConfig.maxLength) {
        this.scene.remove(laser);
        laser.geometry.dispose();
        laser.material.dispose();
        this.lasers.splice(i, 1);
      }
    }
  }

  createSunHeatEffect() {
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
    
    const heatTexture = this.textureLoader.load(
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
    this.scene.add(heatParticles);
    
    return heatParticles;
  }

  setLaserHardpoints(hardpoints) {
    this.laserHardpoints = hardpoints;
  }
}