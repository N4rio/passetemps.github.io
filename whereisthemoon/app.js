import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* =========================================================================
   ASTRONOMIE — position géocentrique réelle de la Lune
   Algorithme "basse précision" de Paul Schlyter (précision ~1° en longitude),
   suffisant pour une visualisation pédagogique. Toutes les distances sont
   en rayons terrestres (1 = rayon de la Terre).
   ========================================================================= */

const DEG = Math.PI / 180;

function normDeg(a) {
  a = a % 360;
  return a < 0 ? a + 360 : a;
}

// Nombre de jours écoulés depuis le 31 décembre 1999 à 0h00 TU (référence utilisée
// par les formules de Schlyter — "2000 Jan 0.0 UT").
function daysSinceEpoch(date) {
  const epoch = Date.UTC(1999, 11, 31, 0, 0, 0);
  return (date.getTime() - epoch) / 86400000;
}

function moonState(date) {
  const d = daysSinceEpoch(date);

  // Éléments orbitaux moyens de la Lune
  const N = normDeg(125.1228 - 0.0529538083 * d) * DEG; // noeud ascendant
  const i = 5.1454 * DEG;                                 // inclinaison
  const w = normDeg(318.0634 + 0.1643573223 * d) * DEG;  // argument du périgée
  const a = 60.2666;                                       // demi-grand axe (rayons terrestres)
  const e = 0.0549;                                        // excentricité
  const M = normDeg(115.3654 + 13.0649929509 * d) * DEG; // anomalie moyenne

  // Résolution de l'équation de Kepler par itération
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 6; k++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }

  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const r = Math.sqrt(xv * xv + yv * yv);
  const v = Math.atan2(yv, xv); // anomalie vraie

  // Position écliptique (avant perturbations)
  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i));
  const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i));
  const zh = r * (Math.sin(v + w) * Math.sin(i));

  let lon = Math.atan2(yh, xh);
  let lat = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh));

  // Position moyenne du Soleil (pour perturbations + éclairage)
  const Ms = normDeg(356.0470 + 0.9856002585 * d) * DEG; // anomalie moyenne du Soleil
  const ws = 282.9404 * DEG;                               // argument du périhélie solaire
  const Ls = normDeg(Ms / DEG + ws / DEG) * DEG;          // longitude moyenne du Soleil

  const Lm = N + w + M;      // longitude moyenne de la Lune
  const D = Lm - Ls;         // élongation moyenne
  const F = Lm - N;          // argument de latitude

  // Perturbations principales en longitude (degrés)
  let dLon = 0;
  dLon += -1.274 * Math.sin(M - 2 * D);
  dLon += 0.658 * Math.sin(2 * D);
  dLon += -0.186 * Math.sin(Ms);
  dLon += -0.059 * Math.sin(2 * M - 2 * D);
  dLon += -0.057 * Math.sin(M - 2 * D + Ms);
  dLon += 0.053 * Math.sin(M + 2 * D);
  dLon += 0.046 * Math.sin(2 * D - Ms);
  dLon += 0.041 * Math.sin(M - Ms);
  dLon += -0.035 * Math.sin(D);
  dLon += -0.031 * Math.sin(M + Ms);
  dLon += -0.015 * Math.sin(2 * F - 2 * D);
  dLon += 0.011 * Math.sin(M - 4 * D);

  // Perturbations en latitude (degrés)
  let dLat = 0;
  dLat += -0.173 * Math.sin(F - 2 * D);
  dLat += -0.055 * Math.sin(M - F - 2 * D);
  dLat += -0.046 * Math.sin(M + F - 2 * D);
  dLat += 0.033 * Math.sin(F + 2 * D);
  dLat += 0.017 * Math.sin(2 * M + F);

  // Perturbations en distance (rayons terrestres)
  let dR = 0;
  dR += -0.58 * Math.cos(M - 2 * D);
  dR += -0.46 * Math.cos(2 * D);

  lon = lon + dLon * DEG;
  lat = lat + dLat * DEG;
  const dist = r + dR;

  // Coordonnées cartésiennes écliptiques (repère héliocentrique-géocentrique)
  const x = dist * Math.cos(lat) * Math.cos(lon);
  const y = dist * Math.cos(lat) * Math.sin(lon);
  const z = dist * Math.sin(lat);

  // Élongation réelle Soleil-Terre-Lune, pour la phase
  const elongation = Math.acos(Math.cos(lon - Ls) * Math.cos(lat));
  const illumination = (1 - Math.cos(elongation)) / 2;

  return {
    eclipticPos: new THREE.Vector3(x, y, z), // en rayons terrestres
    distanceKm: dist * 6371,
    illumination,                             // 0..1
    elongationDeg: elongation / DEG,
    sunLonRad: Ls,
  };
}

