// js/db-management/index.js
import { renderSelectedTable, updateUnifiedButtonLabels, populateAIExportSessionSelect } from './ui.js';
import { handleUnifiedExport, handleUnifiedDelete, handleUnifiedRestore, handleSyncMaster } from './operations.js';
import { handleSessionExport } from './export.js';

export function initDbManagement() {
    const tableSelect = document.getElementById('tableSelect');
    
    // Default option is entire database
    const defaultOption = document.createElement('option');
    defaultOption.value = 'all';
    defaultOption.textContent = '-- Entire Database --';
    tableSelect.appendChild(defaultOption);

    // populateAIExportSessionSelect doesn't load the object stores correctly from here because it's asynchronous
    // Wait, let me just initialize the stores dropdown directly.
    import('../db.js').then(({ getObjectStores }) => {
        const stores = getObjectStores();
        stores.forEach(store => {
            const option = document.createElement('option');
            option.value = store;
            option.textContent = store.charAt(0).toUpperCase() + store.slice(1);
            tableSelect.appendChild(option);
        });
    });

    document.getElementById('syncWebMasterBtn').addEventListener('click', () => handleSyncMaster('https://raw.githubusercontent.com/loathengine/loathengine.github.io/main/master-db.json'));
    
    document.getElementById('unifiedMergeBtn').addEventListener('click', () => handleUnifiedRestore(false));
    document.getElementById('unifiedOverwriteBtn').addEventListener('click', () => handleUnifiedRestore(true));
    document.getElementById('unifiedExportBtn').addEventListener('click', handleUnifiedExport);
    
    document.getElementById('unifiedDeleteBtn').addEventListener('click', handleUnifiedDelete);

    tableSelect.addEventListener('change', () => {
        renderSelectedTable();
        updateUnifiedButtonLabels();
    });
    
    updateUnifiedButtonLabels();
    
    populateAIExportSessionSelect();
    
    document.getElementById('aiExportBtn').addEventListener('click', handleSessionExport);
}

export { renderSelectedTable };
