import * as THREE from "./ThreeModule/three.module.js";
import { OrbitControls } from "./ThreeModule/OrbitControls.js";

import { Moon } from "./Models/Moon.js";
import { GraphicMoon } from "./Models/GraphicMoon.js";

import { Star } from "./Models/Star.js";
import { GraphicStar } from "./Models/GraphicStar.js";

import { StarrySky } from "./Models/StarrySky.js";
<<<<<<< HEAD
import { GraphicPlanete } from "./Models/GraphicPlanete.js";

import { SpaceScene } from "./Models/SpaceScene.js";

import { Camera } from "./Models/Camera.js";
=======
import { Planete } from "./Models/planete.js";
>>>>>>> a817d23ff81564f13f3e4d2e2274e29e9dd72b9f
/* =========================================================================
   ASTRONOMIE — position geocentrique reelle de la Lune
   Algorithme "basse precision" de Paul Schlyter (precision ~1° en longitude),
   suffisant pour une visualisation pedagogique. Toutes les distances sont
   en rayons terrestres (1 = rayon de la Terre).
   ========================================================================= */

const DEG = Math.PI / 180;

function normDeg(a) {
  a = a % 360;
  return a < 0 ? a + 360 : a;
}

// // Nombre de jours ecoules depuis le 31 decembre 1999 à 0h00 TU (reference utilisee
// // par les formules de Schlyter — "2000 Jan 0.0 UT").
function daysSinceEpoch(date) {
  const epoch = Date.UTC(1999, 11, 31, 0, 0, 0);
  return (date.getTime() - epoch) / 86400000;
}



function moonState(date) {
  const d = daysSinceEpoch(date)
  const moon = new Moon(125.1228, 
                        0.0529538083,
                        5.1454, // inclinaison de l'orbite
                        318.0634,
                        0.1643573223,
                        60.2666, // Taille de l'orbite
                        0.0549,  // Forme de l'orbite
                        115.3654, // position de départ sur l'orbite
                        13.0649929509, // vitesse de rotation
                        d);

  const sun = new Star(356.0470, 
                        0.9856002585,
                        282.9404,
                        d);

  // Resolution de l'equation de Kepler par iteration
  let E = moon.KeplerInteraction();

  const xv = moon.GetXV(E);
  const yv = moon.GetYV(E);

  // Distance de la Lune (theoreme de Pythagore)
  const r = Math.sqrt(xv * xv + yv * yv);

  // Angle de la Lune autour de la Terre
  const v = Math.atan2(yv, xv); // anomalie vraie

  // Position ecliptique
  const xh = moon.GetXH(r, v);
  const yh = moon.GetYH(r, v);
  const zh = moon.GetZH(r, v);

  let lon = Math.atan2(yh, xh);
  let lat = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh));

  // Position moyenne du Soleil
  const Ls = normDeg(sun.Ms / DEG + sun.nearestPoint / DEG) * DEG; // longitude moyenne du Soleil

  const Lm = moon.GetLm(); // longitude moyenne de la Lune
  const D = Lm - Ls; // elongation moyenne
  const F = Lm - moon.orbitalOrientation;  // argument de latitude

  // Perturbations principales en longitude (degres)
  let dLon = moon.PerturbationLon(sun.Ms, D, F);

  // Perturbations en latitude (degres)
  let dLat = moon.PerturbationLat(D,F);

  // Perturbations en distance (rayons terrestres)
  let dR = moon.PerturbationDistance(D);

  lon = lon + dLon * DEG;
  lat = lat + dLat * DEG;
  const dist = r + dR;

  // Coordonnees cartesiennes ecliptiques (repère heliocentrique-geocentrique)
  const x = dist * Math.cos(lat) * Math.cos(lon);
  const y = dist * Math.cos(lat) * Math.sin(lon);
  const z = dist * Math.sin(lat);

  // elongation reelle Soleil-Terre-Lune, pour la phase
  const elongation = Math.acos(Math.cos(lon - Ls) * Math.cos(lat));
  const illumination = (1 - Math.cos(elongation)) / 2;

  return {
    eclipticPos: new THREE.Vector3(x, y, z), // en rayons terrestres
    distanceKm: dist * 6371,
    illumination,// 0..1
    elongationDeg: elongation / DEG,
    sunLonRad: Ls,
    moonLonRad: lon,
    moonLatRad: lat,
    d,
  };
}

/* =========================================================================
   SCÈNE 3D
   ========================================================================= */
// Liens avec la page
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// Initialisation des éléments
const camera = new Camera(45, 2000, renderer);
const earthMap = new GraphicPlanete("Terre", 4, 24);
const starsBackground = new StarrySky(60000, 0xe8e6df);
const sunMap = new GraphicStar("Soleil", 900, 14, 0xfff1cf, 90);
const moonMap = new GraphicMoon("Lune", 3, 0xE32E17, earthMap.size, 0.273, sunMap.color);
const spaceScene = new SpaceScene();

// Constante
const KM_PER_EARTH_RADIUS = 6371;
const SCENE_UNITS_PER_KM = earthMap.size / KM_PER_EARTH_RADIUS;

// Création ciel étoilés
spaceScene.CreateStars(starsBackground);
// Création de la Lumière
spaceScene.CreateLight(sunMap.color);
// Création de la Terre
earthMap.CreatePlanete(spaceScene);
// Création de la Lune
moonMap.CreateMoon(spaceScene);
// Création du Soleil
sunMap.CreateStar(spaceScene)
// Création de la caméra
camera.CreateCamera([70, 45, 110], 0.06, 10, 900);



