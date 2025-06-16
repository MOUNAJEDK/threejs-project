export class Tooltips {
  constructor() {
    this.tooltip = document.getElementById('planet-tooltip');
    this.nameEl = document.getElementById('planet-name');
    this.infoEl = document.getElementById('planet-info');
    this.distanceEl = document.getElementById('planet-distance');
  }

  show(planet, x, y, shuttleModel = null) {
    if (shuttleModel) {
      const distance = planet.position.distanceTo(shuttleModel.position);
      this.distanceEl.textContent = `Distance from shuttle: ${distance.toFixed(1)} units`;
    } else {
      this.distanceEl.textContent = `Distance from center: ${planet.userData.distance} units`;
    }
    
    this.nameEl.textContent = planet.userData.name;
    this.infoEl.textContent = planet.userData.info;
    
    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = (y - 10) + 'px';
    this.tooltip.classList.remove('hidden');
  }

  hide() {
    this.tooltip.classList.add('hidden');
  }
}