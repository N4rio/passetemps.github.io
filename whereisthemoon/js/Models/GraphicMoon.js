import * as THREE from "../ThreeModule/three.module.js";
import { OrbitControls } from "../ThreeModule/OrbitControls.js";

export class GraphicMoon {
    constructor(name, size, colorOrbit, planeteHoteSize, MOON_TRUE_RADIUS_RATIO, color) {
    const DEG = Math.PI / 180;

    this.name = name;
    this.size = size; // Taille de la Lune pour une meilleure visibilité (distance reste reelle)
    this.colorOrbit = colorOrbit;
    this.moonMesh = new THREE.Mesh(
                                new THREE.SphereGeometry(planeteHoteSize * MOON_TRUE_RADIUS_RATIO * this.size, 48, 48),
                                new THREE.MeshStandardMaterial({ color: color, roughness: 0.95, metalness: 0 })
                                );
    }

    OrbitLine(){
        return new THREE.Line(new THREE.BufferGeometry(),
                              new THREE.LineBasicMaterial({ color: this.colorOrbit ?? 0xE32E17, transparent: true, opacity: 0.6 })
                             );
    }

    CreateMoon(spaceScene){
        spaceScene.AddScene(this.moonMesh);
    }

}