/* =========================================================================
   SCÈNE 3D
   ========================================================================= */

const EARTH_RADIUS = 4; // unité de scène pour la Terre
const KM_PER_EARTH_RADIUS = 6371;
const SCENE_UNITS_PER_KM = EARTH_RADIUS / KM_PER_EARTH_RADIUS;
const MOON_VISUAL_SCALE = 3;         // Lune agrandie pour rester visible (distance, elle, reste réelle)
const MOON_TRUE_RADIUS_RATIO = 0.273; // rayon Lune / rayon Terre

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(70, 45, 110);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 12;
controls.maxDistance = 500;

// Étoiles
function buildStars() {
  const count = 22000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 900 + Math.random() * 600;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xe8e6df, size: 1.3, sizeAttenuation: true });
  scene.add(new THREE.Points(geo, mat));
}
buildStars();

// Lumière ambiante douce (pour que la face nocturne ne soit pas noir absolu)
scene.add(new THREE.AmbientLight(0x1a2338, 1));

// Lumière directionnelle = le Soleil, orientation mise à jour selon la date
const sunLight = new THREE.DirectionalLight(0xfff3df, 5);
scene.add(sunLight);

// --- Textures (dépôt officiel three.js, continents / relief / nuages / lumières de nuit) ---
const TEX_BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/';
const texLoader = new THREE.TextureLoader();
const earthMap = texLoader.load(TEX_BASE + 'planets/earth_atmos_2048.jpg');
const earthNormalMap = texLoader.load(TEX_BASE + 'planets/earth_normal_2048.jpg');
const earthLightsMap = texLoader.load(TEX_BASE + 'planets/earth_lights_2048.png');
const earthCloudsMap = texLoader.load(TEX_BASE + 'planets/earth_clouds_1024.png');
earthMap.colorSpace = THREE.SRGBColorSpace;
earthLightsMap.colorSpace = THREE.SRGBColorSpace;

// Terre
const earthGroup = new THREE.Group();
earthGroup.rotation.z = 23.44 * DEG; // inclinaison de l'axe
scene.add(earthGroup);

const earthMesh = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_RADIUS, 96, 96),
  new THREE.MeshStandardMaterial({
    map: earthMap,               // continents, océans, relief
    normalMap: earthNormalMap,   // relief en creux/bosses
    normalScale: new THREE.Vector2(0.85, 0.85),
    emissiveMap: earthLightsMap, // lumières des villes côté nuit
    emissive: new THREE.Color(0xffe9b0),
    emissiveIntensity: 1.4,
    roughness: 0.8,
    metalness: 0.05,
  })
);
earthGroup.add(earthMesh);

// Couche de nuages, légèrement au-dessus de la surface, tourne un peu plus vite
const cloudsMesh = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 96, 96),
  new THREE.MeshStandardMaterial({
    alphaMap: earthCloudsMap,
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
);
//earthGroup.add(cloudsMesh);

// fine atmosphère
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_RADIUS * 1.045, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0x5ea3d6, transparent: true, opacity: 0.12, side: THREE.BackSide })
);
earthGroup.add(atmosphere);

// Lune
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_RADIUS * MOON_TRUE_RADIUS_RATIO * MOON_VISUAL_SCALE, 48, 48),
  new THREE.MeshStandardMaterial({ color: 0xc7c3ba, roughness: 0.95, metalness: 0 })
);
scene.add(moonMesh);

// --- Soleil : sphère lumineuse + halo, placée dans la direction réelle du Soleil ---
const SUN_DISTANCE = 1000; // distance de rendu (symbolique, pas à l'échelle réelle)

const sunGroup = new THREE.Group();
scene.add(sunGroup);

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(14, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xfff1cf })
);
sunGroup.add(sunMesh);

const glowTexture = texLoader.load(TEX_BASE + 'sprites/circle.png');
const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffdca8,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
sunGlow.scale.set(90, 90, 1);
sunGroup.add(sunGlow);

// Trajectoire orbitale (tracé fin)
const orbitLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0xc9a876, transparent: true, opacity: 0.35 })
);
scene.add(orbitLine);

function eclipticToScene(vecEarthRadii) {
  // repère écliptique (x,y dans le plan, z = latitude) -> repère Three.js (Y = haut)
  return new THREE.Vector3(
    vecEarthRadii.x * SCENE_UNITS_PER_KM * KM_PER_EARTH_RADIUS,
    vecEarthRadii.z * SCENE_UNITS_PER_KM * KM_PER_EARTH_RADIUS,
    -vecEarthRadii.y * SCENE_UNITS_PER_KM * KM_PER_EARTH_RADIUS
  );
}

