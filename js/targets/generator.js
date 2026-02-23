// js/targets/generator.js
import { getAllItems, updateItem, deleteItem, generateUniqueId } from '../db.js';

export async function initTargetGenerator() {
    console.log("Initializing Target Generator...");
    const canvas = document.getElementById('targetCanvas');
    if (!canvas) {
        console.error("Target generator canvas not found");
        return;
    }

    const ctx = canvas.getContext('2d');
    const previewBtn = document.getElementById('previewTargetBtn');
    const downloadBtn = document.getElementById('downloadTargetBtn');
    const downloadImgBtn = document.getElementById('downloadTargetImgBtn');
    const savePresetBtn = document.getElementById('savePresetBtn');
    const deletePresetBtn = document.getElementById('deletePresetBtn');
    const targetPresetSelect = document.getElementById('targetPresetSelect');
    const presetNameInput = document.getElementById('presetName');

    // Controls Mapping
    const controls = {
        paperSize: document.getElementById('paperSize'),
        orientation: document.getElementById('paperOrientation'),
        
        gridEnabled: document.getElementById('gridEnabled'),
        gridSize: document.getElementById('gridSize'),
        gridColor: document.getElementById('gridColor'),
        
        rows: document.getElementById('rows'),
        cols: document.getElementById('cols'),
        margin: document.getElementById('margin'),
        
        shape: document.getElementById('bullseyeShape'),
        diameter: document.getElementById('bullseyeSize'),
        numRings: document.getElementById('numRings'),
        
        bullseyeColor: document.getElementById('bullseyeColor'),
        ringColorA: document.getElementById('ringColorA'),
        ringColorB: document.getElementById('ringColorB'),
        
        labelText: document.getElementById('labelText'),
        labelPosition: document.getElementById('labelPosition'),
        labelSize: document.getElementById('labelSize')
    };

    // Check for missing controls
    const missingControls = Object.keys(controls).filter(key => !controls[key]);
    if (missingControls.length > 0) {
        console.error("Target Generator: Missing controls:", missingControls);
        return;
    }

    // Constants
    const PPI = 72; 
    const SCALE = 3; 
    
    // Paper Definitions (in Points)
    const PAPERS = {
        "letter": { w: 612, h: 792 },
        "a4": { w: 595, h: 842 }
    };

    // Defaults
    const defaultPresets = [
        {
            name: "NRA B-8 (25-Yard Pistol)",
            paperSize: "letter", orientation: "portrait", 
            gridEnabled: false, gridSize: 1.0, gridColor: "#cccccc",
            rows: 1, cols: 1, margin: 0.5,
            shape: "circle", diameter: 5.54, numRings: 2, 
            bullseyeColor: "#000000", ringColorA: "#ffffff", ringColorB: "#000000",
            labelText: "NRA B-8 (Approx)", labelPosition: "top-left", labelSize: 12
        },
        {
            name: "ISSF 10m Air Rifle (Grid of 12)",
            paperSize: "letter", orientation: "portrait", 
            gridEnabled: false, gridSize: 1.0, gridColor: "#cccccc",
            rows: 4, cols: 3, margin: 0.5,
            shape: "circle", diameter: 1.2, numRings: 1, 
            bullseyeColor: "#000000", ringColorA: "#ffffff", ringColorB: "#ffffff",
            labelText: "ISSF 10m", labelPosition: "top-left", labelSize: 10
        }
    ];

    async function loadPresets() {
        try {
            console.log("Loading target presets...");
            let presets = [];
            try {
                presets = await getAllItems('customTargets');
            } catch (dbError) {
                console.warn("Could not load custom targets:", dbError);
            }
            
            targetPresetSelect.innerHTML = '<option value="">-- Select a Preset --</option>';
            
            const presetMap = new Map();
            defaultPresets.forEach(p => presetMap.set('default-' + p.name, { ...p, id: 'default-' + p.name, isDefault: true }));
            if (presets) {
                presets.forEach(p => presetMap.set(p.id, p));
            }

            presetMap.forEach((preset, id) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = preset.name + (preset.isDefault ? ' (Default)' : '');
                targetPresetSelect.appendChild(option);
            });

            targetPresetSelect.onchange = () => {
                const selectedId = targetPresetSelect.value;
                if (!selectedId) return;
                const preset = presetMap.get(selectedId);
                if (preset) {
                    console.log("Applying preset:", preset.name);
                    applyPreset(preset);
                }
            };
        } catch (error) {
            console.error("Failed to load presets:", error);
        }
    }

    function applyPreset(preset) {
        if (!preset) return;
        controls.paperSize.value = preset.paperSize || "letter";
        controls.orientation.value = preset.orientation || "portrait";
        
        controls.gridEnabled.checked = (preset.gridEnabled === true || preset.gridEnabled === "true");
        if (preset.gridEnabled === undefined) controls.gridEnabled.checked = true;

        controls.gridSize.value = preset.gridSize || 1.0;
        controls.gridColor.value = preset.gridColor || "#cccccc";
        
        controls.rows.value = preset.rows || 1;
        controls.cols.value = preset.cols || 1;
        controls.margin.value = preset.margin !== undefined ? preset.margin : 0.5;
        
        controls.shape.value = preset.shape || "circle";
        controls.diameter.value = preset.diameter || 6.0;
        controls.numRings.value = preset.numRings || 5;
        
        controls.bullseyeColor.value = preset.bullseyeColor || "#ff0000";
        controls.ringColorA.value = preset.ringColorA || "#000000";
        controls.ringColorB.value = preset.ringColorB || "#ffffff";
        
        controls.labelText.value = preset.labelText || "";
        controls.labelPosition.value = preset.labelPosition || "top-left";
        controls.labelSize.value = preset.labelSize || 12;

        drawTarget();
    }

    async function savePreset() {
        const name = presetNameInput.value.trim();
        if (!name) return alert('Please enter a name for the preset.');

        const preset = {
            name: name,
            paperSize: controls.paperSize.value,
            orientation: controls.orientation.value,
            gridEnabled: controls.gridEnabled.checked,
            gridSize: parseFloat(controls.gridSize.value),
            gridColor: controls.gridColor.value,
            rows: parseInt(controls.rows.value),
            cols: parseInt(controls.cols.value),
            margin: parseFloat(controls.margin.value),
            shape: controls.shape.value,
            diameter: parseFloat(controls.diameter.value),
            numRings: parseInt(controls.numRings.value),
            bullseyeColor: controls.bullseyeColor.value,
            ringColorA: controls.ringColorA.value,
            ringColorB: controls.ringColorB.value,
            labelText: controls.labelText.value,
            labelPosition: controls.labelPosition.value,
            labelSize: parseInt(controls.labelSize.value)
        };

        try {
            await updateItem('customTargets', preset);
            alert('Preset saved!');
            presetNameInput.value = '';
            await loadPresets();
        } catch (error) {
            console.error("Failed to save preset:", error);
            alert("Failed to save preset.");
        }
    }

    async function deletePreset() {
        const selectedId = targetPresetSelect.value;
        if (!selectedId) return alert('Please select a preset to delete.');
        if (selectedId.startsWith('default-')) return alert('Cannot delete default presets.');
        
        if (confirm('Are you sure you want to delete this preset?')) {
            try {
                await deleteItem('customTargets', selectedId);
                await loadPresets();
                alert('Preset deleted.');
            } catch (error) {
                console.error("Failed to delete preset:", error);
                alert("Failed to delete preset.");
            }
        }
    }

    // --- Helper Functions ---

    function getPaperDimsPoints() {
        const p = PAPERS[controls.paperSize.value] || PAPERS["letter"];
        if (controls.orientation.value === "landscape") {
            return { w: p.h, h: p.w };
        }
        return { w: p.w, h: p.h };
    }

    function getPolygonPoints(shape, cx, cy, r) {
        const points = [];
        let steps = 0;
        let offset = 0;

        if (shape === "triangle") {
            steps = 3;
            offset = -Math.PI / 2;
        } else if (shape === "square") {
            steps = 4;
            offset = -Math.PI / 4;
        } else if (shape === "hexagon") {
            steps = 6;
            offset = -Math.PI / 2;
        } else {
            return [];
        }

        for (let i = 0; i < steps; i++) {
            const angle = offset + (2 * Math.PI * i / steps);
            points.push({
                x: cx + r * Math.cos(angle),
                y: cy + r * Math.sin(angle)
            });
        }
        return points;
    }

    function calculateTargetPositions(pW, pH) {
        const rows = parseInt(controls.rows.value) || 1;
        const cols = parseInt(controls.cols.value) || 1;
        const margin = (parseFloat(controls.margin.value) || 0) * PPI;
        const coords = [];

        if (!controls.gridEnabled.checked) {
            const cellW = (pW - (2 * margin)) / cols;
            const cellH = (pH - (2 * margin)) / rows;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cx = margin + (c * cellW) + (cellW / 2);
                    const cy = margin + (r * cellH) + (cellH / 2);
                    coords.push({ cx, cy });
                }
            }
            return coords;
        }

        const gridSizeVal = parseFloat(controls.gridSize.value) || 1.0;
        const gridPts = gridSizeVal * PPI;
        
        const availW = pW - (2 * margin);
        const rawSpacingX = availW / Math.max(1, cols);
        let snappedSpacingX = Math.round(rawSpacingX / gridPts) * gridPts;
        if (snappedSpacingX < gridPts) snappedSpacingX = gridPts;

        const arrWidth = (cols - 1) * snappedSpacingX;
        const centerX = pW / 2;
        const idealStartX = centerX - (arrWidth / 2);
        const offsetX = idealStartX - centerX;
        const alignedOffsetX = Math.round(offsetX / gridPts) * gridPts;
        const startX = centerX + alignedOffsetX;

        const availH = pH - (2 * margin);
        const rawSpacingY = availH / Math.max(1, rows);
        let snappedSpacingY = Math.round(rawSpacingY / gridPts) * gridPts;
        if (snappedSpacingY < gridPts) snappedSpacingY = gridPts;

        const arrHeight = (rows - 1) * snappedSpacingY;
        const centerY = pH / 2;
        const idealStartY = centerY - (arrHeight / 2);
        const offsetY = idealStartY - centerY;
        const alignedOffsetY = Math.round(offsetY / gridPts) * gridPts;
        const startY = centerY + alignedOffsetY;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                coords.push({
                    cx: startX + (c * snappedSpacingX),
                    cy: startY + (r * snappedSpacingY)
                });
            }
        }
        return coords;
    }

    function drawTarget() {
        try {
            console.log("Drawing target...");
            const dim = getPaperDimsPoints();
            const pW = dim.w;
            const pH = dim.h;
            
            if (!pW || !pH) return;

            canvas.width = pW * SCALE;
            canvas.height = pH * SCALE;
            
            // Explicitly set context state
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.scale(SCALE, SCALE);

            // Fill Background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, pW, pH);

            const margin = (parseFloat(controls.margin.value) || 0) * PPI;

            // 1. Draw Targets
            const targetCoords = calculateTargetPositions(pW, pH);
            const shape = controls.shape.value;
            const numRings = parseInt(controls.numRings.value) || 1;
            const diameterIn = parseFloat(controls.diameter.value) || 1;
            const maxRadius = (diameterIn * PPI) / 2;
            const step = maxRadius / Math.max(1, numRings);

            const colBull = controls.bullseyeColor.value;
            const colA = controls.ringColorA.value;
            const colB = controls.ringColorB.value;

            targetCoords.forEach(pos => {
                for (let i = 0; i < numRings; i++) {
                    const currR = maxRadius - (i * step);
                    if (currR <= 0) continue;
                    
                    let fillCol;
                    
                    if (i === numRings - 1) fillCol = colBull;
                    else fillCol = (i % 2 === 0) ? colA : colB;
                    
                    ctx.fillStyle = fillCol;
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 1;

                    ctx.beginPath();
                    if (shape === "circle") {
                        ctx.arc(pos.cx, pos.cy, currR, 0, Math.PI * 2);
                    } else {
                        const pts = getPolygonPoints(shape, pos.cx, pos.cy, currR);
                        if (pts.length > 0) {
                            ctx.moveTo(pts[0].x, pts[0].y);
                            for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
                            ctx.closePath();
                        }
                    }
                    ctx.fill();
                    ctx.stroke();
                }
            });

            // 2. Draw Grid
            if (controls.gridEnabled.checked) {
                const gridSizeVal = parseFloat(controls.gridSize.value) || 1.0;
                const gridPts = gridSizeVal * PPI;
                const gridCol = controls.gridColor.value;
                
                ctx.strokeStyle = gridCol;
                ctx.lineWidth = 1;

                const midX = pW / 2;
                const midY = pH / 2;
                const startX = midX % gridPts;
                const startY = midY % gridPts;

                ctx.beginPath();
                for (let x = startX; x <= pW; x += gridPts) {
                    if (x >= margin && x <= (pW - margin)) {
                        ctx.moveTo(x, margin);
                        ctx.lineTo(x, pH - margin);
                    }
                }
                for (let y = startY; y <= pH; y += gridPts) {
                    if (y >= margin && y <= (pH - margin)) {
                        ctx.moveTo(margin, y);
                        ctx.lineTo(pW - margin, y);
                    }
                }
                ctx.stroke();
            }

            // 3. Draw Label
            const labelText = controls.labelText.value;
            if (labelText.trim()) {
                const fontSize = parseInt(controls.labelSize.value) || 12;
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = "black";
                
                const lines = labelText.split('\n');
                const lineHeight = fontSize * 1.2;
                const pos = controls.labelPosition.value;
                const pad = 10;

                let tx, ty;
                let textAlign = "left";
                let textBaseline = "top";

                if (pos === "top-left") {
                    tx = margin + pad;
                    ty = margin + pad;
                } else if (pos === "top-right") {
                    tx = pW - margin - pad;
                    ty = margin + pad;
                    textAlign = "right";
                } else if (pos === "bottom-left") {
                    tx = margin + pad;
                    ty = pH - margin - pad - (lines.length * lineHeight);
                } else if (pos === "bottom-right") {
                    tx = pW - margin - pad;
                    ty = pH - margin - pad - (lines.length * lineHeight);
                    textAlign = "right";
                }

                ctx.textAlign = textAlign;
                ctx.textBaseline = textBaseline;

                lines.forEach((line, i) => {
                    ctx.fillText(line, tx, ty + (i * lineHeight));
                });
            }
        } catch (error) {
            console.error("Error drawing target:", error);
        }
    }

    // --- Init & Event Listeners ---
    if(previewBtn) previewBtn.addEventListener('click', drawTarget);
    if(savePresetBtn) savePresetBtn.addEventListener('click', savePreset);
    if(deletePresetBtn) deletePresetBtn.addEventListener('click', deletePreset);
    
    Object.values(controls).forEach(input => {
        if(input) input.addEventListener('input', drawTarget);
    });

    if(downloadImgBtn) {
        downloadImgBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'custom-target.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    if(downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const img = canvas.toDataURL('image/png');
            const win = window.open('', '_blank');
            win.document.write(`
                <html>
                    <head>
                        <title>Print Target</title>
                        <style>
                            body { margin: 0; padding: 0; text-align: center; }
                            img { max-width: 100%; height: auto; }
                            @media print { @page { margin: 0; size: auto; } body { margin: 0; } }
                        </style>
                    </head>
                    <body>
                        <img src="${img}" onload="window.print();">
                    </body>
                </html>
            `);
            win.document.close();
        });
    }

    await loadPresets();
    // Force initial draw
    drawTarget();
}
