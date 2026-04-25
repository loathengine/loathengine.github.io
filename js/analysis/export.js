import { renderAnalysisPlot, colors } from './ui.js';

export async function generateAnalysisCanvas(lastAnalysisResults) {
    if (lastAnalysisResults.length === 0) {
        return null;
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
        { header: 'Session Details', x: padding, width: (canvasWidth - padding * 2) * 0.45 },
        { header: 'Shots', x: padding + (canvasWidth - padding * 2) * 0.45, width: (canvasWidth - padding * 2) * 0.10 },
        { header: 'Mean Radius', x: padding + (canvasWidth - padding * 2) * 0.55, width: (canvasWidth - padding * 2) * 0.225 },
        { header: 'Group Size', x: padding + (canvasWidth - padding * 2) * 0.775, width: (canvasWidth - padding * 2) * 0.225 }
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

        let mrText, gsText;

        if (stats.hasDistance) {
            mrText = `${stats.ang.mr.moa.toFixed(2)} moa / ${stats.ang.mr.mrad.toFixed(2)} mrad`;
            gsText = `${stats.ang.gs.moa.toFixed(2)} moa / ${stats.ang.gs.mrad.toFixed(2)} mrad`;
            
            ctx.fillText(mrText, columns[2].x, currentY + rowHeight / 2);
            ctx.fillText(gsText, columns[3].x, currentY + rowHeight / 2);
        } else {
            ctx.fillStyle = '#9ca3af';
            ctx.fillText("Set Dist.", columns[2].x, currentY + rowHeight / 2);
            ctx.fillText("Set Dist.", columns[3].x, currentY + rowHeight / 2);
            ctx.fillStyle = '#f3f4f6';
        }

        currentY += rowHeight;
    });

    return canvas;
}

export async function handleAnalysisExport(lastAnalysisResults) {
    if (lastAnalysisResults.length === 0) {
        alert("Please run an analysis first before exporting.");
        return;
    }

    const canvas = await generateAnalysisCanvas(lastAnalysisResults);
    if (!canvas) return;

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
