import { state } from './state.js';
import { getAllItems, getItem } from '../db.js';
import { populateSelect, createSessionName } from '../utils.js';

export function updateActiveButton(activeButton) {
    const toggleButtons = [
        document.getElementById('setScale'), 
        document.getElementById('setPoa'), 
        document.getElementById('setPoi'), 
        document.getElementById('deleteShot')
    ];
    toggleButtons.forEach(btn => btn && btn.classList.remove('active'));
    if (activeButton) {
        activeButton.classList.add('active');
    }
    if(state.canvas) state.canvas.classList.toggle('delete-mode', state.settingState === 'delete_poi');
}

export function calculateGroupStats(pois) {
    if (pois.length < 1) { return {}; }
    const n = pois.length;
    const mpi = { x: pois.reduce((s, p) => s + p.x, 0) / n, y: pois.reduce((s, p) => s + p.y, 0) / n };
    return { mpi, shotCount: n };
}

export function updateStatsDisplay() {
    state.groups.forEach(group => {
        group.stats = calculateGroupStats(group.pois);
    });
    
    let hasImpacts = state.groups.some(group => group.pois.length > 0);
    
    let html = '';
    const statsOutput = document.getElementById('stats-output');
    
    if (hasImpacts) {
         let impactListHtml = '<ul class="impact-data-list">';
         let shotCounter = 0;
         state.groups.forEach((group, groupIndex) => {
            if (group.pois.length > 0) {
                const referencePoint = group.poa;
                group.pois.forEach((poi, poiIndex) => {
                    shotCounter++;
                    let coordText = '<i>(Set POA & Scale for coords)</i>';
                    if (referencePoint && state.scale.pixelsPerUnit) {
                        const x_coord = (poi.x - referencePoint.x) / state.scale.pixelsPerUnit;
                        const y_coord = (poi.y - referencePoint.y) / state.scale.pixelsPerUnit;
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

export function renderGroupSelector() {
    const groupSelect = document.getElementById('groupSelect');
    groupSelect.innerHTML = '';
    state.groups.forEach((group, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Group ${index + 1}`;
        groupSelect.appendChild(option);
    });
    groupSelect.value = state.currentGroupIndex;
}

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

export async function populateMarkingSessionSelect() {
    const markingSessionSelect = document.getElementById('markingSessionSelect');
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
