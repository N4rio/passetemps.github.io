import * as THREE from "../ThreeModule/three.module.js";
import { OrbitControls } from "../ThreeModule/OrbitControls.js";

export class GraphicPlanete {
    constructor(name, size, rotationTime) {
        this.name = name;
        this.size = size; // Taille de la planete pour une meilleure visibilité (distance reste reelle)
        this.rotationTime = rotationTime;

        this.earthGroup = new THREE.Group();
        this.earthMesh = "";
    }

    CreatePlanete(spaceScene){
        const texLoader = new THREE.TextureLoader();

        // Inclinaison de l'axe (23,44°) — FIXE dans l'espace toute l'annee, comme le
        // vrai axe terrestre (il pointe en permanence vers l'etoile Polaire). Ce n'est
        // pas l'axe qui change entre l'ete et l'hiver, mais l'angle entre cet axe fixe
        // et la direction du Soleil, qui varie au fil de l'orbite terrestre.
        // On bascule ici autour de l'axe X (et non Z) pour que le pôle Nord penche
        // vers -Z : cela correspond, avec notre convention solaire (sunLonRad), au
        // moment où la longitude ecliptique du Soleil vaut 90° — le solstice d'ete
        // boreal (~21 juin), quand le pôle Nord doit être incline vers le Soleil.
        this.earthGroup.rotation.x = -23.44 * Math.PI / 180;
        spaceScene.AddScene(this.earthGroup);

        const earthImage = texLoader.load('images/earth_atmos_2048.jpg');
        const earthNormalMap = texLoader.load('images/earth_normal_2048.jpg');
        const earthLightsMap = texLoader.load('images/earth_lights_2048.png');
        earthImage.colorSpace = THREE.SRGBColorSpace;
        earthLightsMap.colorSpace = THREE.SRGBColorSpace;

        this.earthMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(this.size, 96, 96),
                    new THREE.MeshStandardMaterial({
                                    map: earthImage,// continents, oceans, relief
                                    normalMap: earthNormalMap,   // relief en creux/bosses
                                    normalScale: new THREE.Vector2(0.85, 0.85),
                                    emissiveMap: earthLightsMap, // lumières des villes côte nuit
                                    emissive: new THREE.Color(0xffe9b0),
                                    emissiveIntensity: 1.4,
                                    roughness: 0.8,
                                    metalness: 0.05,
                                })
        );
        this.earthGroup.add(this.earthMesh);

        // fine atmosphère
        const atmosphere = new THREE.Mesh(
                            new THREE.SphereGeometry(this.size * 1.045, 64, 64),
                            new THREE.MeshBasicMaterial({ color: 0x5ea3d6, transparent: true, opacity: 0.12, side: THREE.BackSide })
                            );
        this.earthGroup.add(atmosphere);

    }

    // Repère de position (ville de l'observateur), enfant de earthMesh : suit automatiquement la rotation reelle de la Terre.
    CreateCity(latDeg, lonDeg){
        const cityMarker = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xE32E17 })
                );
        this.earthMesh.add(cityMarker);

        const phi = latDeg * Math.PI / 180;
        const lambda = lonDeg * Math.PI / 180;
        const r = this.size * 1.02;
        cityMarker.position.set(
            r * Math.cos(lambda) * Math.cos(phi),
            r * Math.sin(phi),
            -r * Math.sin(lambda) * Math.cos(phi)
        );
    }

    // Rotation propre de la planete, derivee du jour ET de l'heure choisis (jour solaire
    // approximatif de rotationTime h . À 12h00 TU, le meridien choisi comme reference est tourne vers le Soleil ;
    Rotation(date, sunLonRad){
        const totalHours = this.daysSinceEpoch(date) * 24;
        const hourAngle = ((totalHours - 12) / this.rotationTime) * Math.PI * 2;

        return sunLonRad + hourAngle;
    }

    daysSinceEpoch(date) {
        const epoch = Date.UTC(1999, 11, 31, 0, 0, 0);
        return (date.getTime() - epoch) / 86400000;
    }
}