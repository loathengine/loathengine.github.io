// js/analysis.js
import { getAllItems, getItem } from './db.js';
import { createSessionName } from './utils.js';

let lastAnalysisResults = [];
const colors = ['#22c55e', '#3b82f6', '#ef4444', '#eab308', '#a855f7', '#f97316'];

export function initStatisticalAnalysis() {
    const sessionSelect = document.getElementById('sessionSelect');
    const firearmFilterSelect = document.getElementById('firearmFilterSelect');
    const compareBtn = document.getElementById('compareSessionsBtn');
    const exportBtn = document.getElementById('exportAnalysisBtn');
    const statOutputContainer = document.getElementById('statAnalysisOutput');
    const plotContainer = document.getElementById('analysisPlotContainer');

    async function populateFirearmFilter() {
        firearmFilterSelect.innerHTML = '<option value="">-- All Firearms --</option>';
        const firearms = await getAllItems('firearms');
        firearms.sort((a,b) => a.nickname.localeCompare(b.nickname));
        firearms.forEach(firearm => {
            const option = document.createElement('option');
            option.value = firearm.id;
            option.textContent = firearm.nickname;
            firearmFilterSelect.appendChild(option);
        });
    }

    async function populateSessionSelect(firearmId = null) {
        let sessions = await getAllItems('impactData');
        
        if (firearmId) {
            sessions = sessions.filter(session => session.firearmId === firearmId);
        }

        sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        sessionSelect.innerHTML = ``;

        for(const session of sessions) {
            if (!session.shots || session.shots.length < 2) continue;

            const option = document.createElement('option');
            option.value = session.id;
            option.textContent = await createSessionName(session);
            sessionSelect.appendChild(option);
        }
    }
    
    sessionSelect.addEventListener('refresh', async () => {
        await populateFirearmFilter();
        await populateSessionSelect(firearmFilterSelect.value);
    });
    
    firearmFilterSelect.addEventListener('change', (e) => {
        populateSessionSelect(e.target.value);
    });
    
    compareBtn.addEventListener('click', handleSessionComparison);
    exportBtn.addEventListener('click', handleAnalysisExport);

    function bootstrapMeanRadiusCI(shots, samples = 1000) {
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

    function calculateLinearRegression(data) {
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

    function calculateStatsForSession(shots) {
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
        
        const hasVerticalDispersion = sd_y > sd_x * 1.5;

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
        
        return {
            n: n,
            units: dataUnits,
            meanRadius: meanRadius,
            sd_x: sd_x,
            sd_y: sd_y,
            vel_es: vel_es,
            vel_sd: vel_sd,
            vel_vert_r2: vel_vert_r2,
            hasVerticalDispersion: hasVerticalDispersion,
            ci_mean_radius: [ci_mr.lower, ci_mr.upper],
            confidence_level: confidence_level,
            confidence_color: confidence_color,
            mpi: {x: mean_x, y: mean_y}
        };
    }

    async function handleSessionComparison() {
        const selectedIds = Array.from(sessionSelect.selectedOptions).map(option => option.value);

        if (selectedIds.length < 1) {
            alert("Please select at least one session to analyze.");
            return;
        }

        const results = [];
        for (const id of selectedIds) {
            const sessionData = await getItem('impactData', id);
            if (sessionData && sessionData.shots && sessionData.shots.length > 0) {
                const stats = calculateStatsForSession(sessionData.shots);
                if (stats) {
                    const sessionName = await createSessionName(sessionData);
                    results.push({
                        sessionId: id,
                        sessionName: sessionName,
                        stats: stats,
                        shots: sessionData.shots // Keep shots for plotting
                    });
                }
            }
        }
        
        results.sort((a, b) => a.stats.meanRadius - b.stats.meanRadius);
        
        renderComparisonTable(results);
        
        plotContainer.innerHTML = ''; 
        if (results.length > 0) {
            lastAnalysisResults = results;
            const plotCanvas = document.createElement('canvas');
            plotCanvas.width = 800;
            plotCanvas.height = 800;
            plotCanvas.style.maxWidth = '100%';
            plotCanvas.style.height = 'auto';
            plotCanvas.style.backgroundColor = '#1f2937';
            plotContainer.appendChild(plotCanvas);
            await renderAnalysisPlot(results, plotCanvas);
        } else {
            lastAnalysisResults = [];
        }
    }
    
    function renderComparisonTable(results) {
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
                <th style="white-space: nowrap;">MR Confidence Interval (95%)</th>
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

            row.innerHTML = `
                <td><span style="display: inline-block; vertical-align: middle; width: 12px; height: 12px; background-color: ${color}; margin-right: 8px; border-radius: 3px;"></span>${result.sessionName}</td>
                <td>${stats.n}</td>
                <td style="font-weight: 600;">${stats.meanRadius.toFixed(4)} ${stats.units}</td>
                <td>[${stats.ci_mean_radius[0].toFixed(4)}, ${stats.ci_mean_radius[1].toFixed(4)}] <span style="color: ${stats.confidence_color}; font-weight: 600;">(${stats.confidence_level})</span></td>
                <td>${stats.sd_x.toFixed(4)} ${stats.units}</td>
                <td>${stats.sd_y.toFixed(4)} ${stats.units}</td>
                <td>${stats.vel_sd !== null ? stats.vel_sd.toFixed(2) : 'N/A'}</td>
                <td>${analysisHtml}</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        statOutputContainer.appendChild(table);
    }
    
    async function renderAnalysisPlot(sessionResults, canvas, bounds = null) {
        const renderBounds = bounds || { x: 0, y: 0, width: canvas.width, height: canvas.height };
        const ctx = canvas.getContext('2d');
        
        ctx.save();
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(renderBounds.x, renderBounds.y, renderBounds.width, renderBounds.height);

        let maxOffset = 0;
        sessionResults.forEach(res => {
            const sessionMPI = res.stats.mpi;
            res.shots.forEach(shot => {
                const offset = Math.hypot(shot.x - sessionMPI.x, shot.y - sessionMPI.y);
                if (offset > maxOffset) maxOffset = offset;
            });
        });

        const units = sessionResults[0].stats.units;
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
            const sessionMPI = res.stats.mpi;
            const sessionMR = res.stats.meanRadius;

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

    async function handleAnalysisExport() {
        if (lastAnalysisResults.length === 0) {
            alert("Please run an analysis first before exporting.");
            return;
        }

        const DPI = 300;
        const IMG_WIDTH_INCHES = 8;
        const PLOT_HEIGHT_INCHES = 8;
        const ROW_HEIGHT_INCHES = 0.25;
        const HEADER_HEIGHT_INCHES = 0.4;
        const PADDING_INCHES = 0.2;
        const FONT_SIZE_PT = 12;

        const canvasWidth = IMG_WIDTH_INCHES * DPI;
        const plotHeight = PLOT_HEIGHT_INCHES * DPI;
        const rowHeight = ROW_HEIGHT_INCHES * DPI;
        const headerHeight = HEADER_HEIGHT_INCHES * DPI;
        const padding = PADDING_INCHES * DPI;

        const canvasHeight = plotHeight + headerHeight + (lastAnalysisResults.length * rowHeight) + (padding * 3);

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await renderAnalysisPlot(lastAnalysisResults, canvas, { x: 0, y: 0, width: canvasWidth, height: plotHeight });

        let currentY = plotHeight + padding;
        const columns = [
            { header: 'Session Details', x: padding, width: (canvasWidth - padding * 2) * 0.4 },
            { header: 'Shots', x: padding + (canvasWidth - padding * 2) * 0.4, width: (canvasWidth - padding * 2) * 0.08 },
            { header: 'MR', x: padding + (canvasWidth - padding * 2) * 0.48, width: (canvasWidth - padding * 2) * 0.12 },
            { header: 'MR CI (95%)', x: padding + (canvasWidth - padding * 2) * 0.60, width: (canvasWidth - padding * 2) * 0.22 },
            { header: 'Vel. SD', x: padding + (canvasWidth - padding * 2) * 0.82, width: (canvasWidth - padding * 2) * 0.18 }
        ];

        ctx.font = `bold ${FONT_SIZE_PT * 2.5}px Inter`;
        ctx.fillStyle = '#f9fafb';
        ctx.textBaseline = 'middle';
        columns.forEach(col => {
            ctx.fillText(col.header, col.x, currentY + headerHeight / 2);
        });
        currentY += headerHeight;
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(padding, currentY);
        ctx.lineTo(canvasWidth - padding, currentY);
        ctx.stroke();
        
        ctx.font = `${FONT_SIZE_PT * 2.2}px Inter`;
        lastAnalysisResults.forEach((result, index) => {
            const color = colors[index % colors.length];
            ctx.fillStyle = color;
            ctx.fillRect(columns[0].x, currentY + (rowHeight - 40) / 2, 40, 40);

            const stats = result.stats;
            const sessionText = result.sessionName.replace(/\s\(\d+ shots\)/, '');

            ctx.fillStyle = '#f3f4f6';
            ctx.fillText(sessionText, columns[0].x + 50, currentY + rowHeight / 2);
            ctx.fillText(stats.n, columns[1].x, currentY + rowHeight / 2);
            ctx.fillText(`${stats.meanRadius.toFixed(4)} ${stats.units}`, columns[2].x, currentY + rowHeight / 2);
            ctx.fillText(`[${stats.ci_mean_radius[0].toFixed(4)}, ${stats.ci_mean_radius[1].toFixed(4)}]`, columns[3].x, currentY + rowHeight / 2);
            ctx.fillText(`${stats.vel_sd !== null ? stats.vel_sd.toFixed(2) : 'N/A'}`, columns[4].x, currentY + rowHeight / 2);
            currentY += rowHeight;
        });

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'analysis_report.png';
        a.click();
    }

    // Initial population
    sessionSelect.dispatchEvent(new Event('refresh'));
}
