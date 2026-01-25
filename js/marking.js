// js/marking.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { populateSelect, createSessionName } from './utils.js';

let img = null;
let scale = { p1: null, p2: null, distance: null, units: 'in', pixelsPerUnit: null };
let groups = [];
let currentGroupIndex = -1;
let settingState = null;
let sessionID = null;
let currentTargetId = null;

// Panning logic removed in favor of browser native scrolling.
// Scale logic now resizes the canvas element.
let transform = { scale: 1 }; 
let animationFrameId;

export async function refreshImpactMarkingUI() {
    const firearms = await getAllItems('firearms');
    populateSelect('firearmSelect', firearms, 'nickname', 'id');

    const loads = await getAllItems('loads');
    const loadSelect = document.getElementById('loadSelect');
    if (!loadSelect) return;
    const currentLoadVal = loadSelect.value;
    loadSelect.innerHTML = '<option value="">-- Associate Load (Optional) --</option>';
    for (const load of loads) {
        const option = document.createElement('option');
        option.value = load.id;
        
        if (load.loadType === 'commercial') {
            const mfg = await getItem('manufacturers', load.manufacturerId);
            option.textContent = `${mfg ? mfg.name : ''} ${load.name} ${load.bulletWeight || ''}gr`.trim();
        } else {
            const bullet = await getItem('bullets', load.bulletId);
            const powder = await getItem('powders', load.powderId);
            let bulletName = 'Unknown Bullet';
            if (bullet) {
                const bulletMfg = await getItem('manufacturers', bullet.manufacturerId);
                bulletName = `${bullet.weight}gr ${bulletMfg ? bulletMfg.name : ''} ${bullet.name}`;
            }
            const powderName = powder ? powder.name : 'Unknown Powder';
            
            let chargeVal = '---';
            if (Array.isArray(load.chargeWeight)) {
                chargeVal = load.chargeWeight.join(', ');
            } else if (load.chargeWeight !== undefined) {
                 chargeVal = load.chargeWeight;
            }

            option.textContent = `(HL) ${bulletName} | ${powderName} ${chargeVal}gr`;
        }
        loadSelect.appendChild(option);
    }
    loadSelect.value = currentLoadVal;
    
    const savedImageSelect = document.getElementById('savedImageSelect');
    const targets = await getAllItems('targetImages');
    const currentTargetVal = savedImageSelect.value;
    savedImageSelect.innerHTML = '<option value="">-- Select a Saved Target --</option>';
    targets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    targets.forEach(target => {
        const option = document.createElement('option');
        option.value = target.id;
        option.textContent = target.name;
        savedImageSelect.appendChild(option);
    });
    savedImageSelect.value = currentTargetVal;
}

