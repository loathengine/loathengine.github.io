import { calculateLinearRegression, getAngularFactors, bootstrapMeanRadiusCI } from './math.js';

export function calculateStatsForSession(shots, targetDistance = null, distanceUnits = null) {
    if (!shots || shots.length < 2) return null;

    const n = shots.length;
    const df = n - 1; 
    const dataUnits = shots[0].units || 'units';

    const all_x = shots.map(s => s.x);
    const all_y = shots.map(s => s.y);
    const mean_x = all_x.reduce((a, b) => a + b, 0) / n;
    const mean_y = all_y.reduce((a, b) => a + b, 0) / n;
    const sd_x = Math.sqrt(all_x.reduce((sum, x) => sum + Math.pow(x - mean_x, 2), 0) / df);
    const sd_y = Math.sqrt(all_y.reduce((sum, y) => sum + Math.pow(y - mean_y, 2), 0) / df);
    const meanRadius = shots.reduce((sum, s) => sum + Math.hypot(s.x - mean_x, s.y - mean_y), 0) / n;
    
    // Calculate Group Size (Extreme Spread)
    let maxSpread = 0;
    if (n >= 2) {
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const dist = Math.hypot(shots[i].x - shots[j].x, shots[i].y - shots[j].y);
                if (dist > maxSpread) maxSpread = dist;
            }
        }
    }

    // R95 estimate
    const r95 = meanRadius * 1.953;
    const hasVerticalDispersion = sd_y > sd_x * 1.5;

    // Velocity Stats
    const velocityShots = shots.filter(s => s.velocity !== null && typeof s.velocity === 'number' && !isNaN(s.velocity));
    let vel_es = null, vel_sd = null, vel_vert_r2 = null;

    if (velocityShots.length >= 2) {
        const velocities = velocityShots.map(s => s.velocity);
        vel_es = Math.max(...velocities) - Math.min(...velocities);
        const mean_vel = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        const sum_sq_diff = velocities.reduce((acc, v) => acc + Math.pow(v - mean_vel, 2), 0);
        vel_sd = Math.sqrt(sum_sq_diff / (velocities.length - 1));
    }

    if (velocityShots.length >= 3) {
        const regressionData = velocityShots.map(s => ({ x: s.velocity, y: s.y }));
        const regressionResult = calculateLinearRegression(regressionData);
        vel_vert_r2 = regressionResult.r2;
    }

    const ci_mr = bootstrapMeanRadiusCI(shots);
    const relativeWidth = (ci_mr.upper - ci_mr.lower) / meanRadius;
    
    let confidence_level = 'Medium';
    let confidence_color = '#eab308'; // yellow

    if (relativeWidth > 0.75) {
        confidence_level = 'Low';
        confidence_color = '#ef4444'; // red
    } else if (relativeWidth < 0.35) {
        confidence_level = 'High';
        confidence_color = '#22c55e'; // green
    }
    
    // Calculate Angular values (MOA and Mrad)
    const factors = getAngularFactors(dataUnits, targetDistance, distanceUnits);
    
    let angStats = {
        mr: { moa: null, mrad: null },
        r95: { moa: null, mrad: null },
        gs: { moa: null, mrad: null },
        sd_x: { moa: null, mrad: null },
        sd_y: { moa: null, mrad: null },
        ci: { moa: null, mrad: null },
        a_zed: null // Add a_zed placeholder
    };

    if (factors) {
        angStats.mr.moa = meanRadius * factors.moa;
        angStats.mr.mrad = meanRadius * factors.mrad;
        
        angStats.r95.moa = r95 * factors.moa;
        angStats.r95.mrad = r95 * factors.mrad;

        angStats.gs.moa = maxSpread * factors.moa;
        angStats.gs.mrad = maxSpread * factors.mrad;
        
        angStats.sd_x.moa = sd_x * factors.moa;
        angStats.sd_x.mrad = sd_x * factors.mrad;
        
        angStats.sd_y.moa = sd_y * factors.moa;
        angStats.sd_y.mrad = sd_y * factors.mrad;
        
        angStats.ci.moa = [ci_mr.lower * factors.moa, ci_mr.upper * factors.moa];
        angStats.ci.mrad = [ci_mr.lower * factors.mrad, ci_mr.upper * factors.mrad];

        // A-ZED Calculation
        // IPSC A-zone is roughly 15cm wide by 32.5cm high.
        // Based on 95th Percentile Radius (R95).
        // R95 represents the radius of a circle that would contain 95% of the shots.
        // We want to fit this circle within the A-zone.
        // A-zone width is 15cm.
        // So, 2 * R95 (Diameter of 95% circle) must be <= A-zone Width (15cm).
        // Distance = A-zone Width / (2 * R95 in radians)
        
        let r95Meters = r95;
        if (dataUnits === 'in') r95Meters *= 0.0254;
        else if (dataUnits === 'mm') r95Meters *= 0.001;
        
        let targetDistMeters = targetDistance;
        if (distanceUnits === 'yards') targetDistMeters *= 0.9144;
        
        if (targetDistMeters > 0 && r95Meters > 0) {
             const r95Radians = r95Meters / targetDistMeters;
             
             // A-zone width = 0.15 meters (approx 6 inches)
             // A-ZED (meters) = 0.15 / (2 * r95Radians)
             const aZedMeters = 0.15 / (2 * r95Radians);
             
             if (distanceUnits === 'yards') {
                 angStats.a_zed = (aZedMeters / 0.9144); // Yards
             } else {
                 angStats.a_zed = aZedMeters; // Meters
             }
        }
    }

    return {
        n: n,
        // Keep linear units for Plotting logic only
        raw: {
            meanRadius, 
            units: dataUnits,
            mpi: {x: mean_x, y: mean_y}
        },
        // Angular Stats
        ang: angStats,
        hasDistance: !!factors,
        vel_es: vel_es,
        vel_sd: vel_sd,
        vel_vert_r2: vel_vert_r2,
        hasVerticalDispersion: hasVerticalDispersion,
        confidence_level: confidence_level,
        confidence_color: confidence_color,
        distanceUnits: distanceUnits
    };
}
