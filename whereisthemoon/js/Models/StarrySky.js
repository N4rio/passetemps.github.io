export class StarrySky {
    constructor(nb, color) {
        if(nb > 60000) nb = 60000;
        this.nbStars = nb;
        this.positions = new Float32Array(nb * 3); 
        this.color =  color ?? 0xe8e6df;
    }

    GetStarsPosition() {
        for (let i = 0; i < this.nbStars; i++) {
            const r = 900 + Math.random() * 600;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            this.positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            this.positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            this.positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return this.positions;
    }
}