export function initImpactMarking() {
    const canvas = document.getElementById('targetCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const savedImageSelect = document.getElementById('savedImageSelect');
    const markingSessionSelect = document.getElementById('markingSessionSelect');
    const loadMarkingSessionBtn = document.getElementById('loadMarkingSessionBtn');
    const deleteMarkingSessionBtn = document.getElementById('deleteMarkingSessionBtn');
    const removeImageBtn = document.getElementById('removeImage');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const setScaleBtn = document.getElementById('setScale');
    const addGroupBtn = document.getElementById('addGroup');
    const groupSelect = document.getElementById('groupSelect');
    const setPoaBtn = document.getElementById('setPoa');
    const setPoiBtn = document.getElementById('setPoi');
    const deleteShotBtn = document.getElementById('deleteShot');
    const deleteLastBtn = document.getElementById('deleteLast');
    const deleteGroupBtn = document.getElementById('deleteGroup');
    const statsOutput = document.getElementById('stats-output');
    const toggleButtons = [setScaleBtn, setPoaBtn, setPoiBtn, deleteShotBtn];
    const saveImpactDataBtn = document.getElementById('saveImpactDataBtn');
    
    async function populateMarkingSessionSelect() {
        const sessions = await getAllItems('impactData');
        sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const currentVal = markingSessionSelect.value;
        markingSessionSelect.innerHTML = `<option value="">-- Select a Session to load/delete --</option>`;
        for(const session of sessions) {
            const option = document.createElement('option');
            option.value = session.id;
            option.textContent = await createSessionName(session);
            markingSessionSelect.appendChild(option);
        }
        markingSessionSelect.value = currentVal;
    }
    
    refreshImpactMarkingUI().then(populateMarkingSessionSelect);
    resetCanvasState();

    function updateCanvasSize() {
        if (!img || !img.baseWidth) return;
        // Resize the canvas to match the zoomed dimensions
        // Note: Changing canvas.width/height clears the canvas, so draw() must be called afterwards (which happens in loop)
        canvas.width = Math.floor(img.baseWidth * transform.scale);
        canvas.height = Math.floor(img.baseHeight * transform.scale);
    }

    function draw() {
        if (!img) {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             return; 
        }

        // No need to clearRect if we are overwriting everything with the image or if resize happened
        // But for safety:
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        // Since we resized the canvas to be larger, we also scale the context 
        // so that drawing operations (which use base coordinates) are scaled up.
        ctx.scale(transform.scale, transform.scale);

        ctx.drawImage(img, 0, 0, img.baseWidth, img.baseHeight);

        // Drawing overlays
        // IMPORTANT: overlay coordinates are in "base" space (0..baseWidth)
        // context scale handles the mapping to "zoomed" space

        if (settingState === 'scale_p2' && scale.p1) {
            ctx.beginPath();
            ctx.moveTo(scale.p1.x, scale.p1.y);
            // Mouse pos is already converted to base coords in getCanvasCoords
            const currentMouse = getCanvasCoords({clientX: mousePos.x, clientY: mousePos.y});
            ctx.lineTo(currentMouse.x, currentMouse.y);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = 2 / transform.scale; 
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        if (scale.p1 && scale.p2) {
            ctx.beginPath();
            ctx.moveTo(scale.p1.x, scale.p1.y);
            ctx.lineTo(scale.p2.x, scale.p2.y);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2 / transform.scale;
            ctx.stroke();
        }

        groups.forEach((group) => {
            if (group.poa) { drawPOA(group.poa, group.color); }
            group.pois.forEach(poi => drawCircle(poi, group.color));
            if (group.stats && group.stats.mpi && group.pois.length > 0) {
                drawMPI(group.stats.mpi, group.color);
            }
        });

        ctx.restore();
    }
    
    function drawCircle(point, color) {
        // Radius should appear constant relative to image features?
        // Or constant relative to screen?
        // Original code: radius = 8 / transform.scale => constant on screen
        // If we want constant on screen:
        const radius = 8 / transform.scale;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawPOA(point, color) {
        const size = 16 / transform.scale;
        ctx.beginPath();
        ctx.moveTo(point.x - size / 2, point.y);
        ctx.lineTo(point.x + size / 2, point.y);
        ctx.moveTo(point.x, point.y - size / 2);
        ctx.lineTo(point.x, point.y + size / 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / transform.scale;
        ctx.stroke();
    }

    function drawMPI(point, color) {
        const size = 16 / transform.scale;
        ctx.beginPath();
        ctx.rect(point.x - size / 2, point.y - size / 2, size, size);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / transform.scale;
        ctx.stroke();
    }
    
    function getCanvasCoords(e) {
        if (!img) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        // e.clientX is relative to viewport. rect is relative to viewport.
        // The difference is the position relative to the canvas element's top-left corner.
        // Because the canvas element is sized to match the zoom, we just need to 
        // map these pixels back to "base" coordinates by dividing by scale.
        
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // However, we must consider if CSS scaling is happening (unlikely if we just set width/height attributes).
        // But for robustness:
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const trueCanvasX = canvasX * scaleX;
        const trueCanvasY = canvasY * scaleY;

        return { x: trueCanvasX / transform.scale, y: trueCanvasY / transform.scale };
    }

    function updateActiveButton(activeButton) {
        toggleButtons.forEach(btn => btn.classList.remove('active'));
        if (activeButton) {
            activeButton.classList.add('active');
        }
        canvas.classList.toggle('delete-mode', settingState === 'delete_poi');
    }

    savedImageSelect.addEventListener('change', async (e) => {
        const targetId = e.target.value;
        
        // Clear current image immediately as we are switching
        img = null;

        if (!targetId) {
            currentTargetId = null;
            resetCanvasState();
            return;
        }
        
        const targetData = await getItem('targetImages', targetId);
        if (targetData) {
            // Use local variable to avoid race condition where img exists but baseWidth is undefined
            const newImg = new Image();
            newImg.onload = () => { 
                currentTargetId = targetId;
                
                // Establish base dimensions
                // We'll use a fixed base width for coordinate consistency, or just use natural size?
                // Using a fixed base width (e.g. 800) keeps dots consistent relative to image size if we swap images?
                // Actually, let's use the image natural size as the base, or a standard working width.
                // The previous code effectively used 800 as the working width.
                const workingBaseWidth = 800;
                const aspectRatio = newImg.naturalHeight / newImg.naturalWidth;
                
                newImg.baseWidth = workingBaseWidth;
                newImg.baseHeight = workingBaseWidth * aspectRatio;
                
                // Reset zoom when loading new image
                transform.scale = 1; 
                
                img = newImg; // Update global image only when ready
                updateCanvasSize();

                if (!sessionID) { resetCanvasState(); }
            };
            newImg.src = targetData.dataUrl;
        }
    });
    
    removeImageBtn.addEventListener('click', () => {
        img = null;
        resetCanvasState();
        savedImageSelect.value = '';
        markingSessionSelect.value = '';
        currentTargetId = null;
        statsOutput.innerHTML = '<p>Impact data will appear here once you mark points and set a scale.</p>';
        canvas.width = 800; // Reset to default placeholder size
        canvas.height = 600;
    });

    function resetCanvasState() {
        transform = { scale: 1 };
        scale = { p1: null, p2: null, distance: null, units: 'in', pixelsPerUnit: null };
        groups = [];
        currentGroupIndex = -1;
        settingState = null;
        sessionID = generateUniqueId();
        renderGroupSelector();
        updateActiveButton(null);
        updateStatsDisplay();
        if(img) updateCanvasSize();
    }

    zoomInBtn.addEventListener('click', () => { 
        if(!img) return;
        transform.scale *= 1.2; 
        updateCanvasSize();
    });
    
    zoomOutBtn.addEventListener('click', () => { 
        if(!img) return;
        transform.scale /= 1.2; 
        // Prevent zooming out too much?
        if (transform.scale < 0.1) transform.scale = 0.1;
        updateCanvasSize();
    });

    // Panning listeners removed as browser scroll is used.

    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        // No panning state needed
    });

    canvas.addEventListener('mouseup', (e) => {
        // No panning logic needed
        
        if (!settingState) return;

        const coords = getCanvasCoords(e);

        if (settingState === 'scale_p1') {
            scale.p1 = coords;
            settingState = 'scale_p2';
        } else if (settingState === 'scale_p2') {
            scale.p2 = coords;
            const pixelDist = Math.hypot(scale.p2.x - scale.p1.x, scale.p2.y - scale.p1.y);
            const realDist = parseFloat(document.getElementById('scaleDistance').value);
            if (pixelDist > 0 && realDist > 0) {
                scale.distance = realDist;
                scale.units = document.getElementById('scaleUnits').value;
                scale.pixelsPerUnit = pixelDist / realDist;
            } else {
                scale.p1 = null; scale.p2 = null;
            }
            settingState = null;
            updateActiveButton(null);
            updateStatsDisplay();
        } else if (settingState === 'poa' && currentGroupIndex !== -1) {
            groups[currentGroupIndex].poa = coords;
            settingState = 'poi';
            updateActiveButton(setPoiBtn);
            updateStatsDisplay();
        } else if (settingState === 'poi' && currentGroupIndex !== -1) {
            groups[currentGroupIndex].pois.push({x: coords.x, y: coords.y, velocity: null});
            updateStatsDisplay();
        } else if (settingState === 'delete_poi') {
            const clickRadius = 10 / transform.scale;
            let deleted = false;
            for (const group of groups) {
                const pois = group.pois;
                for (let i = pois.length - 1; i >= 0; i--) {
                    const dist = Math.hypot(coords.x - pois[i].x, coords.y - pois[i].y);
                    if (dist < clickRadius) {
                        pois.splice(i, 1);
                        deleted = true;
                        break;
                    }
                }
                if (deleted) break;
            }
            if (deleted) {
                updateStatsDisplay();
            }
        }
    });

    // canvas.addEventListener('mouseleave', () => { }); // Not needed
    
    canvas.addEventListener('mousemove', (e) => {
        mousePos = { x: e.clientX, y: e.clientY };
        // No panning logic
    });
    
    setScaleBtn.addEventListener('click', () => {
        if (settingState === 'scale_p1' || settingState === 'scale_p2') {
            settingState = null;
            updateActiveButton(null);
            scale.p1 = null;
            return;
        }
        const dist = document.getElementById('scaleDistance').value;
        if (!img || !dist || parseFloat(dist) <= 0) {
            alert('Please load a saved image and enter a valid scale distance first.');
            return;
        }
        settingState = 'scale_p1';
        updateActiveButton(setScaleBtn);
    });

    function renderGroupSelector() {
        groupSelect.innerHTML = '';
        groups.forEach((group, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Group ${index + 1}`;
            groupSelect.appendChild(option);
        });
        groupSelect.value = currentGroupIndex;
    }

    addGroupBtn.addEventListener('click', () => {
        if (!img) { alert('Please load a saved image first.'); return; }
        const colors = ['#36A2EB', '#FFCE56', '#9966FF', '#FF9F40', '#f472b6', '#6b7280'];
        groups.push({ pois: [], poa: null, color: colors[groups.length % colors.length], stats: {} });
        currentGroupIndex = groups.length - 1;
        renderGroupSelector();
        settingState = 'poa'; 
        updateActiveButton(setPoaBtn); 
        updateStatsDisplay();
    });

    deleteGroupBtn.addEventListener('click', () => {
        if (currentGroupIndex === -1) return;
        groups.splice(currentGroupIndex, 1);
        if (currentGroupIndex >= groups.length) {
            currentGroupIndex = groups.length - 1;
        }
        if (groups.length === 0) {
            settingState = null;
            updateActiveButton(null);
        }
        renderGroupSelector();
        updateStatsDisplay();
    });

    groupSelect.addEventListener('change', () => {
        currentGroupIndex = parseInt(groupSelect.value, 10);
        updateStatsDisplay();
    });

    setPoaBtn.addEventListener('click', () => {
        if (settingState === 'poa') {
            settingState = null;
            updateActiveButton(null);
        } else {
            if (currentGroupIndex === -1) { 
                alert('Please add or select a group first.');
                return;
            }
            settingState = 'poa';
            updateActiveButton(setPoaBtn);
        }
    });

    setPoiBtn.addEventListener('click', () => {
        if (settingState === 'poi') {
            settingState = null;
            updateActiveButton(null);
        } else {
            if (currentGroupIndex === -1) { addGroupBtn.click(); }
            settingState = 'poi';
            updateActiveButton(setPoiBtn);
        }
    });

    deleteShotBtn.addEventListener('click', () => {
        if (settingState === 'delete_poi') {
            settingState = null;
            updateActiveButton(null);
        } else {
            settingState = 'delete_poi';
            updateActiveButton(deleteShotBtn);
        }
    });

    deleteLastBtn.addEventListener('click', () => {
        if (currentGroupIndex !== -1 && groups[currentGroupIndex].pois.length > 0) {
            groups[currentGroupIndex].pois.pop();
            updateStatsDisplay();
        }
    });
    
    function calculateGroupStats(pois) {
        if (pois.length < 1) { return {}; }
        const n = pois.length;
        const mpi = { x: pois.reduce((s, p) => s + p.x, 0) / n, y: pois.reduce((s, p) => s + p.y, 0) / n };
        return { mpi, shotCount: n };
    }

    async function handleSaveImpactData() {
        updateStatsDisplay(); 

        if (!scale.pixelsPerUnit) {
            alert("Please set the scale first to save meaningful coordinate data for analysis.");
        }
        
        if (groups.length === 0 || groups.every(g => g.pois.length === 0)) {
            alert("No impacts have been marked. Nothing to save.");
            return;
        }

        // Calculate relative shots for analysis tab
        const shotsForAnalysis = [];
        let shotCounter = 0;
        if(scale.pixelsPerUnit){
            groups.forEach((group, groupIndex) => {
                if (group.pois.length > 0 && group.poa) {
                    group.pois.forEach((poi) => {
                        shotCounter++;
                        const x_coord = (poi.x - group.poa.x) / scale.pixelsPerUnit;
                        const y_coord = (poi.y - group.poa.y) / scale.pixelsPerUnit;
                        shotsForAnalysis.push({
                            shotNumber: shotCounter, group: groupIndex + 1,
                            x: parseFloat(x_coord.toFixed(4)), y: parseFloat(y_coord.toFixed(4)),
                            units: scale.units, velocity: poi.velocity
                        });
                    });
                }
            });
        }
        
        const sessionData = {
            id: sessionID,
            timestamp: new Date().toISOString(),
            targetImageId: currentTargetId,
            firearmId: document.getElementById('firearmSelect').value || null,
            loadId: document.getElementById('loadSelect').value || null,
            targetDistance: parseFloat(document.getElementById('tmTargetDistance').value) || null,
            distanceUnits: document.getElementById('tmDistanceUnits').value,
            groups: groups, // for re-loading in marking tab
            scale: scale,     // for re-loading in marking tab
            shots: shotsForAnalysis // for analysis tab
        };
        
        try {
            await updateItem('impactData', sessionData);
            alert('Session data saved successfully!');
            await populateMarkingSessionSelect();
            document.getElementById('sessionSelect').dispatchEvent(new Event('refresh'));
        } catch (error) {
            console.error("Failed to save impact data:", error);
            alert("An error occurred while saving the session data.");
        }
    }
    saveImpactDataBtn.addEventListener('click', handleSaveImpactData);

    loadMarkingSessionBtn.addEventListener('click', async () => {
        const sessionIdToLoad = markingSessionSelect.value;
        if (!sessionIdToLoad) {
            alert('Please select a session to load.');
            return;
        }
        const data = await getItem('impactData', sessionIdToLoad);
        if (!data) {
            alert('Could not find the selected session data.');
            return;
        }

        removeImageBtn.click(); // Full reset before loading

        // Wait for reset to complete
        await new Promise(resolve => setTimeout(resolve, 50));

        sessionID = data.id;
        scale = data.scale || { p1: null, p2: null, distance: null, units: 'in', pixelsPerUnit: null };
        groups = data.groups || [];
        currentGroupIndex = groups.length > 0 ? 0 : -1;
        
        document.getElementById('firearmSelect').value = data.firearmId;
        document.getElementById('loadSelect').value = data.loadId;
        document.getElementById('tmTargetDistance').value = data.targetDistance;
        document.getElementById('tmDistanceUnits').value = data.distanceUnits;
        document.getElementById('scaleDistance').value = scale.distance;
        document.getElementById('scaleUnits').value = scale.units;

        if (data.targetImageId) {
            savedImageSelect.value = data.targetImageId;
            savedImageSelect.dispatchEvent(new Event('change'));
        }
        
        renderGroupSelector();
        updateStatsDisplay();
    });

    deleteMarkingSessionBtn.addEventListener('click', async () => {
        const sessionIdToDelete = markingSessionSelect.value;
        if (!sessionIdToDelete) {
            alert('Please select a session to delete.');
            return;
        }

        if (confirm(`Are you sure you want to permanently delete session ${sessionIdToDelete.substring(0,8)}?`)) {
            await deleteItem('impactData', sessionIdToDelete);
            
            // If the deleted session is the one currently loaded, clear the canvas
            if (sessionID === sessionIdToDelete) {
                removeImageBtn.click();
            }

            await populateMarkingSessionSelect();
            document.getElementById('sessionSelect').dispatchEvent(new Event('refresh'));
            alert('Session deleted.');
        }
    });

    statsOutput.addEventListener('input', (e) => {
        if (e.target.classList.contains('velocity-input-tm')) {
            const groupIndex = parseInt(e.target.dataset.groupIndex, 10);
            const poiIndex = parseInt(e.target.dataset.poiIndex, 10);
            const value = e.target.value === '' ? null : parseFloat(e.target.value);
            
            if (groups[groupIndex] && groups[groupIndex].pois[poiIndex]) {
                groups[groupIndex].pois[poiIndex].velocity = value;
            }
        }
    });

    function updateStatsDisplay() {
        groups.forEach(group => {
            group.stats = calculateGroupStats(group.pois);
        });
        
        let hasImpacts = groups.some(group => group.pois.length > 0);
        
        let html = '';

        if (hasImpacts) {
             let impactListHtml = '<ul class="impact-data-list">';
             let shotCounter = 0;
             groups.forEach((group, groupIndex) => {
                if (group.pois.length > 0) {
                    const referencePoint = group.poa;
                    group.pois.forEach((poi, poiIndex) => {
                        shotCounter++;
                        let coordText = '<i>(Set POA & Scale for coords)</i>';
                        if (referencePoint && scale.pixelsPerUnit) {
                            const x_coord = (poi.x - referencePoint.x) / scale.pixelsPerUnit;
                            const y_coord = (poi.y - referencePoint.y) / scale.pixelsPerUnit;
                            coordText = `X: ${x_coord.toFixed(3)}, Y: ${y_coord.toFixed(3)}`;
                        }
                        impactListHtml += `
                            <li>
                                <span>
                                    <b>Shot ${shotCounter} (G${groupIndex+1}):</b> 
                                    ${coordText}
                                </span>
                                <input type="number" class="velocity-input-tm" 
                                       data-group-index="${groupIndex}" 
                                       data-poi-index="${poiIndex}" 
                                       value="${poi.velocity !== null ? poi.velocity : ''}" 
                                       placeholder="fps/mps">
                            </li>
                        `;
                    });
                }
             });
             impactListHtml += '</ul>';
             html += impactListHtml;
        }

        if (html === '') {
            statsOutput.innerHTML = '<p>Impact data will appear here once you mark points and set a scale.</p>';
        } else {
            statsOutput.innerHTML = html;
        }
    }

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    function animationLoop() { 
        draw(); 
        animationFrameId = requestAnimationFrame(animationLoop); 
    }
    animationLoop();
}
