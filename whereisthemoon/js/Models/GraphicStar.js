import * as THREE from "../ThreeModule/three.module.js";
import { OrbitControls } from "../ThreeModule/OrbitControls.js";

export class GraphicStar {
    constructor(name, distance, size, color, sunGlow) {
        const DEG = Math.PI / 180;

        this.name = name;
        this.distance = distance; // distance de rendu
        this.size = size;
        this.color = color ?? 0xfff1cf;
        this.sunGlow = sunGlow;
    }

    CreateStar(){
        return new THREE.Mesh(new THREE.SphereGeometry(this.size, 32, 32),
                              new THREE.MeshBasicMaterial({ color: this.color})
                             );
    }
        
}