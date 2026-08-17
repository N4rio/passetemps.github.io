import * as THREE from "../ThreeModule/three.module.js";
import { OrbitControls } from "../ThreeModule/OrbitControls.js";

export class SpaceScene {
    constructor(stars = false) {
        this.scene = new THREE.Scene();
        this.sunLight = new THREE.DirectionalLight(0xfff1cf, 3.2);
        this.setStars = stars;
    }

    AddScene(element){
        this.scene.add(element);
    }

    CreateLight(sunColor){
        // Lumière ambiante douce (pour que la face nocturne ne soit pas noir absolu)
        this.AddScene(new THREE.AmbientLight(0x1a2338, 0.55));
        // Lumière directionnelle = le Soleil, orientation mise à jour selon la date
        this.sunLight = new THREE.DirectionalLight(sunColor, 3.2);
        this.AddScene(this.sunLight);
    }

    CreateStars(starsBackground){
        const positions = starsBackground.GetStarsPosition();
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: starsBackground.color, size: 1.3, sizeAttenuation: true });
        this.AddScene(new THREE.Points(geo, mat));
    }
}