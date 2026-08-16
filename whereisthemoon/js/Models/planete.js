export class Planete {
    constructor(name, size, rotationTime) {
        this.name = name;
        this.size = size; // Taille de la planete pour une meilleure visibilité (distance reste reelle)
        this.rotationTime = rotationTime;

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