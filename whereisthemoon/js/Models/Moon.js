export class Moon {
    constructor(initialOrientation, changeOrientation, orbitalInclination, closestPoint,closestPointDay, orbitSize, orbitShape, startAngle, speed, date) {
        const DEG = Math.PI / 180;

        // elements orbitaux moyens de la Lune
        this.orbitalOrientation = this.NormDeg(initialOrientation - changeOrientation * date )* DEG;
        this.orbitalInclination = orbitalInclination * DEG; // inclinaison
        this.nearestPoint = this.NormDeg(closestPoint + closestPointDay * date) * DEG
        this.orbitSize = orbitSize; // Taille de l'orbitre
        this.orbitShape = orbitShape; // forme de l'orbitre
        this.M = this.NormDeg(startAngle + speed * date) * DEG; // anomalie moyenne
    }

    PerturbationLon(ms, D, F){
        let dLon = 0;
        dLon += -1.274 * Math.sin(this.M - 2 * D);
        dLon += 0.658 * Math.sin(2 * D);
        dLon += -0.186 * Math.sin(ms);
        dLon += -0.059 * Math.sin(2 * this.M - 2 * D);
        dLon += -0.057 * Math.sin(this.M - 2 * D + ms);
        dLon += 0.053 * Math.sin(this.M + 2 * D);
        dLon += 0.046 * Math.sin(2 * D - ms);
        dLon += 0.041 * Math.sin(this.M - ms);
        dLon += -0.035 * Math.sin(D);
        dLon += -0.031 * Math.sin(this.M + ms);
        dLon += -0.015 * Math.sin(2 * F - 2 * D);
        dLon += 0.011 * Math.sin(this.M - 4 * D);

        return dLon;
    }

    PerturbationLat(D, F){
        let dLat = 0;
        dLat += -0.173 * Math.sin(F - 2 * D);
        dLat += -0.055 * Math.sin(this.M - F - 2 * D);
        dLat += -0.046 * Math.sin(this.M + F - 2 * D);
        dLat += 0.033 * Math.sin(F + 2 * D);
        dLat += 0.017 * Math.sin(2 * this.M + F);

        return dLat;
    }

    PerturbationDistance(D){
        let dR = 0;
        dR += -0.58 * Math.cos(this.M - 2 * D);
        dR += -0.46 * Math.cos(2 * D);

        return dR;
    }
    
    // Altitude de la Lune au-dessus de l'horizon, pour un lieu donne (lat/lon en degres). Conversion ecliptique -> equatoriale -> horizontale, 
    // coherente avec le niveau de precision du reste du modèle (Schlyter, basse precision).
    MoonAltitudeDeg(date, state, latDeg, lonDeg) {
        const eps = (23.4393 - 3.563e-7 * state.d) * Math.PI / 180; // obliquite de l'ecliptique
        const cosLat = Math.cos(state.moonLatRad);
        const xeq = Math.cos(state.moonLonRad) * cosLat;
        const yeq = Math.sin(state.moonLonRad) * cosLat * Math.cos(eps) - Math.sin(state.moonLatRad) * Math.sin(eps);
        const zeq = Math.sin(state.moonLonRad) * cosLat * Math.sin(eps) + Math.sin(state.moonLatRad) * Math.cos(eps);

        const ra = Math.atan2(yeq, xeq);
        const dec = Math.atan2(zeq, Math.sqrt(xeq * xeq + yeq * yeq));

        const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
        const gmst0 = this.NormDeg(state.sunLonRad / (Math.PI / 180) + 180);
        const lst = this.NormDeg(gmst0 + utcHours * 15 + lonDeg) * Math.PI / 180;
        const hourAngle = lst - ra;

        const latRad = latDeg * Math.PI / 180;
        const sinAlt = Math.sin(dec) * Math.sin(latRad) + Math.cos(dec) * Math.cos(latRad) * Math.cos(hourAngle);
        return Math.asin(Math.max(-1, Math.min(1, sinAlt))) / Math.PI / 180;
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