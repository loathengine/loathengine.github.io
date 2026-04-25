// js/analysis.js
import { getAllItems, getItem } from './db.js';
import { createSessionName } from './utils.js';
import { calculateStatsForSession } from './analysis/stats.js';
import { renderComparisonTable, renderAnalysisPlot } from './analysis/ui.js';
import { handleAnalysisExport } from './analysis/export.js';

let lastAnalysisResults = [];

export function initStatisticalAnalysis() {
    const sessionCheckboxContainer = document.getElementById('sessionCheckboxContainer');
    const loadFilterSelect = document.getElementById('loadFilterSelect');
    const selectAllBtn = document.getElementById('selectAllSessionsBtn');
    const deselectAllBtn = document.getElementById('deselectAllSessionsBtn');
    const firearmFilterSelect = document.getElementById('firearmFilterSelect');
    const compareBtn = document.getElementById('compareSessionsBtn');
    const exportBtn = document.getElementById('exportAnalysisBtn');
    const statOutputContainer = document.getElementById('statAnalysisOutput');
    const plotContainer = document.getElementById('analysisPlotContainer');

    async function populateFirearmFilter() {
        firearmFilterSelect.innerHTML = '<option value="">-- All Firearms --</option>';
        const firearms = await getAllItems('firearms');
        firearms.sort((a,b) => (a.nickname || '').localeCompare(b.nickname || ''));
        firearms.forEach(firearm => {
            const option = document.createElement('option');
            option.value = firearm.id;
            option.textContent = firearm.nickname;
            firearmFilterSelect.appendChild(option);
        });
    }

    async function populateLoadFilter(firearmId = null) {
        loadFilterSelect.innerHTML = '<option value="">-- All Loads --</option>';
        let loads = await getAllItems('loads');
        
        if (firearmId) {
            const firearm = await getItem('firearms', firearmId);
            if (firearm && firearm.cartridgeId) {
                loads = loads.filter(l => l.cartridgeId === firearm.cartridgeId);
            }
        }
        
        for (const load of loads) {
            const option = document.createElement('option');
            option.value = load.id;
            
            if (load.loadTypeId === 'LT_COMM') {
                const mfg = await getItem('manufacturers', load.manufacturerId);
                let bulletInfo = '';
                if (load.bulletId) {
                    const bullet = await getItem('bullets', load.bulletId);
                    bulletInfo = bullet ? `${bullet.weight}gr` : '';
                } else if (load.bulletWeight) {
                     bulletInfo = `${load.bulletWeight}gr`;
                }
                option.textContent = `${mfg ? mfg.name : ''} ${load.name} ${bulletInfo}`.trim();
            } else {
                const bullet = await getItem('bullets', load.bulletId);
                const powder = await getItem('powders', load.powderId);
                
                let bulletMfgStr = 'Unknown Mfg';
                let bulletNameStr = 'Unknown Bullet';
                let bulletWeightStr = '?gr';
                if (bullet) {
                    const bMfg = await getItem('manufacturers', bullet.manufacturerId);
                    bulletMfgStr = bMfg ? bMfg.name : 'Unknown Mfg';
                    bulletNameStr = bullet.name || 'Unknown Bullet';
                    bulletWeightStr = `${bullet.weight}gr`;
                }

                const powderName = powder ? powder.name : 'Unknown Powder';
                
                let chargeVal = '?';
                if (Array.isArray(load.chargeWeight)) {
                    chargeVal = load.chargeWeight.join(', ');
                } else if (load.chargeWeight !== undefined) {
                     chargeVal = load.chargeWeight;
                }
                
                const namePart = load.name ? `${load.name} - ` : '';
                option.textContent = `${namePart}${bulletMfgStr} - ${bulletNameStr} ${bulletWeightStr} - ${powderName} - ${chargeVal}gr`;
            }
            loadFilterSelect.appendChild(option);
        }
    }

    async function populateSessionSelect(firearmId = null, loadId = null) {
        let sessions = await getAllItems('impactData');
        
        if (firearmId) {
            sessions = sessions.filter(session => session.firearmId === firearmId);
        }
        if (loadId) {
            sessions = sessions.filter(session => session.loadId === loadId);
        }

        sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        sessionCheckboxContainer.innerHTML = '';

        if (sessions.length === 0) {
            sessionCheckboxContainer.innerHTML = '<div style="color: #9ca3af; padding: 0.5rem;">No sessions found matching filters.</div>';
            return;
        }

        for(const session of sessions) {
            if (!session.shots || session.shots.length < 2) continue;

            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '0.5rem';
            label.style.cursor = 'pointer';
            label.style.padding = '0.25rem 0.5rem';
            label.style.borderRadius = '0.25rem';
            label.style.transition = 'background-color 0.2s';

            label.onmouseenter = () => label.style.backgroundColor = '#374151';
            label.onmouseleave = () => label.style.backgroundColor = 'transparent';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = session.id;
            checkbox.className = 'session-checkbox';

            const textNode = document.createTextNode(await createSessionName(session));

            label.appendChild(checkbox);
            label.appendChild(textNode);
            sessionCheckboxContainer.appendChild(label);
        }
    }
    
    sessionCheckboxContainer.addEventListener('refresh', async () => {
        await populateFirearmFilter();
        await populateLoadFilter(firearmFilterSelect.value);
        await populateSessionSelect(firearmFilterSelect.value, loadFilterSelect.value);
    });
    
    firearmFilterSelect.addEventListener('change', async (e) => {
        await populateLoadFilter(e.target.value);
        await populateSessionSelect(e.target.value, loadFilterSelect.value);
    });
    
    loadFilterSelect.addEventListener('change', async (e) => {
        await populateSessionSelect(firearmFilterSelect.value, e.target.value);
    });

    selectAllBtn.addEventListener('click', () => {
        const checkboxes = sessionCheckboxContainer.querySelectorAll('.session-checkbox');
        checkboxes.forEach(cb => cb.checked = true);
    });

    deselectAllBtn.addEventListener('click', () => {
        const checkboxes = sessionCheckboxContainer.querySelectorAll('.session-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
    });
    
    compareBtn.addEventListener('click', handleSessionComparison);
    exportBtn.addEventListener('click', () => handleAnalysisExport(lastAnalysisResults));


    async function handleSessionComparison() {
        const checkboxes = sessionCheckboxContainer.querySelectorAll('.session-checkbox:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);

        if (selectedIds.length < 1) {
            alert("Please select at least one session to analyze.");
            return;
        }

        const results = [];
        for (const id of selectedIds) {
            const sessionData = await getItem('impactData', id);
            if (sessionData && sessionData.shots && sessionData.shots.length > 0) {
                const stats = calculateStatsForSession(
                    sessionData.shots, 
                    sessionData.targetDistance, 
                    sessionData.distanceUnits
                );
                
                if (stats) {
                    const sessionName = await createSessionName(sessionData);
                    results.push({
                        sessionId: id,
                        sessionName: sessionName,
                        stats: stats,
                        shots: stats.normalizedShots || sessionData.shots 
                    });
                }
            }
        }
        
        // Sort by MR (Linear for sorting is fine, but we display angular)
        results.sort((a, b) => a.stats.raw.meanRadius - b.stats.raw.meanRadius);
        
        renderComparisonTable(results, statOutputContainer);
        
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

    sessionCheckboxContainer.dispatchEvent(new Event('refresh'));
}
