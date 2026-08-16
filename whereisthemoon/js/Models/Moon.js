export class Moon {
    constructor(name, size, initialOrientation, changeOrientation, orbitalInclination, closestPoint,closestPointDay, orbitSize, orbitShape, startAngle, speed, date) {
        const DEG = Math.PI / 180;

        this.name = name;
        this.size = size; // Taille de la Lune pour une meilleure visibilité (distance reste reelle)

        // elements orbitaux moyens de la Lune
        this.orbitalOrientation = this.NormDeg(initialOrientation - changeOrientation * date )* DEG;
        this.orbitalInclination = orbitalInclination * DEG; // inclinaison
        this.nearestPoint = this.NormDeg(closestPoint + closestPointDay * date) * DEG
        this.orbitSize = orbitSize; // Taille de l'orbitre
        this.orbitShape = orbitShape; // forme de l'orbitre
        this.M = this.NormDeg(startAngle + speed * date) * DEG; // anomalie moyenne
    }

    // Permet de calculer l’orbite, la vitesse et la période de révolution de la Lune.
    Kepler(){
        return this.M + this.orbitShape * Math.sin(this.M) * (1 + this.orbitShape * Math.cos(this.M));
    }

    // Resolution de l'equation de Kepler par iteration
    KeplerInteraction(){
        let E = this.Kepler();
        for (let k = 0; k < 6; k++) {
            E = E-(E-this.orbitShape * Math.sin(E)-this.M)/(1-this.orbitShape * Math.cos(E));
        }
        return E;
    }

    NormDeg(a) {
        a = a % 360;
        return a < 0 ? a + 360 : a;
    }


    // Calcule la coordonnée X de la Lune dans son orbite.
    GetXV(E){
        return this.orbitSize * (Math.cos(E) - this.orbitShape);
    }

    // calcule la coordonnée Y de la Lune dans son orbite.
    GetYV(E){
        return this.orbitSize * (Math.sqrt(1 - this.orbitShape * this.orbitShape) * Math.sin(E));
    }

    GetXH(r, v){
        return r * (Math.cos(this.orbitalOrientation) * Math.cos(v + this.nearestPoint) - Math.sin(this.orbitalOrientation) * Math.sin(v + this.nearestPoint) * Math.cos(this.orbitalInclination));
    }

    GetYH(r, v){
        return r * (Math.sin(this.orbitalOrientation) * Math.cos(v + this.nearestPoint) + Math.cos(this.orbitalOrientation) * Math.sin(v + this.nearestPoint) * Math.cos(this.orbitalInclination));
    }

    GetXH(r, v){
        return r * (Math.cos(this.orbitalOrientation) * Math.cos(v + this.nearestPoint) - Math.sin(this.orbitalOrientation) * Math.sin(v + this.nearestPoint) * Math.cos(this.orbitalInclination));
    }

    GetZH(r, v){
        return r * (Math.sin(v + this.nearestPoint) * Math.sin(this.orbitalInclination));
    }

    // Longitude moyenne de la Lune
    GetLm(){
        return this.orbitalOrientation + this.nearestPoint + this.M; ;
    }
}