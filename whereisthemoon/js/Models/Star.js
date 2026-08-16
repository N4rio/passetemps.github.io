export class Star {
    constructor(name, distance, size, color, sunGlow, startPosition, speed, closestPoint, d) {
        const DEG = Math.PI / 180;

        this.name = name;
        this.distance = distance; // distance de rendu
        this.size = size;
        this.color = color ?? 0xfff1cf;
        this.sunGlow = sunGlow;
        // Position moyenne du Soleil
        this.Ms = this.NormDeg(startPosition + speed * d) * DEG;  // anomalie moyenne du Soleil
        this.nearestPoint = closestPoint * DEG;  // argument du perihelie solaire
    }

    NormDeg(a) {
        a = a % 360;
        return a < 0 ? a + 360 : a;
    }
}