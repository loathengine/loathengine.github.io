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
         let impactText = '';
         state.groups.forEach((group, groupIndex) => {
            if (group.pois.length > 0) {
                const referencePoint = group.poa;
                group.pois.forEach((poi, poiIndex) => {
                    let coordText = 'N/A,N/A';
                    if (referencePoint && state.scale.pixelsPerUnit) {
                        const x_coord = (poi.x - referencePoint.x) / state.scale.pixelsPerUnit;
                        const y_coord = (poi.y - referencePoint.y) / state.scale.pixelsPerUnit;
                        // Invert Y coordinate so up is positive
                        coordText = `${x_coord.toFixed(3)},${(-y_coord).toFixed(3)}`;
                    }
                    const velocity = poi.velocity !== null ? poi.velocity : '';
                    impactText += `${coordText},${velocity}\n`;
                });
            }
         });
         html += `<textarea readonly rows="10" style="width: 100%; resize: vertical; font-family: monospace;">${impactText.trim()}</textarea>`;
    }

    if (html === '') {
        statsOutput.innerHTML = '<p>Impact data will appear here once you mark points and set a scale.</p>';
    } else {
        statsOutput.innerHTML = html;
    }
}

export function renderSessionTargets() {
    const container = document.getElementById('sessionTargetsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (state.targets.length === 0) {
        container.innerHTML = '<p style="font-size: 0.75rem; color: #9ca3af; text-align: center;">No targets in session.</p>';
        return;
    }
    
    state.targets.forEach((target, index) => {
        const isActive = index === state.activeTargetIndex;
        
        const div = document.createElement('div');
        div.className = `session-target-item ${isActive ? 'active' : ''}`;
        div.dataset.index = index;
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';
        div.style.padding = '0.4rem';
        div.style.backgroundColor = isActive ? '#4b5563' : '#1f2937';
        div.style.border = isActive ? '1px solid #60a5fa' : '1px solid #374151';
        div.style.borderRadius = '0.3rem';
        div.style.cursor = 'pointer';
        
        let targetName = `Target ${index + 1}`;
        const selectEl = document.getElementById('savedImageSelect');
        if (selectEl) {
            const option = Array.from(selectEl.options).find(o => o.value === target.targetImageId);
            if (option) targetName = option.textContent;
        }
        
        div.innerHTML = `
            <span style="font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: ${isActive ? 'bold' : 'normal'};" title="${targetName}">${targetName}</span>
            <button data-action="remove" data-index="${index}" class="btn-red" style="padding: 0.1rem 0.4rem; font-size: 0.7rem; margin: 0; min-width: auto; width: auto; line-height: 1;">X</button>
        `;
        
        container.appendChild(div);
    });
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

    // Initial load population (will be filtered if a firearm is already selected)
    await updateLoadSelectBasedOnFirearm();
    
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

export async function updateLoadSelectBasedOnFirearm() {
    const firearmSelect = document.getElementById('firearmSelect');
    const selectedFirearmId = firearmSelect.value;
    const loadSelect = document.getElementById('loadSelect');
    
    if (!loadSelect) return;
    
    let loads = await getAllItems('loads');
    
    // Filter by cartridge if firearm is selected
    if (selectedFirearmId) {
        const firearm = await getItem('firearms', selectedFirearmId);
        if (firearm && firearm.cartridgeId) {
            loads = loads.filter(l => l.cartridgeId === firearm.cartridgeId);
        }
    }

    const currentLoadVal = loadSelect.value;
    loadSelect.innerHTML = '<option value="">-- Associate Load (Optional) --</option>';
    
    if (loads.length === 0 && selectedFirearmId) {
         const option = document.createElement('option');
         option.disabled = true;
         option.textContent = "-- No compatible loads found --";
         loadSelect.appendChild(option);
    }

    for (const load of loads) {
        const option = document.createElement('option');
        option.value = load.id;
        
        if (load.loadType === 'commercial') {
            const mfg = await getItem('manufacturers', load.manufacturerId);
            
            // Fetch bullet info if available
            let bulletInfo = '';
            if (load.bulletId) {
                const bullet = await getItem('bullets', load.bulletId);
                bulletInfo = bullet ? `${bullet.weight}gr ${bullet.name}` : '';
            } else if (load.bulletWeight) {
                 bulletInfo = `${load.bulletWeight}gr`;
            }

            option.textContent = `${mfg ? mfg.name : ''} ${load.name} ${bulletInfo}`.trim();
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
    // Restore selection if still valid, otherwise reset
    if ([...loadSelect.options].some(o => o.value === currentLoadVal)) {
        loadSelect.value = currentLoadVal;
    } else {
        loadSelect.value = "";
    }
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
