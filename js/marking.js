import { refreshImpactMarkingUI as refreshUI, populateMarkingSessionSelect } from './marking/ui.js';
import { setupEventListeners } from './marking/events.js';
import { resetState } from './marking/state.js';
import { renderGroupSelector, updateActiveButton, updateStatsDisplay } from './marking/ui.js';

export async function refreshImpactMarkingUI() {
    await refreshUI();
}

export function initImpactMarking() {
    refreshUI().then(populateMarkingSessionSelect);
    
    // Initial State Reset
    resetState();
    
    setupEventListeners();
    
    // Perform initial UI update after setup
    renderGroupSelector();
    updateActiveButton(null);
    updateStatsDisplay();
}
