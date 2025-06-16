import * as THREE from "three";
import { CONFIG } from '../config/gameConfig.js';
import { updateLoadingProgress } from '../utils/loaders.js';
import { createOrbitalLine } from '../utils/helpers.js';

export class SolarSystem {
  constructor(scene, textureLoader, particleSystem) {
    this.scene = scene;
    this.textureLoader = textureLoader;
    this.particleSystem = particleSystem;
    this.planets = [];
    this.sun = null;
    this.sunLight = null;
    this.sunGlow = null;
    this.sunHeatEffect = null;
    this.timeSpeed = 1.0;
    
    this.createSun();
    this.createPlanets();
  }

  createSun() {
    const sunGeometry = new THREE.SphereGeometry(CONFIG.sun.size, 64, 64);
    const sunTexture = this.textureLoader.load(
      CONFIG.sun.texture,
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
      emissiveIntensity: CONFIG.sun.emissiveIntensity,
      toneMapped: true
    });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.sun.position.set(0, 0, 0);
    this.sun.userData = {
      name: "Sun",
      info: CONFIG.sun.info,
      size: CONFIG.sun.size,
      distance: 0
    };
    console.log("Sun created:", this.sun);
    console.log("Sun position:", this.sun.position);
    console.log("Sun scale:", this.sun.scale);
    this.scene.add(this.sun);
    console.log("Sun added to scene");
    this.planets.push(this.sun);

    this.sunLight = new THREE.PointLight(0xffaa44, CONFIG.sun.lightIntensity, 2000);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 2000;
    this.scene.add(this.sunLight);

    const sunGlowGeometry = new THREE.SphereGeometry(CONFIG.sun.glowSize, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    this.sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    this.sunGlow.position.set(0, 0, 0);
    this.scene.add(this.sunGlow);

    this.sunHeatEffect = this.particleSystem.createSunHeatEffect();
  }

  createPlanets() {
    CONFIG.solarSystem.forEach((planetConfig) => {
      createOrbitalLine(planetConfig.distance, this.scene);
      
      const planetTexture = this.textureLoader.load(
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
      
      if (planetConfig.name === "Saturn") {
        const ringTexture = this.textureLoader.load(
          CONFIG.saturn.ringTexture,
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
        const ringGeometry = new THREE.RingGeometry(
          planetConfig.size * CONFIG.saturn.ringInnerRadius, 
          planetConfig.size * CONFIG.saturn.ringOuterRadius, 
          64
        );
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
      
      if (planetConfig.name === "Earth") {
        const moonTexture = this.textureLoader.load(
          CONFIG.moon.texture,
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
        const moonGeometry = new THREE.SphereGeometry(CONFIG.moon.size, 32, 32);
        const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.set(CONFIG.moon.distance, 0, 0);
        moon.userData = { 
          distance: CONFIG.moon.distance, 
          speed: CONFIG.moon.speed, 
          angle: 0,
          name: "Moon",
          size: CONFIG.moon.size,
          info: CONFIG.moon.info
        };
        planet.add(moon);
        this.planets.push(moon);
      }
      
      planet.position.set(planetConfig.distance, 0, 0);
      planet.receiveShadow = true;
      
      planet.userData = {
        distance: planetConfig.distance,
        speed: planetConfig.speed,
        angle: 0,
        name: planetConfig.name,
        info: planetConfig.info,
        size: planetConfig.size
      };
      
      this.scene.add(planet);
      this.planets.push(planet);
    });
  }

  update() {
    this.planets.forEach((planet) => {
      planet.rotation.y += 0.0005;
      
      if (planet.userData && planet.userData.name !== "Moon" && planet.userData.name !== "Sun") {
        planet.userData.angle += planet.userData.speed * this.timeSpeed;
        planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
        planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;
      }
      
      if (planet.userData && planet.userData.name === "Moon") {
        planet.userData.angle += planet.userData.speed * this.timeSpeed;
        planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
        planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;
      }
    });

    if (this.sun) {
      this.sun.rotation.y += 0.001;
      
      if (this.sunGlow) {
        this.sunGlow.material.opacity = 0.05 + Math.sin(Date.now() * 0.001) * 0.03;
        this.sunGlow.rotation.y += 0.002;
      }
      
      if (this.sunHeatEffect) {
        this.sunHeatEffect.rotation.y += 0.0005;
        this.sunHeatEffect.rotation.z += 0.0003;
        
        const positions = this.sunHeatEffect.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          const time = Date.now() * 0.001;
          positions[i] += Math.sin(time + i) * 0.02;
          positions[i + 1] += Math.cos(time + i) * 0.02;
          positions[i + 2] += Math.sin(time * 0.5 + i) * 0.02;
        }
        this.sunHeatEffect.geometry.attributes.position.needsUpdate = true;
      }
      
      if (this.sunLight) {
        this.sunLight.intensity = 2.8 + Math.sin(Date.now() * 0.002) * 0.4;
      }
    }
  }

  setTimeSpeed(speed) {
    this.timeSpeed = speed;
  }

  getPlanets() {
    return this.planets;
  }
}