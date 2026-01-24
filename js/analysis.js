// js/analysis.js
import { getAllItems, getItem } from './db.js';
import { createSessionName } from './utils.js';
import { calculateStatsForSession } from './analysis/stats.js';
import { renderComparisonTable, renderAnalysisPlot } from './analysis/ui.js';
import { handleAnalysisExport } from './analysis/export.js';

let lastAnalysisResults = [];

export function initStatisticalAnalysis() {
    const sessionSelect = document.getElementById('sessionSelect');
    const firearmFilterSelect = document.getElementById('firearmFilterSelect');
    const compareBtn = document.getElementById('compareSessionsBtn');
    const exportBtn = document.getElementById('exportAnalysisBtn');
    const statOutputContainer = document.getElementById('statAnalysisOutput');
    const plotContainer = document.getElementById('analysisPlotContainer');

    async function populateFirearmFilter() {
        firearmFilterSelect.innerHTML = '<option value="">-- All Firearms --</option>';
        const firearms = await getAllItems('firearms');
        firearms.sort((a,b) => a.nickname.localeCompare(b.nickname));
        firearms.forEach(firearm => {
            const option = document.createElement('option');
            option.value = firearm.id;
            option.textContent = firearm.nickname;
            firearmFilterSelect.appendChild(option);
        });
    }

    async function populateSessionSelect(firearmId = null) {
        let sessions = await getAllItems('impactData');
        
        if (firearmId) {
            sessions = sessions.filter(session => session.firearmId === firearmId);
        }

        sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        sessionSelect.innerHTML = ``;

        for(const session of sessions) {
            if (!session.shots || session.shots.length < 2) continue;

            const option = document.createElement('option');
            option.value = session.id;
            option.textContent = await createSessionName(session);
            sessionSelect.appendChild(option);
        }
    }
    
    sessionSelect.addEventListener('refresh', async () => {
        await populateFirearmFilter();
        await populateSessionSelect(firearmFilterSelect.value);
    });
    
    firearmFilterSelect.addEventListener('change', (e) => {
        populateSessionSelect(e.target.value);
    });
    
    compareBtn.addEventListener('click', handleSessionComparison);
    exportBtn.addEventListener('click', () => handleAnalysisExport(lastAnalysisResults));


    async function handleSessionComparison() {
        const selectedIds = Array.from(sessionSelect.selectedOptions).map(option => option.value);

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
                        shots: sessionData.shots 
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

    sessionSelect.dispatchEvent(new Event('refresh'));
}
