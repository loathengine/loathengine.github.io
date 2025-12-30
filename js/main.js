// js/main.js
import { openDB } from './db.js';
import { initMiscManagement, refreshMiscUI } from './misc.js';
import { initComponentsManagement, refreshComponentUI } from './components.js';
import { initFirearmsManagement, refreshFirearmsUI } from './firearms.js';
import { initLoadsManagement, refreshLoadsUI } from './loads.js';
import { initTargetsManagement, renderTargetImages } from './targets.js';
import { initImpactMarking, refreshImpactMarkingUI } from './marking.js';
import { initStatisticalAnalysis } from './analysis.js';
import { initDbManagement, renderSelectedTable } from './db-management.js';

async function loadTabContent() {
    const tabContainer = document.getElementById('tab-content-container');
    const tabs = [
        'about-us', 'firearms', 'loads', 'targets', 'marking', 'analysis', 'components', 'misc', 'db-management'
    ];

    for (const tab of tabs) {
        try {
            const response = await fetch(`tabs/${tab}.html`);
            if (!response.ok) throw new Error(`Failed to load tabs/${tab}.html`);
            const html = await response.text();
            
            const div = document.createElement('div');
            div.id = tab;
            div.className = 'tab-content';
            if (tab === 'about-us') div.classList.add('active'); // Default active tab
            div.innerHTML = html;
            tabContainer.appendChild(div);
        } catch (error) {
            console.error(error);
        }
    }
}

async function refreshAllUI() {
    console.log("Refreshing all application UI components...");
    // Misc & Components are linked, start with base data
    await refreshMiscUI();
    await refreshComponentUI();
    
    // Dependent UI
    await refreshFirearmsUI();
    await refreshLoadsUI();
    await renderTargetImages();
    await refreshImpactMarkingUI();
    
    // Analysis Tab dropdowns
    const sessionSelect = document.getElementById('sessionSelect');
    if (sessionSelect) {
        sessionSelect.dispatchEvent(new Event('refresh'));
    }
    
    // DB Management Tab (if a table is displayed)
    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect && tableSelect.value) {
        await renderSelectedTable();
    }
    console.log("UI Refresh complete.");
}

// Export for other modules if needed (though event is preferred)
export { refreshAllUI };

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load HTML Content
    await loadTabContent();

    // 2. Initialize Database
    await openDB();

    // 3. Setup Main Tab Navigation
    const mainTabContainer = document.querySelector('.tabs-nav');
    const mainTabContents = document.querySelectorAll('#tab-content-container > .tab-content');
    
    mainTabContainer.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('tab-link')) {
            e.preventDefault();
            const tabId = e.target.getAttribute('data-tab');
            mainTabContainer.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            
            mainTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) { 
                    content.classList.add('active'); 
                    if(tabId === 'analysis') {
                        const sessionSelect = document.getElementById('sessionSelect');
                        if (sessionSelect) sessionSelect.dispatchEvent(new Event('refresh'));
                    }
                }
            });
        }
    });

    // 4. Initialize Modules
    initMiscManagement();
    initComponentsManagement();
    initFirearmsManagement();
    initLoadsManagement();
    initTargetsManagement();
    initImpactMarking();
    initStatisticalAnalysis();
    initDbManagement();

    // 5. Setup Global Event Listeners
    window.addEventListener('app-refresh', refreshAllUI);
});
