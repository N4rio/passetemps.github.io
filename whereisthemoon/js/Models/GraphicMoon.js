import * as THREE from "../ThreeModule/three.module.js";
import { OrbitControls } from "../ThreeModule/OrbitControls.js";

export class GraphicMoon {
    constructor(name, size, colorOrbit) {
    const DEG = Math.PI / 180;

    this.name = name;
    this.size = size; // Taille de la Lune pour une meilleure visibilité (distance reste reelle)
    this.colorOrbit = colorOrbit;
    }

    OrbitLine(){
        return new THREE.Line(new THREE.BufferGeometry(),
                              new THREE.LineBasicMaterial({ color: this.colorOrbit ?? 0xE32E17, transparent: true, opacity: 0.6 })
                             );
    }

}