// Trajectoire orbitale (trace fin)
const orbitLine = moonMap.OrbitLine();
spaceScene.AddScene(orbitLine);

function eclipticToScene(vecEarthRadii) {
  // repère ecliptique (x,y dans le plan, z = latitude) -> repère Three.js (Y = haut)
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
   ETAT / CONTRÔLES DE DATE ET D'HEURE
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

// Calque decoratif refletant l'heure exacte (y compris les minutes), même si le curseur ne se deplace que par pas d'une heure.
function syncControlsFromDateTime(date) {
  dateInput.value = toDateInputValue(date);
  hourSlider.value = date.getUTCHours();
  const utcStr = `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
  const localStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  hourDisplay.textContent = `${utcStr} UTC (${localStr} en France)`;
}

let currentDateTime = new Date();
syncControlsFromDateTime(currentDateTime);

function applyDateTime(date) {
  currentDateTime = date;
  const state = moonState(date);

  const moonPos = eclipticToScene(state.eclipticPos);
  moonMap.moonMesh.position.copy(moonPos);

  // Le Soleil eclaire depuis sa longitude ecliptique du jour
  const sunDir = new THREE.Vector3(Math.cos(state.sunLonRad), 0, -Math.sin(state.sunLonRad));
  spaceScene.sunLight.position.copy(sunDir.clone().multiplyScalar(400));
  sunMap.sunGroup.position.copy(sunDir.clone().multiplyScalar(sunMap.distance));

  // La Terre tournent reellement selon la date ET l'heure choisies
  earthMap.earthMesh.rotation.y = earthMap.Rotation(date, state.sunLonRad);

  updateOrbitLine(date);
  valDistance.textContent = `${Math.round(state.distanceKm).toLocaleString('fr-FR')} km`;
  valPhase.textContent = `${Math.round(state.illumination * 100)} %`;
  valElong.textContent = `${state.elongationDeg.toFixed(1)}°`;

  updateLocationPanel(date, state);
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

const DEFAULT_CITY = { name: 'Paris, France', lat: 48.8566, lon: 2.3522 };
let observer = { ...DEFAULT_CITY };
earthMap.CreateCity(observer.lat, observer.lon);



const cityInput = document.getElementById('city-input');
const citySearchBtn = document.getElementById('city-search-btn');
const cityStatus = document.getElementById('city-status');
const valLocalTime = document.getElementById('val-local-time');
const valMoonVisible = document.getElementById('val-moon-visible');


// Heure solaire locale approximative : UTC decalee selon la longitude
// (15° = 1h). Ce n'est pas le fuseau administratif (qui suit des frontières et l'heure d'ete), juste une approximation basee sur la position du Soleil.
function localSolarTimeStr(date, lonDeg) {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  let lst = ((utcHours + lonDeg / 15) % 24 + 24) % 24;
  const hh = Math.floor(lst);
  let mm = Math.round((lst - hh) * 60);
  if (mm === 60) mm = 0;
  return `${pad2(hh)}:${pad2(mm)}`;
}


function updateLocationPanel(date, state) {
  if (!valLocalTime) return; // securite si les elements ne sont pas presents
  const moon = new Moon();
  valLocalTime.textContent = `${localSolarTimeStr(date, observer.lon)}`;

  const alt = moon.MoonAltitudeDeg(date, state, observer.lat, observer.lon);
  valMoonVisible.textContent = alt > 0? `Visible, ${Math.round(alt)}° au-dessus de l'horizon`: `Sous l'horizon (${Math.round(alt)}°)`;
}

async function searchCity(query) {
  if (!query || !query.trim()) {
    observer = { ...DEFAULT_CITY };
    cityStatus.textContent = 'Par defaut : Paris, France.';
    updateCityMarker(observer.lat, observer.lon);
    updateLocationPanel(currentDateTime, moonState(currentDateTime));
    return;
  }

  cityStatus.textContent = 'Recherche…';
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=fr&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('network');
    const results = await res.json();

    if (!results.length) {
      cityStatus.textContent = `Ville introuvable — on reste sur ${DEFAULT_CITY.name}.`;
      observer = { ...DEFAULT_CITY };
    } else {
      const r = results[0];
      const shortName = r.display_name.split(',').slice(0, 2).join(',').trim();
      observer = { name: shortName, lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
      cityStatus.textContent = `${observer.name} (${observer.lat.toFixed(2)}°, ${observer.lon.toFixed(2)}°)`;
    }
  } catch (err) {
    cityStatus.textContent = `Recherche indisponible (problème de reseau) — on reste sur ${DEFAULT_CITY.name}.`;
    observer = { ...DEFAULT_CITY };
  }

  updateCityMarker(observer.lat, observer.lon);
  updateLocationPanel(currentDateTime, moonState(currentDateTime));
}

citySearchBtn.addEventListener('click', () => searchCity(cityInput.value));
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchCity(cityInput.value);
  }
});

// Premier rendu
applyDateTime(currentDateTime);

/* =========================================================================
   BOUCLE DE RENDU
   ========================================================================= */

function onResize() {
  camera.camera.aspect = window.innerWidth / window.innerHeight;
  camera.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

function animate() {
  requestAnimationFrame(animate);
  camera.controls.update();
  renderer.render(spaceScene.scene, camera.camera);
}
animate();