function updateOrbitLine(centerDate) {
  const points = [];
  const samples = 90;
  for (let k = 0; k <= samples; k++) {
    const t = new Date(centerDate.getTime());
    t.setUTCDate(t.getUTCDate() + Math.round((k / samples) * 27.3 - 13.65));
    const state = moonState(t);
    points.push(eclipticToScene(state.eclipticPos));
  }
  orbitLine.geometry.dispose();
  orbitLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
}

/* =========================================================================
   ÉTAT / CONTRÔLES DE DATE ET D'HEURE
   ========================================================================= */

const dateInput = document.getElementById('date-input');
const hourSlider = document.getElementById('hour-slider');
const hourDisplay = document.getElementById('hour-display');
const valDistance = document.getElementById('val-distance');
const valPhase = document.getElementById('val-phase');
const valElong = document.getElementById('val-elong');

const pad2 = (n) => String(n).padStart(2, '0');

function toDateInputValue(date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

// Calque décoratif reflétant l'heure exacte (y compris les minutes), même si
// le curseur ne se déplace que par pas d'une heure.
function syncControlsFromDateTime(date) {
  dateInput.value = toDateInputValue(date);
  hourSlider.value = date.getUTCHours();
  const utcStr = `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
  const localStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  hourDisplay.textContent = `${utcStr} UTC (${localStr} en France)`;
}

let currentDateTime = new Date();
syncControlsFromDateTime(currentDateTime);

// Rotation propre de la Terre, dérivée du jour ET de l'heure choisis (jour solaire
// approximatif de 24h — suffisant pour une visualisation grand public, sans viser
// la précision du temps sidéral). À 12h00 TU, le méridien choisi comme référence
// est tourné vers le Soleil ; la Terre tourne ensuite de 360° toutes les 24h.
function earthRotationY(date, sunLonRad) {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const hourAngle = ((utcHours - 12) / 24) * Math.PI * 2;
  return sunLonRad + hourAngle;
}

function applyDateTime(date) {
  currentDateTime = date;
  const state = moonState(date);

  const moonPos = eclipticToScene(state.eclipticPos);
  moonMesh.position.copy(moonPos);

  // Le Soleil éclaire depuis sa longitude écliptique du jour
  const sunDir = new THREE.Vector3(Math.cos(state.sunLonRad), 0, -Math.sin(state.sunLonRad));
  sunLight.position.copy(sunDir.clone().multiplyScalar(400));
  sunGroup.position.copy(sunDir.clone().multiplyScalar(SUN_DISTANCE));

  // La Terre (et ses nuages) tournent réellement selon la date ET l'heure choisies
  const rotY = earthRotationY(date, state.sunLonRad);
  earthMesh.rotation.y = rotY;
  cloudsMesh.rotation.y = rotY + 0.05; // léger décalage : les nuages dérivent un peu

  updateOrbitLine(date);

  valDistance.textContent = `${Math.round(state.distanceKm).toLocaleString('fr-FR')} km`;
  valPhase.textContent = `${Math.round(state.illumination * 100)} %`;
  valElong.textContent = `${state.elongationDeg.toFixed(1)}°`;
}

function goToDateTime(date) {
  syncControlsFromDateTime(date);
  applyDateTime(date);
}

dateInput.addEventListener('change', () => {
  if (!dateInput.value) return;
  const [y, m, d] = dateInput.value.split('-').map(Number);
  const next = new Date(currentDateTime.getTime());
  next.setUTCFullYear(y, m - 1, d);
  goToDateTime(next);
});

// 'input' pour un retour fluide pendant le glissement du curseur, pas seulement au relâchement
hourSlider.addEventListener('input', () => {
  const next = new Date(currentDateTime.getTime());
  next.setUTCHours(Number(hourSlider.value), 0, 0, 0);
  goToDateTime(next);
});

document.getElementById('btn-prev-day').addEventListener('click', () => {
  const d = new Date(currentDateTime.getTime());
  d.setUTCDate(d.getUTCDate() - 1);
  goToDateTime(d);
});

document.getElementById('btn-next-day').addEventListener('click', () => {
  const d = new Date(currentDateTime.getTime());
  d.setUTCDate(d.getUTCDate() + 1);
  goToDateTime(d);
});

document.getElementById('btn-prev-hour').addEventListener('click', () => {
  const d = new Date(currentDateTime.getTime());
  d.setUTCHours(d.getUTCHours() - 1, 0, 0, 0);
  goToDateTime(d);
});

document.getElementById('btn-next-hour').addEventListener('click', () => {
  const d = new Date(currentDateTime.getTime());
  d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
  goToDateTime(d);
});

document.getElementById('btn-now').addEventListener('click', () => {
  goToDateTime(new Date());
});

applyDateTime(currentDateTime);

/* =========================================================================
   BOUCLE DE RENDU
   ========================================================================= */

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
