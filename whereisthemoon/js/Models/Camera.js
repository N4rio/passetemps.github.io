import * as THREE from "../ThreeModule/three.module.js";
import { OrbitControls } from "../ThreeModule/OrbitControls.js";

export class Camera {
    constructor(zoom, viewing, renderer) {
        this.camera = new THREE.PerspectiveCamera(zoom, window.innerWidth / window.innerHeight, 0.1, viewing);
        this.controls = new OrbitControls(this.camera, renderer.domElement);
    }

    CreateCamera(positionCam, dampingFactor, minDistance, maxDistance){
        this.camera.position.set(positionCam[0], positionCam[1], positionCam[2]);

        this.controls.enableDamping = true;
        this.controls.dampingFactor = dampingFactor;
        this.controls.minDistance = minDistance;
        this.controls.maxDistance = maxDistance;
    }
}