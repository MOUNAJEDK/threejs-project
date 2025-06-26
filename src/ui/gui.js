import { CONFIG } from '../config/gameConfig.js';

export class GUI {
  constructor(shuttle, cameraSystem, audioSystem, particleSystem, solarSystem, ambientLight, directionalLight, bloomPass) {
    this.shuttle = shuttle;
    this.cameraSystem = cameraSystem;
    this.audioSystem = audioSystem;
    this.particleSystem = particleSystem;
    this.solarSystem = solarSystem;
    this.ambientLight = ambientLight;
    this.directionalLight = directionalLight;
    this.bloomPass = bloomPass;
    
    this.setup();
  }

  setup() {
    const gui = document.getElementById('custom-gui');
    gui.style.display = 'block';

    const headers = document.querySelectorAll('.gui-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const section = header.parentElement;
        section.classList.toggle('open');
      });
    });

    this.setupFlightControls();
    this.setupCameraControls();
    this.setupEnemyShuttle();
    this.setupWeapons();
    this.setupThrusterEffects();
    this.setupLighting();
    this.setupVisualEffects();
    this.setupAudioControls();
    this.setupTimeControls();
    this.setupFPSCounter();
    this.setInitialValues();
  }

  setupFlightControls() {
    document.getElementById('thrust').addEventListener('input', e => CONFIG.flight.thrust = parseFloat(e.target.value));
    document.getElementById('max-velocity').addEventListener('input', e => CONFIG.flight.maxVelocity = parseFloat(e.target.value));
    document.getElementById('rotation-speed').addEventListener('input', e => CONFIG.flight.rotationSpeed = parseFloat(e.target.value));
    document.getElementById('roll-speed').addEventListener('input', e => CONFIG.flight.rollSpeed = parseFloat(e.target.value));
    document.getElementById('reset-shuttle').addEventListener('click', () => this.shuttle.reset());
  }

  setupCameraControls() {
    document.getElementById('camera-mode').addEventListener('change', e => {
      if (e.target.value === 'chase') this.cameraSystem.switchToChase();
      else this.cameraSystem.switchToOrbit(this.shuttle.getModel());
    });
    document.getElementById('chase-distance').addEventListener('input', e => CONFIG.camera.chaseDistance = parseInt(e.target.value));
    document.getElementById('chase-height').addEventListener('input', e => CONFIG.camera.chaseHeight = parseInt(e.target.value));
  }

  setupEnemyShuttle() {
    document.getElementById('enemy-x').addEventListener('input', e => {
      if (window.APP_STATE.enemyShuttleModel) {
        window.APP_STATE.enemyShuttleModel.position.x = parseInt(e.target.value);
      }
    });
    document.getElementById('enemy-y').addEventListener('input', e => {
      if (window.APP_STATE.enemyShuttleModel) {
        window.APP_STATE.enemyShuttleModel.position.y = parseInt(e.target.value);
      }
    });
    document.getElementById('enemy-z').addEventListener('input', e => {
      if (window.APP_STATE.enemyShuttleModel) {
        window.APP_STATE.enemyShuttleModel.position.z = parseInt(e.target.value);
      }
    });
    document.getElementById('enemy-scale').addEventListener('input', e => {
      if (window.APP_STATE.enemyShuttleModel) {
        const scale = parseFloat(e.target.value);
        window.APP_STATE.enemyShuttleModel.scale.setScalar(scale);
      }
    });
    document.getElementById('enemy-rotation-y').addEventListener('input', e => {
      if (window.APP_STATE.enemyShuttleModel) {
        window.APP_STATE.enemyShuttleModel.rotation.y = parseFloat(e.target.value);
      }
    });
    document.getElementById('enemy-speed').addEventListener('input', e => {
      CONFIG.enemyMovement.speed = parseFloat(e.target.value);
    });
    document.getElementById('enemy-range').addEventListener('input', e => {
      CONFIG.enemyMovement.maxDistance = parseInt(e.target.value);
    });
    document.getElementById('show-hitbox').addEventListener('change', e => {
      if (window.enemyShuttles && window.enemyShuttles.length > 0) {
        window.enemyShuttles.forEach(enemyShuttle => {
          if (enemyShuttle.getHitbox()) {
            enemyShuttle.getHitbox().visible = e.target.checked;
          }
        });
        console.log("Hitbox visibility set to:", e.target.checked, "for all enemy shuttles");
      } else {
        console.log("Enemy shuttles not found");
      }
    });
    document.getElementById('reset-enemy').addEventListener('click', () => {
      if (window.APP_STATE.enemyShuttleModel) {
        window.APP_STATE.enemyShuttleModel.position.set(CONFIG.enemyModel.position.x, CONFIG.enemyModel.position.y, CONFIG.enemyModel.position.z);
        window.APP_STATE.enemyShuttleModel.rotation.set(CONFIG.enemyModel.rotation.x, CONFIG.enemyModel.rotation.y, CONFIG.enemyModel.rotation.z);
        window.APP_STATE.enemyShuttleModel.scale.setScalar(CONFIG.enemyModel.scale);
        document.getElementById('enemy-x').value = CONFIG.enemyModel.position.x;
        document.getElementById('enemy-y').value = CONFIG.enemyModel.position.y;
        document.getElementById('enemy-z').value = CONFIG.enemyModel.position.z;
        document.getElementById('enemy-scale').value = CONFIG.enemyModel.scale;
        document.getElementById('enemy-rotation-y').value = CONFIG.enemyModel.rotation.y;
      }
    });
  }

  setupWeapons() {
    document.getElementById('laser-color').addEventListener('input', e => CONFIG.lasers.color = parseInt(e.target.value.replace('#', '0x')));
    document.getElementById('laser-speed').addEventListener('input', e => CONFIG.lasers.speed = parseFloat(e.target.value));
    document.getElementById('fire-rate').addEventListener('input', e => CONFIG.lasers.fireRate = parseInt(e.target.value));
    document.getElementById('fire-laser').addEventListener('click', () => {
      if (this.shuttle.getModel()) {
        this.particleSystem.fireLaser(this.shuttle.getModel());
      }
    });
  }

  setupThrusterEffects() {
    document.getElementById('thruster-color').addEventListener('input', e => {
      const color = parseInt(e.target.value.replace('#', '0x'));
      CONFIG.thrusterEffect.baseColor = color;
      this.particleSystem.thrusterParticles?.forEach(p => p.userData.originalColor = color);
    });
    document.getElementById('particle-count').addEventListener('input', e => {
      CONFIG.thrusterEffect.particleCount = parseInt(e.target.value);
      this.particleSystem.createThrusterParticles();
    });
    document.getElementById('particle-life').addEventListener('input', e => CONFIG.thrusterEffect.particleLife = parseFloat(e.target.value));
  }

  setupLighting() {
    document.getElementById('ambient-intensity').addEventListener('input', e => this.ambientLight.intensity = parseFloat(e.target.value));
    document.getElementById('directional-intensity').addEventListener('input', e => this.directionalLight.intensity = parseFloat(e.target.value));
  }

  setupVisualEffects() {
    document.getElementById('toggle-wireframe').addEventListener('change', e => {
      if (this.shuttle.getModel()) {
        this.shuttle.getModel().traverse(child => {
          if (child.isMesh) child.material.wireframe = e.target.checked;
        });
      }
    });
    document.getElementById('bloom-strength').addEventListener('input', e => this.bloomPass.strength = parseFloat(e.target.value));
    document.getElementById('bloom-radius').addEventListener('input', e => this.bloomPass.radius = parseFloat(e.target.value));
    document.getElementById('bloom-threshold').addEventListener('input', e => this.bloomPass.threshold = parseFloat(e.target.value));
  }

  setupAudioControls() {
    document.getElementById('ambient-volume').addEventListener('input', e => this.audioSystem.setAmbientVolume(parseFloat(e.target.value)));
    document.getElementById('engine-volume').addEventListener('input', e => this.audioSystem.setEngineVolume(parseFloat(e.target.value)));
    document.getElementById('laser-volume').addEventListener('input', e => this.audioSystem.setLaserVolume(parseFloat(e.target.value)));
    document.getElementById('toggle-ambient').addEventListener('click', () => this.audioSystem.toggleAmbient());
  }

  setupTimeControls() {
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
      this.solarSystem.setTimeSpeed(parseFloat(timeSpeed.value));
    });
    timeSpeed.addEventListener('input', e => {
      this.solarSystem.setTimeSpeed(parseFloat(e.target.value));
    });
  }

  setupFPSCounter() {
    const fpsCounter = document.getElementById('fps-counter');
    let frames = 0;
    let lastTime = performance.now();
    
    const updateFPS = () => {
      frames++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        fpsCounter.textContent = Math.round((frames * 1000) / (now - lastTime));
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(updateFPS);
    };
    updateFPS();
  }

  setInitialValues() {
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
    document.getElementById('ambient-intensity').value = this.ambientLight.intensity;
    document.getElementById('directional-intensity').value = this.directionalLight.intensity;
    document.getElementById('bloom-strength').value = this.bloomPass.strength;
    document.getElementById('bloom-radius').value = this.bloomPass.radius;
    document.getElementById('bloom-threshold').value = this.bloomPass.threshold;
    document.getElementById('ambient-volume').value = CONFIG.audio.ambientVolume;
    document.getElementById('engine-volume').value = CONFIG.audio.engineVolume;
    document.getElementById('laser-volume').value = CONFIG.audio.laserVolume;
    document.getElementById('time-speed').value = this.solarSystem.timeSpeed;
    document.getElementById('enemy-x').value = CONFIG.enemyModel.position.x;
    document.getElementById('enemy-y').value = CONFIG.enemyModel.position.y;
    document.getElementById('enemy-z').value = CONFIG.enemyModel.position.z;
    document.getElementById('enemy-scale').value = CONFIG.enemyModel.scale;
    document.getElementById('enemy-rotation-y').value = CONFIG.enemyModel.rotation.y;
    document.getElementById('enemy-speed').value = CONFIG.enemyMovement.speed;
    document.getElementById('enemy-range').value = CONFIG.enemyMovement.maxDistance;
  }
}