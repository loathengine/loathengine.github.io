import { state, resetState, setImg, setCanvas } from './state.js';
import { draw, updateCanvasSize, getCanvasCoords } from './canvas.js';
import { updateActiveButton, updateStatsDisplay, renderGroupSelector, populateMarkingSessionSelect } from './ui.js';
import { getItem, updateItem, deleteItem, generateUniqueId } from '../db.js';

export function setupEventListeners() {
    const canvas = document.getElementById('targetCanvas');
    if (!canvas) return;

    setCanvas(canvas);

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
    const saveImpactDataBtn = document.getElementById('saveImpactDataBtn');

    savedImageSelect.addEventListener('change', async (e) => {
        const targetId = e.target.value;
        setImg(null); 
        
        if (!targetId) {
            state.currentTargetId = null;
            resetState();
            renderGroupSelector();
            updateActiveButton(null);
            updateStatsDisplay();
            if(state.img) updateCanvasSize(); 
            return;
        }
        
        const targetData = await getItem('targetImages', targetId);
        if (targetData) {
            const newImg = new Image();
            newImg.onload = () => { 
                state.currentTargetId = targetId;
                
                const workingBaseWidth = 800;
                const aspectRatio = newImg.naturalHeight / newImg.naturalWidth;
                
                newImg.baseWidth = workingBaseWidth;
                newImg.baseHeight = workingBaseWidth * aspectRatio;
                
                state.transform.scale = 1; 
                
                setImg(newImg);
                updateCanvasSize();

                if (!state.sessionID) { resetState(); } 
            };
            newImg.src = targetData.dataUrl;
        }
    });

    removeImageBtn.addEventListener('click', () => {
        setImg(null);
        resetState();
        renderGroupSelector();
        updateActiveButton(null);
        updateStatsDisplay();
        
        savedImageSelect.value = '';
        markingSessionSelect.value = '';
        state.currentTargetId = null;
        statsOutput.innerHTML = '<p>Impact data will appear here once you mark points and set a scale.</p>';
        canvas.width = 800; 
        canvas.height = 600;
    });

    zoomInBtn.addEventListener('click', () => { 
        if(!state.img) return;
        state.transform.scale *= 1.2; 
        updateCanvasSize();
    });
    
    zoomOutBtn.addEventListener('click', () => { 
        if(!state.img) return;
        state.transform.scale /= 1.2; 
        if (state.transform.scale < 0.1) state.transform.scale = 0.1;
        updateCanvasSize();
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!state.settingState) return;

        const coords = getCanvasCoords(e);

        if (state.settingState === 'scale_p1') {
            state.scale.p1 = coords;
            state.settingState = 'scale_p2';
        } else if (state.settingState === 'scale_p2') {
            state.scale.p2 = coords;
            const pixelDist = Math.hypot(state.scale.p2.x - state.scale.p1.x, state.scale.p2.y - state.scale.p1.y);
            const realDist = parseFloat(document.getElementById('scaleDistance').value);
            if (pixelDist > 0 && realDist > 0) {
                state.scale.distance = realDist;
                state.scale.units = document.getElementById('scaleUnits').value;
                state.scale.pixelsPerUnit = pixelDist / realDist;
            } else {
                state.scale.p1 = null; state.scale.p2 = null;
            }
            state.settingState = null;
            updateActiveButton(null);
            updateStatsDisplay();
        } else if (state.settingState === 'poa' && state.currentGroupIndex !== -1) {
            state.groups[state.currentGroupIndex].poa = coords;
            state.settingState = 'poi';
            updateActiveButton(setPoiBtn);
            updateStatsDisplay();
        } else if (state.settingState === 'poi' && state.currentGroupIndex !== -1) {
            state.groups[state.currentGroupIndex].pois.push({x: coords.x, y: coords.y, velocity: null});
            updateStatsDisplay();
        } else if (state.settingState === 'delete_poi') {
            const clickRadius = 10 / state.transform.scale;
            let deleted = false;
            for (const group of state.groups) {
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

    canvas.addEventListener('mousemove', (e) => {
        state.mousePos = { x: e.clientX, y: e.clientY };
    });

    setScaleBtn.addEventListener('click', () => {
        if (state.settingState === 'scale_p1' || state.settingState === 'scale_p2') {
            state.settingState = null;
            updateActiveButton(null);
            state.scale.p1 = null;
            return;
        }
        const dist = document.getElementById('scaleDistance').value;
        if (!state.img || !dist || parseFloat(dist) <= 0) {
            alert('Please load a saved image and enter a valid scale distance first.');
            return;
        }
        state.settingState = 'scale_p1';
        updateActiveButton(setScaleBtn);
    });

    addGroupBtn.addEventListener('click', () => {
        if (!state.img) { alert('Please load a saved image first.'); return; }
        const colors = ['#36A2EB', '#FFCE56', '#9966FF', '#FF9F40', '#f472b6', '#6b7280'];
        state.groups.push({ pois: [], poa: null, color: colors[state.groups.length % colors.length], stats: {} });
        state.currentGroupIndex = state.groups.length - 1;
        renderGroupSelector();
        state.settingState = 'poa'; 
        updateActiveButton(setPoaBtn); 
        updateStatsDisplay();
    });

    deleteGroupBtn.addEventListener('click', () => {
        if (state.currentGroupIndex === -1) return;
        state.groups.splice(state.currentGroupIndex, 1);
        if (state.currentGroupIndex >= state.groups.length) {
            state.currentGroupIndex = state.groups.length - 1;
        }
        if (state.groups.length === 0) {
            state.settingState = null;
            updateActiveButton(null);
        }
        renderGroupSelector();
        updateStatsDisplay();
    });

    groupSelect.addEventListener('change', () => {
        state.currentGroupIndex = parseInt(groupSelect.value, 10);
        updateStatsDisplay();
    });

    setPoaBtn.addEventListener('click', () => {
        if (state.settingState === 'poa') {
            state.settingState = null;
            updateActiveButton(null);
        } else {
            if (state.currentGroupIndex === -1) { 
                alert('Please add or select a group first.');
                return;
            }
            state.settingState = 'poa';
            updateActiveButton(setPoaBtn);
        }
    });

    setPoiBtn.addEventListener('click', () => {
        if (state.settingState === 'poi') {
            state.settingState = null;
            updateActiveButton(null);
        } else {
            if (state.currentGroupIndex === -1) { addGroupBtn.click(); }
            state.settingState = 'poi';
            updateActiveButton(setPoiBtn);
        }
    });

    deleteShotBtn.addEventListener('click', () => {
        if (state.settingState === 'delete_poi') {
            state.settingState = null;
            updateActiveButton(null);
        } else {
            state.settingState = 'delete_poi';
            updateActiveButton(deleteShotBtn);
        }
    });

    deleteLastBtn.addEventListener('click', () => {
        if (state.currentGroupIndex !== -1 && state.groups[state.currentGroupIndex].pois.length > 0) {
            state.groups[state.currentGroupIndex].pois.pop();
            updateStatsDisplay();
        }
    });

    saveImpactDataBtn.addEventListener('click', async () => {
        updateStatsDisplay(); 

        if (!state.scale.pixelsPerUnit) {
            alert("Please set the scale first to save meaningful coordinate data for analysis.");
        }
        
        if (state.groups.length === 0 || state.groups.every(g => g.pois.length === 0)) {
            alert("No impacts have been marked. Nothing to save.");
            return;
        }

        const shotsForAnalysis = [];
        let shotCounter = 0;
        if(state.scale.pixelsPerUnit){
            state.groups.forEach((group, groupIndex) => {
                if (group.pois.length > 0 && group.poa) {
                    group.pois.forEach((poi) => {
                        shotCounter++;
                        const x_coord = (poi.x - group.poa.x) / state.scale.pixelsPerUnit;
                        const y_coord = (poi.y - group.poa.y) / state.scale.pixelsPerUnit;
                        shotsForAnalysis.push({
                            shotNumber: shotCounter, group: groupIndex + 1,
                            x: parseFloat(x_coord.toFixed(4)), y: parseFloat(y_coord.toFixed(4)),
                            units: state.scale.units, velocity: poi.velocity
                        });
                    });
                }
            });
        }
        
        const sessionData = {
            id: state.sessionID,
            timestamp: new Date().toISOString(),
            targetImageId: state.currentTargetId,
            firearmId: document.getElementById('firearmSelect').value || null,
            loadId: document.getElementById('loadSelect').value || null,
            targetDistance: parseFloat(document.getElementById('tmTargetDistance').value) || null,
            distanceUnits: document.getElementById('tmDistanceUnits').value,
            groups: state.groups, 
            scale: state.scale,     
            shots: shotsForAnalysis 
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
    });

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

        removeImageBtn.click(); 
        await new Promise(resolve => setTimeout(resolve, 50));

        state.sessionID = data.id;
        state.scale = data.scale || { p1: null, p2: null, distance: null, units: 'in', pixelsPerUnit: null };
        state.groups = data.groups || [];
        state.currentGroupIndex = state.groups.length > 0 ? 0 : -1;
        
        document.getElementById('firearmSelect').value = data.firearmId;
        document.getElementById('loadSelect').value = data.loadId;
        document.getElementById('tmTargetDistance').value = data.targetDistance;
        document.getElementById('tmDistanceUnits').value = data.distanceUnits;
        document.getElementById('scaleDistance').value = state.scale.distance;
        document.getElementById('scaleUnits').value = state.scale.units;

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
            
            if (state.sessionID === sessionIdToDelete) {
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
            
            if (state.groups[groupIndex] && state.groups[groupIndex].pois[poiIndex]) {
                state.groups[groupIndex].pois[poiIndex].velocity = value;
            }
        }
    });

    // Start animation loop
    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    function animationLoop() { 
        draw(); 
        state.animationFrameId = requestAnimationFrame(animationLoop); 
    }
    animationLoop();
}
