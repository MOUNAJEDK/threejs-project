<div align="center">
  <img src="public/favicon.png" alt="Space Adventure" width="64" height="64">
  
  # 🚀 Aventură Spațială - Explorarea Sistemului Solar
</div>

## Despre Joc

Pornește într-o aventură spațială captivantă! Pilotează propria navă spațială prin sistemul nostru solar, explorează planetele și angajează-te în lupte epice cu nave inamice. O experiență 3D completă care te va transporta printre stele!

## Structura Proiectului

```
src/
├── main.js                 # ❤️ Inima aplicației
├── style.css              # 🎨 Stiluri și interfață
├── config/
│   └── gameConfig.js      # ⚙️ Setările jocului
├── systems/               # 🔧 Sistemele care fac totul să funcționeze
│   ├── audioSystem.js     # 🔊 Sunetele spațiului
│   ├── cameraSystem.js    # 📹 Camerele și perspectivele
│   ├── controlsSystem.js  # 🎮 Controalele navei
│   └── particleSystem.js  # ✨ Efectele spectaculoase
├── objects/               # 🌌 Lumea 3D
│   ├── solarSystem.js     # 🪐 Planetele și soarele
│   ├── shuttle.js         # 🚀 Nava ta
│   └── enemyShuttle.js    # 👾 Navele inamice
├── ui/                    # 🖥️ Interfața cu utilizatorul
│   ├── gui.js             # 🎛️ Panoul de control
│   └── tooltips.js        # 💬 Informații despre planete
└── utils/                 # 🛠️ Unelte utile
    ├── helpers.js         # 🤝 Funcții ajutătoare
    └── loaders.js         # 📦 Încărcarea resurselor
```

## Ce Poți Face în Joc

### 🌌 Explorează Spațiul
- **Vizitează 8 planete**: De la Mercur la Neptun, fiecare cu propria personalitate
- **Admiră Soarele**: Cu efecte de căldură și strălucire hipnotizante
- **Zbor liber**: Mișcă-te natural prin spațiu cu fizică realistă

### ⚔️ Lupte Epice
- **5 Nave inamice**: Fiecare se mișcă imprevizibil - o provocare constantă!
- **Armament laser**: Trage cu precizie și urmărește efectele spectaculoase
- **Explozii uimitoare**: Fiecare inamic distrus oferă un spectacol vizual

### 🎮 Experiență Completă
- **Controlează nava**: Simplu și intuitiv - oricine poate învăța rapid
- **Camere multiple**: Vezi acțiunea din unghiuri diferite
- **Personalizează totul**: Modifică setările după gustul tău
- **Sunet imersiv**: Ambiance spațială și efecte sonore captivante

## 📦 Ce Ai Nevoie

```json
{
  "three": "^0.177.0",    // Biblioteca principală pentru grafica 3D
  "dat.gui": "^0.7.9",    // Panoul de control al jocului
  "vite": "^6.3.5"        // Serverul de dezvoltare
}
```

## 📁 Resurse Necesare

Pentru că fișierele sunt mari, le poți descărca de aici:

**🔗 GitHub Repository:** [threejs-project repo](https://github.com/MOUNAJEDK/threejs-project)

### Ce trebuie să descarci:

**🚀 Modele 3D:**
- `models/star-wars-shuttle.glb` - Nava ta personală
- `models/enemy-shuttle.glb` - Navele inamice

**🎨 Imagini și Texturi:**
- `textures/space-panorama.png` - Fundalul cosmic
- Texturile planetelor: `sun.jpg`, `mercury.jpg`, `venus.jpg`, `earth.jpg`, `moon.jpg`, `mars.jpg`, `jupiter.jpg`, `saturn.jpg`, `saturn-ring.png`, `uranus.jpg`, `neptune.jpg`
- Efecte vizuale: `particle.png`, `glow.png`

**🔊 Sunete:**
- `sounds/space-ambient.mp3` - Atmosfera spațială
- `sounds/shuttle-engine-start.mp3`, `sounds/shuttle-engine-stop.mp3` - Vuietul motoarelor
- `sounds/laser-shoot.mp3` - Sunetul laserelor
- `sounds/enemy-shuttle-explosion.mp3` - Bubuitura exploziilor

**⭐ Iconuri:**
- `favicon.png`, `favicon-32x32.png`, `favicon-16x16.png`

## 🚀 Cum Să Începi

```bash
npm install                              # Instalează tot ce e necesar
# Descarcă resursele din GitHub în ./public/
npm run dev                              # Pornește aventura!
```

## 🎮 Cum Să Joci

### Pilotarea Navei
- **W/S** - Urcă și coboară nava
- **A/D** - Rotește stânga/dreapta 
- **Q/E** - Fă rotiri spectaculoase
- **Shift** - Accelerează prin spațiu
- **Space/Ctrl** - Urcă/coboară vertical

### Lupta și Explorarea
- **F** - Trage cu laserele! Pew pew!
- **Mouse** - Mișcă camera în jurul navei
- **Click pe planetă** - Focalizează pe planeta favorită
- **Escape** - Ieși din modul focalizare

### Alte Trucuri Cool
- **H** - Vezi din nou controalele
- **M** - Pornește/oprește muzica spațială
- **Panoul din dreapta** - Modifică orice vrei în joc!

## ✨ Bucură-te de Aventură!

Jocul este gata să te transporte în spațiu! Explorează, luptă și distrează-te printre planete. Fiecare zbor este o nouă aventură!