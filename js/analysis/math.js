export function bootstrapMeanRadiusCI(shots, samples = 1000) {
    const n = shots.length;
    if (n < 2) return { lower: 0, upper: 0 };

    const bootstrapMeans = [];
    for (let i = 0; i < samples; i++) {
        const bootstrapSample = [];
        for (let j = 0; j < n; j++) {
            bootstrapSample.push(shots[Math.floor(Math.random() * n)]);
        }
        
        const mean_x = bootstrapSample.reduce((a, b) => a + b.x, 0) / n;
        const mean_y = bootstrapSample.reduce((a, b) => a + b.y, 0) / n;
        const meanRadius = bootstrapSample.reduce((sum, s) => sum + Math.hypot(s.x - mean_x, s.y - mean_y), 0) / n;
        bootstrapMeans.push(meanRadius);
    }

    bootstrapMeans.sort((a, b) => a - b);
    const lowerIndex = Math.floor(samples * 0.025);
    const upperIndex = Math.floor(samples * 0.975);
    
    return { lower: bootstrapMeans[lowerIndex], upper: bootstrapMeans[upperIndex] };
}

export function calculateLinearRegression(data) {
    let sum_x = 0, sum_y = 0, sum_xy = 0, sum_x2 = 0, sum_y2 = 0;
    const n = data.length;
    if (n < 3) return { r: 0, r2: 0 };

    for (const point of data) {
        sum_x += point.x;
        sum_y += point.y;
        sum_xy += point.x * point.y;
        sum_x2 += point.x * point.x;
        sum_y2 += point.y * point.y;
    }

    const numerator = (n * sum_xy) - (sum_x * sum_y);
    const denominator_x = (n * sum_x2) - (sum_x * sum_x);
    const denominator_y = (n * sum_y2) - (sum_y * sum_y);
    
    if (denominator_x === 0 || denominator_y === 0) {
        return { r: 0, r2: 0 };
    }

    const r = numerator / Math.sqrt(denominator_x * denominator_y);
    return { r: r, r2: r * r };
}

export function getAngularFactors(dataUnits, targetDistance, distanceUnits) {
    if (!targetDistance || targetDistance <= 0) return null;
    
    let distMeters = targetDistance;
    if (distanceUnits === 'yards') distMeters *= 0.9144;
    
    let sizeMeters = 1;
    if (dataUnits === 'in') sizeMeters = 0.0254;
    else if (dataUnits === 'mm') sizeMeters = 0.001;
    
    // Base radians = size / distance
    const radFactor = sizeMeters / distMeters;
    
    return {
        mrad: radFactor * 1000,
        moa: radFactor * (180 / Math.PI) * 60 // approx 3437.75
    };
}
