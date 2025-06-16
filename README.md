# Aplicație Three.js - Simulare Spațială

## Structura Proiectului

```
src/
├── main.js                 # Orchestratorul aplicației
├── style.css              # Stiluri CSS
├── config/
│   └── gameConfig.js      # Configurări globale
├── systems/               # Sisteme de bază
│   ├── audioSystem.js     # Managementul sunetelor
│   ├── cameraSystem.js    # Sistemul de camere
│   ├── controlsSystem.js  # Controale și input
│   └── particleSystem.js  # Efecte de particule
├── objects/               # Obiecte 3D
│   ├── solarSystem.js     # Sistemul solar
│   └── shuttle.js         # Nava de transport
├── ui/                    # Interfața utilizator
│   ├── gui.js             # Panoul de control
│   └── tooltips.js        # Tooltipuri informaționale
└── utils/                 # Utilitare
    ├── helpers.js         # Funcții auxiliare
    └── loaders.js         # Încărcarea resurselor
```

## Dependențe

```json
{
  "three": "^0.177.0",
  "dat.gui": "^0.7.9",
  "vite": "^6.3.5"
}
```

## Resurse Externe

Fișierele de mari dimensiuni din directorul `public/` pot fi descărcate de la:

**GitHub Repository:** [Link către repository-ul proiectului]

### Fișiere necesare:

**Modele:**
- `models/star-wars-shuttle.glb`

**Texturi:**
- `textures/space-panorama.png`, `textures/sun.jpg`, `textures/mercury.jpg`, `textures/venus.jpg`, `textures/earth.jpg`, `textures/moon.jpg`, `textures/mars.jpg`, `textures/jupiter.jpg`, `textures/saturn.jpg`, `textures/saturn-ring.png`, `textures/uranus.jpg`, `textures/neptune.jpg`, `textures/particle.png`, `textures/glow.png`

**Audio:**
- `sounds/space-ambient.mp3`, `sounds/shuttle-engine-start.mp3`, `sounds/shuttle-engine-stop.mp3`, `sounds/laser-shoot.mp3`

**Favicon:**
- `favicon.png`, `favicon-32x32.png`, `favicon-16x16.png`

## Instalare și Rulare

```bash
npm install
# Descărcați resursele din GitHub în ./public/
npm run dev
```

## Controale

- **WASD** - Rotirea navei
- **Q/E** - Roll
- **Shift** - Propulsie
- **Space/Ctrl** - Ascensiune/Coborâre
- **F** - Lasere
- **H** - Ajutor
- **M** - Sunet ambiental
- **Mouse** - Camera orbit
- **Click planetă** - Focalizare