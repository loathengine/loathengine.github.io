// js/targets/generator.js
import { getAllItems, updateItem, deleteItem, generateUniqueId } from '../db.js';

export async function initTargetGenerator() {
    const canvas = document.getElementById('targetCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const previewBtn = document.getElementById('previewTargetBtn');
    const downloadBtn = document.getElementById('downloadTargetBtn');
    const downloadImgBtn = document.getElementById('downloadTargetImgBtn');
    const savePresetBtn = document.getElementById('savePresetBtn');
    const deletePresetBtn = document.getElementById('deletePresetBtn');
    const targetPresetSelect = document.getElementById('targetPresetSelect');
    const presetNameInput = document.getElementById('presetName');

    // Controls
    const controls = {
        paperSize: document.getElementById('paperSize'),
        orientation: document.getElementById('paperOrientation'),
        gridSize: document.getElementById('gridSize'),
        gridColor: document.getElementById('gridColor'),
        bullseyeShape: document.getElementById('bullseyeShape'),
        bullseyeSize: document.getElementById('bullseyeSize'),
        bullseyeColor: document.getElementById('bullseyeColor'),
        centerDotSize: document.getElementById('centerDotSize'),
        outerRingSize: document.getElementById('outerRingSize'),
        rows: document.getElementById('rows'),
        cols: document.getElementById('cols')
    };

    // Defaults
    const defaultPresets = [
        {
            name: "NRA B-8 (25-Yard Pistol)",
            paperSize: "letter", orientation: "portrait", gridSize: "none", gridColor: "#e5e7eb",
            bullseyeShape: "circle", bullseyeSize: 5.54, bullseyeColor: "#000000", centerDotSize: 1.695, outerRingSize: 8.00,
            rows: 1, cols: 1
        },
        {
            name: "ISSF 10m Air Rifle (Grid of 12)",
            paperSize: "letter", orientation: "portrait", gridSize: "none", gridColor: "#e5e7eb",
            bullseyeShape: "circle", bullseyeSize: 1.2, bullseyeColor: "#000000", centerDotSize: 0.02, outerRingSize: 0,
            rows: 4, cols: 3
        },
        {
            name: "NRA A-17 (50ft Smallbore)",
            paperSize: "letter", orientation: "portrait", gridSize: "none", gridColor: "#e5e7eb",
            bullseyeShape: "circle", bullseyeSize: 1.5, bullseyeColor: "#000000", centerDotSize: 0.15, outerRingSize: 0,
            rows: 3, cols: 2
        },
        {
            name: "NRA A-32 (50ft Light Rifle)",
            paperSize: "letter", orientation: "portrait", gridSize: "none", gridColor: "#e5e7eb",
            bullseyeShape: "circle", bullseyeSize: 1.875, bullseyeColor: "#000000", centerDotSize: 0.2, outerRingSize: 3.375,
            rows: 2, cols: 2
        }
    ];

    async function loadPresets() {
        const presets = await getAllItems('customTargets');
        targetPresetSelect.innerHTML = '<option value="">-- Select a Preset --</option>';
        
        // Add defaults if not in DB (virtual defaults)
        const presetMap = new Map();
        defaultPresets.forEach(p => presetMap.set('default-' + p.name, { ...p, id: 'default-' + p.name, isDefault: true }));
        presets.forEach(p => presetMap.set(p.id, p));

        // Render options
        presetMap.forEach((preset, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = preset.name + (preset.isDefault ? ' (Default)' : '');
            targetPresetSelect.appendChild(option);
        });

        // Handle selection
        targetPresetSelect.onchange = () => {
            const selectedId = targetPresetSelect.value;
            if (!selectedId) return;
            
            const preset = presetMap.get(selectedId);
            if (preset) {
                applyPreset(preset);
            }
        };
    }

    function applyPreset(preset) {
        controls.paperSize.value = preset.paperSize;
        controls.orientation.value = preset.orientation;
        controls.gridSize.value = preset.gridSize;
        controls.gridColor.value = preset.gridColor;
        controls.bullseyeShape.value = preset.bullseyeShape;
        controls.bullseyeSize.value = preset.bullseyeSize;
        controls.bullseyeColor.value = preset.bullseyeColor;
        controls.centerDotSize.value = preset.centerDotSize;
        if(controls.outerRingSize) controls.outerRingSize.value = preset.outerRingSize || 0;
        controls.rows.value = preset.rows;
        controls.cols.value = preset.cols;
        
        drawTarget();
    }

    async function savePreset() {
        const name = presetNameInput.value.trim();
        if (!name) {
            alert('Please enter a name for the preset.');
            return;
        }

        const preset = {
            name: name,
            paperSize: controls.paperSize.value,
            orientation: controls.orientation.value,
            gridSize: controls.gridSize.value,
            gridColor: controls.gridColor.value,
            bullseyeShape: controls.bullseyeShape.value,
            bullseyeSize: parseFloat(controls.bullseyeSize.value),
            bullseyeColor: controls.bullseyeColor.value,
            centerDotSize: parseFloat(controls.centerDotSize.value),
            outerRingSize: parseFloat(controls.outerRingSize ? controls.outerRingSize.value : 0),
            rows: parseInt(controls.rows.value),
            cols: parseInt(controls.cols.value)
        };

        await updateItem('customTargets', preset);
        alert('Preset saved!');
        presetNameInput.value = '';
        await loadPresets();
    }

    async function deletePreset() {
        const selectedId = targetPresetSelect.value;
        if (!selectedId) {
            alert('Please select a preset to delete.');
            return;
        }
        if (selectedId.startsWith('default-')) {
            alert('Cannot delete default presets.');
            return;
        }
        
        if (confirm('Are you sure you want to delete this preset?')) {
            await deleteItem('customTargets', selectedId);
            await loadPresets();
            alert('Preset deleted.');
        }
    }

    function drawTarget() {
        const dpi = 300; // High res for print
        const paper = controls.paperSize.value;
        const orientation = controls.orientation.value;
        
        let widthIn, heightIn;

        if (paper === 'letter') {
            widthIn = 8.5;
            heightIn = 11;
        } else { // A4
            widthIn = 8.27;
            heightIn = 11.69;
        }

        if (orientation === 'landscape') {
            [widthIn, heightIn] = [heightIn, widthIn];
        }

        const widthPx = widthIn * dpi;
        const heightPx = heightIn * dpi;

        canvas.width = widthPx;
        canvas.height = heightPx;

        // Visual scaling for preview in the browser (CSS)
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';

        // Fill Background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, widthPx, heightPx);

        // Draw Grid
        const gridVal = controls.gridSize.value;
        let gridSizePx = 0;
        
        if (gridVal !== 'none') {
            if (gridVal === 'cm') {
                gridSizePx = (1 / 2.54) * dpi; // 1 cm in inches * dpi
            } else {
                gridSizePx = parseFloat(gridVal) * dpi;
            }

            ctx.beginPath();
            ctx.lineWidth = 2; // Thin lines
            ctx.strokeStyle = controls.gridColor.value;

            // Vertical lines
            for (let x = 0; x <= widthPx; x += gridSizePx) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, heightPx);
            }
            // Horizontal lines
            for (let y = 0; y <= heightPx; y += gridSizePx) {
                ctx.moveTo(0, y);
                ctx.lineTo(widthPx, y);
            }
            ctx.stroke();
        }

        // Draw Bullseyes
        const rows = parseInt(controls.rows.value) || 1;
        const cols = parseInt(controls.cols.value) || 1;
        
        const cellWidth = widthPx / cols;
        const cellHeight = heightPx / rows;

        const bullseyeSizePx = parseFloat(controls.bullseyeSize.value) * dpi;
        const centerDotSizePx = parseFloat(controls.centerDotSize.value) * dpi;
        const outerRingSizePx = parseFloat(controls.outerRingSize ? controls.outerRingSize.value : 0) * dpi;
        const shape = controls.bullseyeShape.value;
        const color = controls.bullseyeColor.value;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let centerX = (c * cellWidth) + (cellWidth / 2);
                let centerY = (r * cellHeight) + (cellHeight / 2);

                // Snap to Grid
                if (gridSizePx > 0) {
                    centerX = Math.round(centerX / gridSizePx) * gridSizePx;
                    centerY = Math.round(centerY / gridSizePx) * gridSizePx;
                }

                // Draw Outer Ring (if defined)
                if (outerRingSizePx > 0 && shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, outerRingSizePx / 2, 0, Math.PI * 2);
                    ctx.lineWidth = dpi * 0.01; // Thin line
                    ctx.strokeStyle = 'black';
                    ctx.stroke();
                }

                // Draw Main Bullseye
                ctx.fillStyle = color;
                ctx.strokeStyle = color;
                ctx.lineWidth = dpi * 0.02; // stroke width relative to dpi

                if (shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, bullseyeSizePx / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (shape === 'square') {
                    ctx.fillRect(centerX - bullseyeSizePx / 2, centerY - bullseyeSizePx / 2, bullseyeSizePx, bullseyeSizePx);
                } else if (shape === 'diamond') {
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(45 * Math.PI / 180);
                    ctx.fillRect(-bullseyeSizePx / 2, -bullseyeSizePx / 2, bullseyeSizePx, bullseyeSizePx);
                    ctx.restore();
                } else if (shape === 'crosshair') {
                    ctx.beginPath();
                    ctx.moveTo(centerX - bullseyeSizePx / 2, centerY);
                    ctx.lineTo(centerX + bullseyeSizePx / 2, centerY);
                    ctx.moveTo(centerX, centerY - bullseyeSizePx / 2);
                    ctx.lineTo(centerX, centerY + bullseyeSizePx / 2);
                    ctx.stroke();
                }

                // Center Dot
                if (centerDotSizePx > 0) {
                    if (shape === 'crosshair') {
                        ctx.fillStyle = color; // Match crosshair color
                    } else {
                        ctx.fillStyle = 'white'; // Contrast for solids
                    }
                    
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, centerDotSizePx / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // Initial Draw
    setTimeout(drawTarget, 100);
    await loadPresets();

    // Event Listeners
    previewBtn.addEventListener('click', drawTarget);
    savePresetBtn.addEventListener('click', savePreset);
    deletePresetBtn.addEventListener('click', deletePreset);
    
    // Auto-update on changes
    Object.values(controls).forEach(input => {
        if(input) input.addEventListener('change', drawTarget);
    });

    downloadImgBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'custom-target.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    downloadBtn.addEventListener('click', () => {
        const win = window.open('', '_blank');
        const img = canvas.toDataURL('image/png');
        
        win.document.write(`
            <html>
                <head>
                    <title>Print Target</title>
                    <style>
                        body { margin: 0; padding: 0; text-align: center; }
                        img { max-width: 100%; height: auto; }
                        @media print {
                            @page { margin: 0; size: auto; }
                            body { margin: 0; }
                        }
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
