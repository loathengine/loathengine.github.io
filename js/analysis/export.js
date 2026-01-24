import { renderAnalysisPlot, colors } from './ui.js';

export async function handleAnalysisExport(lastAnalysisResults) {
    if (lastAnalysisResults.length === 0) {
        alert("Please run an analysis first before exporting.");
        return;
    }

    const DPI = 300;
    const IMG_WIDTH_INCHES = 8;
    const PLOT_HEIGHT_INCHES = 8;
    const ROW_HEIGHT_INCHES = 0.35; // Increased slightly for double lines
    const HEADER_HEIGHT_INCHES = 0.4;
    const PADDING_INCHES = 0.2;
    const FONT_SIZE_PT = 11;

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
        { header: 'Session Details', x: padding, width: (canvasWidth - padding * 2) * 0.32 },
        { header: 'Shots', x: padding + (canvasWidth - padding * 2) * 0.32, width: (canvasWidth - padding * 2) * 0.08 },
        { header: 'Mean Radius', x: padding + (canvasWidth - padding * 2) * 0.40, width: (canvasWidth - padding * 2) * 0.15 },
        { header: '95% Radius', x: padding + (canvasWidth - padding * 2) * 0.55, width: (canvasWidth - padding * 2) * 0.15 },
        { header: 'MR CI (95%)', x: padding + (canvasWidth - padding * 2) * 0.70, width: (canvasWidth - padding * 2) * 0.18 },
        { header: 'Vel. SD', x: padding + (canvasWidth - padding * 2) * 0.88, width: (canvasWidth - padding * 2) * 0.12 }
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

        let mrText, r95Text, mrCiText;

        if (stats.hasDistance) {
            mrText = `${stats.ang.mr.moa.toFixed(2)} moa`;
            r95Text = `${stats.ang.r95.moa.toFixed(2)} moa`;
            mrCiText = `[${stats.ang.ci.moa[0].toFixed(2)}, ${stats.ang.ci.moa[1].toFixed(2)}]`;
            
            // Add mrad below or next to it (Doing next to it for export legibility)
            const mrTextSub = ` / ${stats.ang.mr.mrad.toFixed(2)} mrad`;
            const r95TextSub = ` / ${stats.ang.r95.mrad.toFixed(2)} mrad`;
            
            ctx.fillText(mrText + mrTextSub, columns[2].x, currentY + rowHeight / 2);
            ctx.fillText(r95Text + r95TextSub, columns[3].x, currentY + rowHeight / 2);
            ctx.fillText(mrCiText, columns[4].x, currentY + rowHeight / 2);
        } else {
            ctx.fillStyle = '#9ca3af';
            ctx.fillText("Set Dist.", columns[2].x, currentY + rowHeight / 2);
            ctx.fillText("Set Dist.", columns[3].x, currentY + rowHeight / 2);
            ctx.fillText("-", columns[4].x, currentY + rowHeight / 2);
            ctx.fillStyle = '#f3f4f6';
        }

        ctx.fillText(`${stats.vel_sd !== null ? stats.vel_sd.toFixed(2) : 'N/A'}`, columns[5].x, currentY + rowHeight / 2);
        currentY += rowHeight;
    });

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    
    const now = new Date();
    const timestamp = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0') + '-' +
        String(now.getSeconds()).padStart(2, '0');
    
    a.download = `analysis_report_${timestamp}.png`;
    a.click();
}
