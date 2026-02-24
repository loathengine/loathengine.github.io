// js/targets/generator.js
import { getAllItems, updateItem, deleteItem, generateUniqueId, getItem } from '../db.js';

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

    const importFirearmSelect = document.getElementById('importFirearm');
    const importLoadSelect = document.getElementById('importLoad');
    const importDataBtn = document.getElementById('importDataBtn');

    // Controls Mapping
    const controls = {
        paperSize: document.getElementById('paperSize'),
        orientation: document.getElementById('paperOrientation'),
        
        gridEnabled: document.getElementById('gridEnabled'),
        gridSize: document.getElementById('gridSize'),
        gridColor: document.getElementById('gridColor'),
        
        rows: document.getElementById('rows'),
        cols: document.getElementById('cols'),
        marginX: document.getElementById('marginX'),
        marginY: document.getElementById('marginY'),
        
        shape: document.getElementById('bullseyeShape'),
        diameter: document.getElementById('bullseyeSize'),
        numRings: document.getElementById('numRings'),
        
        bullseyeColor: document.getElementById('bullseyeColor'),
        ringColorA: document.getElementById('ringColorA'),
        ringColorB: document.getElementById('ringColorB'),
        
        labelText: document.getElementById('labelText'),
        labelPosition: document.getElementById('labelPosition'),
        labelSize: document.getElementById('labelSize'),
        labelMargin: document.getElementById('labelMargin')
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
        "legal": { w: 612, h: 1008 },
        "a4": { w: 595, h: 842 }
    };

    async function loadPresets() {
        try {
            console.log("Loading saved targets...");
            let presets = [];
            try {
                presets = await getAllItems('customTargets');
            } catch (dbError) {
                console.warn("Could not load custom targets:", dbError);
            }
            
            targetPresetSelect.innerHTML = '<option value="">-- Select a Saved Target --</option>';
            
            const presetMap = new Map();
            if (presets) {
                presets.forEach(p => presetMap.set(p.id, p));
            }

            presetMap.forEach((preset, id) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = preset.name;
                targetPresetSelect.appendChild(option);
            });

            targetPresetSelect.onchange = () => {
                const selectedId = targetPresetSelect.value;
                if (!selectedId) return;
                const preset = presetMap.get(selectedId);
                if (preset) {
                    console.log("Applying saved target:", preset.name);
                    applyPreset(preset);
                }
            };
        } catch (error) {
            console.error("Failed to load saved targets:", error);
        }
    }

    async function loadImportData() {
        if (!importFirearmSelect || !importLoadSelect) return;

        try {
            const firearms = await getAllItems('firearms');
            const loads = await getAllItems('loads');
            const cartridges = await getAllItems('cartridges');
            const bullets = await getAllItems('bullets');
            const powders = await getAllItems('powders');
            const manufacturers = await getAllItems('manufacturers');

            // Populate Firearms
            importFirearmSelect.innerHTML = '<option value="">-- Select Firearm --</option>';
            firearms.forEach(f => {
                const option = document.createElement('option');
                option.value = f.id;
                option.textContent = f.nickname;
                importFirearmSelect.appendChild(option);
            });

            // Populate Loads
            importLoadSelect.innerHTML = '<option value="">-- Select Load --</option>';
            loads.forEach(l => {
                const option = document.createElement('option');
                option.value = l.id;

                let label = "Unknown Load";
                const cartridge = cartridges.find(c => c.id === l.cartridgeId);
                const cartName = cartridge ? cartridge.name : "N/A";

                if (l.loadType === 'commercial') {
                    const mfg = manufacturers.find(m => m.id === l.manufacturerId);
                    const mfgName = mfg ? mfg.name : '';
                    label = `${cartName} - ${mfgName} ${l.name}`;
                } else {
                    const bullet = bullets.find(b => b.id === l.bulletId);
                    const powder = powders.find(p => p.id === l.powderId);
                    const bulletStr = bullet ? `${bullet.weight}gr` : '';
                    const powderStr = powder ? powder.name : '';
                    let chargeStr = '';
                    if (Array.isArray(l.chargeWeight)) chargeStr = l.chargeWeight.join(',');
                    else if (l.chargeWeight) chargeStr = l.chargeWeight;
                    
                    label = `${cartName} - ${bulletStr} ${chargeStr}gr ${powderStr}`;
                }

                option.textContent = label;
                importLoadSelect.appendChild(option);
            });

        } catch (err) {
            console.error("Error loading import data", err);
        }
    }

    async function insertImportData() {
        const firearmId = importFirearmSelect.value;
        const loadId = importLoadSelect.value;
        
        let textToInsert = "";

        // FIREARM DATA
        if (firearmId) {
            const firearm = await getItem('firearms', firearmId);
            if (firearm) {
                textToInsert += `Firearm: ${firearm.nickname}\n`;
            }
        }

        // LOAD DATA
        if (loadId) {
            const load = await getItem('loads', loadId);
            if (load) {
                 const cartridge = await getItem('cartridges', load.cartridgeId);
                 const cartName = cartridge ? cartridge.name : "";

                 // Commercial Ammo
                 if (load.loadType === 'commercial') {
                    const mfg = await getItem('manufacturers', load.manufacturerId);
                    // Minimal check for bullet info if present
                    let bulletInfo = "";
                    if (load.bulletId) {
                        const bullet = await getItem('bullets', load.bulletId);
                        const bMfg = bullet ? await getItem('manufacturers', bullet.manufacturerId) : null;
                        if (bullet) {
                            bulletInfo = `${bMfg ? bMfg.name : ''} ${bullet.name} ${bullet.weight}gr`.trim();
                        }
                    }

                    textToInsert += `Cartridge: ${cartName}\n`;
                    textToInsert += `Ammo: ${mfg ? mfg.name : ''} ${load.name}\n`;
                    if (bulletInfo) textToInsert += `Bullet: ${bulletInfo}\n`;
                 } 
                 // Handload
                 else {
                    const bullet = await getItem('bullets', load.bulletId);
                    const bulletMfg = bullet ? await getItem('manufacturers', bullet.manufacturerId) : null;
                    
                    const powder = await getItem('powders', load.powderId);
                    const powderMfg = powder ? await getItem('manufacturers', powder.manufacturerId) : null;
                    
                    const primer = await getItem('primers', load.primerId);
                    const primerMfg = primer ? await getItem('manufacturers', primer.manufacturerId) : null;
                    
                    const brass = await getItem('brass', load.brassId);
                    const brassMfg = brass ? await getItem('manufacturers', brass.manufacturerId) : null;

                    // Building Strings
                    const bulletStr = bullet ? `${bulletMfg ? bulletMfg.name : ''} ${bullet.name} ${bullet.weight}gr` : '';
                    const powderStr = powder ? `${powderMfg ? powderMfg.name : ''} ${powder.name}` : '';
                    
                    let chargeStr = '';
                    if (Array.isArray(load.chargeWeight)) chargeStr = load.chargeWeight.join(', ');
                    else chargeStr = load.chargeWeight || '';

                    // Construct the text block
                    textToInsert += `Cartridge: ${cartName}\n`;
                    if (bulletStr) textToInsert += `Bullet: ${bulletStr}\n`;
                    if (powderStr) textToInsert += `Powder: ${powderStr} (${chargeStr}gr)\n`;
                    
                    if (load.col) {
                         let colStr = '';
                         if (Array.isArray(load.col)) colStr = load.col.join(', ');
                         else colStr = load.col;
                         textToInsert += `COAL: ${colStr}"\n`;
                    }
                    
                    if (primer) textToInsert += `Primer: ${primerMfg ? primerMfg.name : ''} ${primer.name}\n`;
                    if (brass) textToInsert += `Brass: ${brassMfg ? brassMfg.name : ''}\n`;
                 }
            }
        }

        if (textToInsert) {
            const currentText = controls.labelText.value;
            // Append with a newline if there's already text
            controls.labelText.value = currentText + (currentText ? "\n" : "") + textToInsert.trim();
            drawTarget();
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
        
        // Handle margins (fallback to old 'margin' if available)
        const legacyMargin = preset.margin !== undefined ? preset.margin : 0.5;
        controls.marginX.value = preset.marginX !== undefined ? preset.marginX : legacyMargin;
        controls.marginY.value = preset.marginY !== undefined ? preset.marginY : legacyMargin;
        
        controls.shape.value = preset.shape || "circle";
        controls.diameter.value = preset.diameter || 6.0;
        controls.numRings.value = preset.numRings || 5;
        
        controls.bullseyeColor.value = preset.bullseyeColor || "#ff0000";
        controls.ringColorA.value = preset.ringColorA || "#000000";
        controls.ringColorB.value = preset.ringColorB || "#ffffff";
        
        controls.labelText.value = preset.labelText || "";
        controls.labelPosition.value = preset.labelPosition || "top-left";
        controls.labelSize.value = preset.labelSize || 12;
        controls.labelMargin.value = preset.labelMargin !== undefined ? preset.labelMargin : 0.25;

        drawTarget();
    }

    async function savePreset() {
        const name = presetNameInput.value.trim();
        if (!name) return alert('Please enter a name for the target.');

        const preset = {
            name: name,
            paperSize: controls.paperSize.value,
            orientation: controls.orientation.value,
            gridEnabled: controls.gridEnabled.checked,
            gridSize: parseFloat(controls.gridSize.value),
            gridColor: controls.gridColor.value,
            rows: parseInt(controls.rows.value),
            cols: parseInt(controls.cols.value),
            marginX: parseFloat(controls.marginX.value),
            marginY: parseFloat(controls.marginY.value),
            shape: controls.shape.value,
            diameter: parseFloat(controls.diameter.value),
            numRings: parseInt(controls.numRings.value),
            bullseyeColor: controls.bullseyeColor.value,
            ringColorA: controls.ringColorA.value,
            ringColorB: controls.ringColorB.value,
            labelText: controls.labelText.value,
            labelPosition: controls.labelPosition.value,
            labelSize: parseInt(controls.labelSize.value),
            labelMargin: parseFloat(controls.labelMargin.value)
        };

        try {
            await updateItem('customTargets', preset);
            alert('Target saved!');
            presetNameInput.value = '';
            await loadPresets();
        } catch (error) {
            console.error("Failed to save target:", error);
            alert("Failed to save target.");
        }
    }

    async function deletePreset() {
        const selectedId = targetPresetSelect.value;
        if (!selectedId) return alert('Please select a target to delete.');
        
        if (confirm('Are you sure you want to delete this target?')) {
            try {
                await deleteItem('customTargets', selectedId);
                await loadPresets();
                alert('Target deleted.');
            } catch (error) {
                console.error("Failed to delete target:", error);
                alert("Failed to delete target.");
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

        if (shape === "triangle" || shape === "triangle-up") {
            steps = 3;
            offset = -Math.PI / 2;
        } else if (shape === "triangle-down") {
            steps = 3;
            offset = Math.PI / 2;
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
        const mX = (parseFloat(controls.marginX.value) || 0) * PPI;
        const mY = (parseFloat(controls.marginY.value) || 0) * PPI;
        const coords = [];

        if (!controls.gridEnabled.checked) {
            const cellW = (pW - (2 * mX)) / cols;
            const cellH = (pH - (2 * mY)) / rows;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cx = mX + (c * cellW) + (cellW / 2);
                    const cy = mY + (r * cellH) + (cellH / 2);
                    coords.push({ cx, cy });
                }
            }
            return coords;
        }

        const gridSizeVal = parseFloat(controls.gridSize.value) || 1.0;
        const gridPts = gridSizeVal * PPI;
        
        const availW = pW - (2 * mX);
        const rawSpacingX = availW / Math.max(1, cols);
        let snappedSpacingX = Math.round(rawSpacingX / gridPts) * gridPts;
        if (snappedSpacingX < gridPts) snappedSpacingX = gridPts;

        const arrWidth = (cols - 1) * snappedSpacingX;
        const centerX = pW / 2;
        const idealStartX = centerX - (arrWidth / 2);
        const offsetX = idealStartX - centerX;
        const alignedOffsetX = Math.round(offsetX / gridPts) * gridPts;
        const startX = centerX + alignedOffsetX;

        const availH = pH - (2 * mY);
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

            const mX = (parseFloat(controls.marginX.value) || 0) * PPI;
            const mY = (parseFloat(controls.marginY.value) || 0) * PPI;

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
                    if (x >= mX && x <= (pW - mX)) {
                        ctx.moveTo(x, mY);
                        ctx.lineTo(x, pH - mY);
                    }
                }
                for (let y = startY; y <= pH; y += gridPts) {
                    if (y >= mY && y <= (pH - mY)) {
                        ctx.moveTo(mX, y);
                        ctx.lineTo(pW - mX, y);
                    }
                }
                ctx.stroke();
            }

            // 3. Draw Label
            const labelText = controls.labelText.value;
            if (labelText.trim()) {
                const fontSize = parseInt(controls.labelSize.value) || 12;
                ctx.font = `bold ${fontSize}px Arial`;
                
                const lines = labelText.split('\n');
                const lineHeight = fontSize * 1.2;
                const pos = controls.labelPosition.value;
                
                const labelMarginVal = parseFloat(controls.labelMargin.value);
                const lMargin = (isNaN(labelMarginVal) ? 0.25 : labelMarginVal) * PPI;
                const boxPad = 5;

                // Calculate Text Block Dimensions
                let maxW = 0;
                lines.forEach(line => {
                    const w = ctx.measureText(line).width;
                    if (w > maxW) maxW = w;
                });
                const totalH = lines.length * lineHeight;

                let startX, startY;

                // Determine coordinates of Top-Left of text block
                if (pos === "top-left") {
                    startX = lMargin;
                    startY = lMargin;
                } else if (pos === "top-right") {
                    startX = pW - lMargin - maxW; 
                    startY = lMargin;
                } else if (pos === "bottom-left") {
                    startX = lMargin;
                    startY = pH - lMargin - totalH;
                } else if (pos === "bottom-right") {
                    startX = pW - lMargin - maxW;
                    startY = pH - lMargin - totalH;
                }

                // Draw Box Background
                ctx.fillStyle = "white";
                ctx.fillRect(startX - boxPad, startY - boxPad, maxW + (boxPad * 2), totalH + (boxPad * 2));
                
                // Draw Box Border
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
                ctx.strokeRect(startX - boxPad, startY - boxPad, maxW + (boxPad * 2), totalH + (boxPad * 2));

                // Draw Text
                ctx.fillStyle = "black";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";

                lines.forEach((line, i) => {
                    ctx.fillText(line, startX, startY + (i * lineHeight));
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
    if(importDataBtn) importDataBtn.addEventListener('click', insertImportData);
    
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
    await loadImportData(); // Initialize import dropdowns
    // Force initial draw
    drawTarget();
}
