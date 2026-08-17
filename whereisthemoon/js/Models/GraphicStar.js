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
        this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(this.size, 32, 32),
                              new THREE.MeshBasicMaterial({ color: this.color})
                             );
        this.sunGroup = new THREE.Group();
    }

    CreateStar(spaceScene){
        const texLoader = new THREE.TextureLoader();

        spaceScene.AddScene(this.sunGroup);
        this.sunGroup.add(this.sunMesh);

        const glowTexture = texLoader.load('images/circle.png');
        const sunGlow = new THREE.Sprite(
                                        new THREE.SpriteMaterial({
                                            map: glowTexture,
                                            color : this.LessFlashy(this.color),
                                            transparent: true,
                                            opacity: 0.9,
                                            blending: THREE.AdditiveBlending,
                                            depthWrite: false,
                                        })
        );
        sunGlow.scale.set(this.sunGlow, this.sunGlow, 1);
        this.sunGroup.add(sunGlow);
    }

    
    LessFlashy(color, amount = 0.1) {
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        // Augmente l'écart entre les composantes
        const nr = Math.min(255, Math.max(0, Math.round(r + (r - min) * amount)));
        const ng = Math.min(255, Math.max(0, Math.round(g + (g - min) * amount)));
        const nb = Math.min(255, Math.max(0, Math.round(b + (b - min) * amount)));

        return (nr << 16) | (ng << 8) | nb;
    }
        
}