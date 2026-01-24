export const colors = ['#22c55e', '#3b82f6', '#ef4444', '#eab308', '#a855f7', '#f97316'];

export function renderComparisonTable(results, statOutputContainer) {
    statOutputContainer.innerHTML = '';
    if (results.length === 0) {
        statOutputContainer.innerHTML = '<p style="text-align: center; padding: 1rem; color: #9ca3af;">No valid sessions found for analysis.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th style="white-space: nowrap;">Session Details</th>
            <th style="white-space: nowrap;">Shots</th>
            <th style="white-space: nowrap;">Mean Radius (MR)</th>
            <th style="white-space: nowrap;">95th Percentile Radius</th>
            <th style="white-space: nowrap;">MR Confidence (95%)</th>
            <th style="white-space: nowrap;">Group Size</th>
            <th style="white-space: nowrap;">A-ZED</th>
            <th style="white-space: nowrap;">Horizontal SD</th>
            <th style="white-space: nowrap;">Vertical SD</th>
            <th style="white-space: nowrap;">Velocity SD</th>
            <th style="white-space: nowrap;">Dispersion Analysis</th>
        </tr>
    `;
    
    const tbody = document.createElement('tbody');
    results.forEach((result, index) => {
        const stats = result.stats;
        const color = colors[index % colors.length];
        const row = document.createElement('tr');
        
        let analysisHtml = 'Nominal';
        if (stats.hasVerticalDispersion) {
            if (stats.vel_vert_r2 !== null) {
                const r2_percent = (stats.vel_vert_r2 * 100).toFixed(1);
                if (stats.vel_vert_r2 > 0.4) {
                    analysisHtml = `<span style="color: #f97316; font-weight: 500;">Vertical stringing correlates with velocity (R² = ${r2_percent}%)</span>`;
                } else {
                    analysisHtml = `<span>Vertical stringing present, but not strongly correlated to velocity (R² = ${r2_percent}%)</span>`;
                }
            } else {
                analysisHtml = `<span style="color: #eab308;">Vertical stringing detected. Add velocity data to diagnose.</span>`;
            }
        }
        
        // Format Strings - Fallback if no distance provided
        const noDistMsg = '<span style="color:#9ca3af; font-size:0.8em">Set Dist.</span>';

        const mrDisplay = stats.hasDistance 
            ? `${stats.ang.mr.moa.toFixed(2)} moa <br><span style="color:#9ca3af; font-size:0.85em">${stats.ang.mr.mrad.toFixed(2)} mrad</span>` 
            : noDistMsg;

        const r95Display = stats.hasDistance
            ? `${stats.ang.r95.moa.toFixed(2)} moa <br><span style="color:#9ca3af; font-size:0.85em">${stats.ang.r95.mrad.toFixed(2)} mrad</span>` 
            : noDistMsg;

        const mrCiDisplay = stats.hasDistance
            ? `${stats.ang.ci.moa[0].toFixed(2)} - ${stats.ang.ci.moa[1].toFixed(2)} moa`
            : noDistMsg;

        const gsDisplay = stats.hasDistance
            ? `${stats.ang.gs.moa.toFixed(2)} moa <br><span style="color:#9ca3af; font-size:0.85em">${stats.ang.gs.mrad.toFixed(2)} mrad</span>`
            : noDistMsg;

        const aZedDisplay = (stats.hasDistance && stats.ang.a_zed)
            ? `${Math.floor(stats.ang.a_zed)} ${stats.distanceUnits}`
            : noDistMsg;

        const sdXDisplay = stats.hasDistance
            ? `${stats.ang.sd_x.moa.toFixed(2)} moa`
            : noDistMsg;
            
        const sdYDisplay = stats.hasDistance
            ? `${stats.ang.sd_y.moa.toFixed(2)} moa`
            : noDistMsg;

        row.innerHTML = `
            <td><span style="display: inline-block; vertical-align: middle; width: 12px; height: 12px; background-color: ${color}; margin-right: 8px; border-radius: 3px;"></span>${result.sessionName}</td>
            <td>${stats.n}</td>
            <td style="font-weight: 600;">${mrDisplay}</td>
            <td style="font-weight: 600;">${r95Display}</td>
            <td>${mrCiDisplay} <br><span style="color: ${stats.confidence_color}; font-weight: 600; font-size: 0.85em">(${stats.confidence_level})</span></td>
            <td>${gsDisplay}</td>
            <td style="font-weight: 600; color: #3b82f6;">${aZedDisplay}</td>
            <td>${sdXDisplay}</td>
            <td>${sdYDisplay}</td>
            <td>${stats.vel_sd !== null ? stats.vel_sd.toFixed(2) : 'N/A'}</td>
            <td>${analysisHtml}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    statOutputContainer.appendChild(table);
}

export async function renderAnalysisPlot(sessionResults, canvas, bounds = null) {
    const renderBounds = bounds || { x: 0, y: 0, width: canvas.width, height: canvas.height };
    const ctx = canvas.getContext('2d');
    
    ctx.save();
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(renderBounds.x, renderBounds.y, renderBounds.width, renderBounds.height);

    let maxOffset = 0;
    sessionResults.forEach(res => {
        const sessionMPI = res.stats.raw.mpi;
        res.shots.forEach(shot => {
            const offset = Math.hypot(shot.x - sessionMPI.x, shot.y - sessionMPI.y);
            if (offset > maxOffset) maxOffset = offset;
        });
    });

    const units = sessionResults[0].stats.raw.units;
    const gridSpacing = (units === 'in') ? 1.0 : 25.0;
    let viewSpan = Math.ceil(maxOffset * 2 * 1.2 / gridSpacing) * gridSpacing;
    if (viewSpan === 0) viewSpan = gridSpacing * 4;

    const pixelsPerUnit = renderBounds.width / viewSpan;
    ctx.translate(renderBounds.x + renderBounds.width / 2, renderBounds.y + renderBounds.height / 2);

    const gridSpacingPx = gridSpacing * pixelsPerUnit;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = Math.max(1, renderBounds.width / 1000);
    for (let i = gridSpacingPx; i < renderBounds.width / 2; i += gridSpacingPx) {
        ctx.beginPath();
        ctx.moveTo(i, -renderBounds.height / 2); ctx.lineTo(i, renderBounds.height / 2);
        ctx.moveTo(-i, -renderBounds.height / 2); ctx.lineTo(-i, renderBounds.height / 2);
        ctx.stroke();
    }
        for (let i = gridSpacingPx; i < renderBounds.height / 2; i += gridSpacingPx) {
        ctx.beginPath();
        ctx.moveTo(-renderBounds.width / 2, i); ctx.lineTo(renderBounds.width / 2, i);
        ctx.moveTo(-renderBounds.width / 2, -i); ctx.lineTo(renderBounds.width / 2, -i);
        ctx.stroke();
    }

    sessionResults.forEach((res, index) => {
        const color = colors[index % colors.length];
        const sessionMPI = res.stats.raw.mpi;
        const sessionMR = res.stats.raw.meanRadius;

        const radius = sessionMR * pixelsPerUnit;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, renderBounds.width / 400);
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = color;
        const shotRadius = Math.max(3, renderBounds.width / 250);
        res.shots.forEach(shot => {
            const px = (shot.x - sessionMPI.x) * pixelsPerUnit;
            const py = (shot.y - sessionMPI.y) * pixelsPerUnit * -1; // Flip Y for standard plot
            ctx.beginPath();
            ctx.arc(px, py, shotRadius, 0, 2 * Math.PI);
            ctx.fill();
        });
    });

    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = Math.max(2, renderBounds.width / 500);
    ctx.beginPath();
    ctx.moveTo(0, -renderBounds.height / 2); ctx.lineTo(0, renderBounds.height / 2);
    ctx.moveTo(-renderBounds.width / 2, 0); ctx.lineTo(renderBounds.width / 2, 0);
    ctx.stroke();

    ctx.restore();
}
