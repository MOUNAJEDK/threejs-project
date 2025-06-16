import * as THREE from "three";

export function toggleControlsHelp() {
  const helpOverlay = document.getElementById('controls-help');
  if (helpOverlay) {
    helpOverlay.classList.toggle('hidden');
  }
}

export function resetShuttlePosition(shuttleModel, shuttleControls, config) {
  if (!shuttleModel) return;
  shuttleModel.position.set(config.model.position.x, config.model.position.y, config.model.position.z);
  shuttleModel.rotation.set(0, 0, 0);
  shuttleControls.velocity.set(0, 0, 0);
  shuttleControls.rotation.set(0, 0, 0);
}

export function createOrbitalLine(radius, scene) {
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

export function animateCameraTo(camera, orbitControls, targetPosition, targetLookAt) {
  const startPosition = camera.position.clone();
  const startLookAt = orbitControls.target.clone();
  
  let progress = 0;
  const duration = 2000;
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    progress = Math.min(elapsed / duration, 1);
    
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
    orbitControls.target.lerpVectors(startLookAt, targetLookAt, easedProgress);
    orbitControls.update();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}