export class Star {
    constructor(startPosition, speed, closestPoint, d) {
        const DEG = Math.PI / 180;
        // Position moyenne du Soleil
        this.Ms = this.NormDeg(startPosition + speed * d) * DEG;  // anomalie moyenne du Soleil
        this.nearestPoint = closestPoint * DEG;  // argument du perihelie solaire
    }

    NormDeg(a) {
        a = a % 360;
        return a < 0 ? a + 360 : a;
    }
}