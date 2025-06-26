import { CONFIG } from '../config/gameConfig.js';
import { updateLoadingProgress } from '../utils/loaders.js';

export class AudioSystem {
  constructor() {
    this.ambientSound = null;
    this.engineStartSound = null;
    this.engineStopSound = null;
    this.laserShootSound = null;
    this.explosionSound = null;
    this.isAmbientPlaying = false;
    this.isEngineRunning = false;
    this.userInteracted = false;
    this.engineFadeTimeout = null;
    
    this.initialize();
  }

  initialize() {
    this.ambientSound = new Audio(CONFIG.audio.ambientPath);
    this.ambientSound.loop = true;
    this.ambientSound.volume = 0;
    this.ambientSound.preload = 'auto';
    
    this.engineStartSound = new Audio(CONFIG.audio.engineStartPath);
    this.engineStartSound.loop = true;
    this.engineStartSound.volume = 0;
    this.engineStartSound.preload = 'auto';
    
    this.engineStopSound = new Audio(CONFIG.audio.engineStopPath);
    this.engineStopSound.loop = false;
    this.engineStopSound.volume = CONFIG.audio.engineVolume;
    this.engineStopSound.preload = 'auto';
    
    this.laserShootSound = new Audio(CONFIG.audio.laserShootPath);
    this.laserShootSound.loop = false;
    this.laserShootSound.volume = CONFIG.audio.laserVolume;
    this.laserShootSound.preload = 'auto';
    
    this.explosionSound = new Audio(CONFIG.audio.explosionPath);
    this.explosionSound.loop = false;
    this.explosionSound.volume = CONFIG.audio.explosionVolume;
    this.explosionSound.preload = 'auto';
    
    this.ambientSound.addEventListener('canplaythrough', () => {
      console.log('Ambient sound loaded and ready to play');
      updateLoadingProgress();
    });
    
    this.ambientSound.addEventListener('error', (e) => {
      console.warn('Failed to load ambient sound:', e);
      updateLoadingProgress();
    });
    
    this.engineStartSound.addEventListener('canplaythrough', () => {
      console.log('Engine start sound loaded and ready to play');
      updateLoadingProgress();
    });
    
    this.engineStartSound.addEventListener('error', (e) => {
      console.warn('Failed to load engine start sound:', e);
      updateLoadingProgress();
    });
    
    this.engineStopSound.addEventListener('canplaythrough', () => {
      console.log('Engine stop sound loaded and ready to play');
      updateLoadingProgress();
    });
    
    this.engineStopSound.addEventListener('error', (e) => {
      console.warn('Failed to load engine stop sound:', e);
      updateLoadingProgress();
    });
    
    this.laserShootSound.addEventListener('canplaythrough', () => {
      console.log('Laser shoot sound loaded and ready to play');
      updateLoadingProgress();
    });
    
    this.laserShootSound.addEventListener('error', (e) => {
      console.warn('Failed to load laser shoot sound:', e);
      updateLoadingProgress();
    });
    
    this.explosionSound.addEventListener('canplaythrough', () => {
      console.log('Explosion sound loaded and ready to play');
      updateLoadingProgress();
    });
    
    this.explosionSound.addEventListener('error', (e) => {
      console.warn('Failed to load explosion sound:', e);
      updateLoadingProgress();
    });
  }

  startAmbient() {
    if (!this.ambientSound || this.isAmbientPlaying) return;
    
    try {
      const playPromise = this.ambientSound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isAmbientPlaying = true;
          this.fadeInAmbient();
          console.log('Ambient sound started successfully');
        }).catch((error) => {
          console.log('Autoplay prevented, will start on user interaction:', error);
        });
      }
    } catch (error) {
      console.log('Audio play failed:', error);
    }
  }

  fadeInAmbient() {
    if (!this.ambientSound) return;
    
    const startTime = Date.now();
    const targetVolume = CONFIG.audio.ambientVolume;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / CONFIG.audio.fadeInDuration, 1);
      
      this.ambientSound.volume = progress * targetVolume;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  setAmbientVolume(volume) {
    if (this.ambientSound) {
      this.ambientSound.volume = volume;
      CONFIG.audio.ambientVolume = volume;
    }
  }

  setEngineVolume(volume) {
    CONFIG.audio.engineVolume = volume;
    if (this.engineStartSound) {
      this.engineStartSound.volume = this.isEngineRunning ? volume : 0;
    }
    if (this.engineStopSound) {
      this.engineStopSound.volume = volume;
    }
  }

  setLaserVolume(volume) {
    CONFIG.audio.laserVolume = volume;
    if (this.laserShootSound) {
      this.laserShootSound.volume = volume;
    }
  }

  toggleAmbient() {
    if (!this.ambientSound) return;
    
    if (this.isAmbientPlaying) {
      this.ambientSound.pause();
      this.isAmbientPlaying = false;
    } else {
      this.startAmbient();
    }
  }

  playLaser() {
    if (!this.laserShootSound || !this.userInteracted) return;
    
    try {
      this.laserShootSound.currentTime = 0;
      const playPromise = this.laserShootSound.play();
      
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

  startEngine() {
    if (!this.engineStartSound || this.isEngineRunning) return;
    if (!this.userInteracted) return;
    
    if (this.engineFadeTimeout) {
      clearTimeout(this.engineFadeTimeout);
      this.engineFadeTimeout = null;
    }
    
    try {
      const playPromise = this.engineStartSound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isEngineRunning = true;
          this.fadeInEngine();
          console.log('Engine sound started successfully');
        }).catch((error) => {
          console.log('Engine sound play failed:', error);
        });
      }
    } catch (error) {
      console.log('Engine audio play failed:', error);
    }
  }

  stopEngine() {
    if (!this.isEngineRunning) return;
    
    this.fadeOutEngine();
    
    if (this.engineStopSound && this.userInteracted) {
      try {
        this.engineStopSound.currentTime = 0;
        this.engineStopSound.play();
        console.log('Engine stop sound played');
      } catch (error) {
        console.log('Engine stop sound play failed:', error);
      }
    }
    
    this.isEngineRunning = false;
  }

  fadeInEngine() {
    if (!this.engineStartSound) return;
    
    const startTime = Date.now();
    const targetVolume = CONFIG.audio.engineVolume;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / CONFIG.audio.engineFadeDuration, 1);
      
      this.engineStartSound.volume = progress * targetVolume;
      
      if (progress < 1 && this.isEngineRunning) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  fadeOutEngine() {
    if (!this.engineStartSound) return;
    
    const startTime = Date.now();
    const startVolume = this.engineStartSound.volume;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / CONFIG.audio.engineFadeDuration, 1);
      
      this.engineStartSound.volume = startVolume * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.engineStartSound.pause();
        this.engineStartSound.currentTime = 0;
      }
    };
    
    animate();
  }

  playExplosion() {
    if (!this.explosionSound) return;
    if (!this.userInteracted) return;
    
    try {
      this.explosionSound.currentTime = 0;
      const playPromise = this.explosionSound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Explosion sound played successfully');
        }).catch((error) => {
          console.log('Explosion sound play failed:', error);
        });
      }
    } catch (error) {
      console.log('Explosion audio play failed:', error);
    }
  }

  setExplosionVolume(volume) {
    if (this.explosionSound) {
      this.explosionSound.volume = volume;
    }
  }
}