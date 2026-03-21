// js/db-management.js
import { getAllItems, getObjectStores, deleteDatabase, openDB, deleteItem } from './db.js';
import { triggerDownload } from './utils.js';

export function initDbManagement() {
    const tableSelect = document.getElementById('tableSelect');
    
    // Default option is entire database
    const defaultOption = document.createElement('option');
    defaultOption.value = 'all';
    defaultOption.textContent = '-- Entire Database --';
    tableSelect.appendChild(defaultOption);

    const stores = getObjectStores();
    stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store;
        option.textContent = store.charAt(0).toUpperCase() + store.slice(1);
        tableSelect.appendChild(option);
    });

    // Unified Actions
    document.getElementById('unifiedExportBtn').addEventListener('click', handleUnifiedExport);
    document.getElementById('unifiedImportBtn').addEventListener('click', handleUnifiedImport);
    document.getElementById('unifiedMergeBtn').addEventListener('click', handleUnifiedMerge);
    document.getElementById('unifiedDeleteBtn').addEventListener('click', handleUnifiedDelete);
    document.getElementById('importMasterDbBtn').addEventListener('click', importMasterDatabase);

    tableSelect.addEventListener('change', renderSelectedTable);
}

// Helper to log to the result area
function logMergeResult(message, isError = false) {
    const logDiv = document.getElementById('mergeResultLog');
    logDiv.style.display = 'block';
    const color = isError ? '#ef4444' : '#10b981';
    const timestamp = new Date().toLocaleTimeString();
    logDiv.innerHTML += `<div style="color: ${color}; margin-bottom: 0.25rem;">[${timestamp}] ${message}</div>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

function clearMergeLog() {
    const logDiv = document.getElementById('mergeResultLog');
    logDiv.innerHTML = '';
    logDiv.style.display = 'none';
}

async function handleUnifiedExport() {
    const scope = document.getElementById('tableSelect').value;
    if (scope === 'all') {
        const allData = {};
        const stores = getObjectStores();
        for (const storeName of stores) { 
            allData[storeName] = await getAllItems(storeName); 
        }
        const dateString = new Date().toISOString().slice(0, 10);
        const jsonString = '{\n' +
            Object.keys(allData).map(storeName => {
                const items = allData[storeName].map(item => '    ' + JSON.stringify(item));
                return `  "${storeName}": [\n${items.join(',\n')}\n  ]`;
            }).join(',\n') +
        '\n}';
        triggerDownload(jsonString, `master-db-backup-${dateString}.json`);
    } else {
        if (!scope) {
            alert('Please select a target scope to export.');
            return;
        }
        const data = await getAllItems(scope);
        const jsonString = '[\n' +
            data.map(item => '  ' + JSON.stringify(item)).join(',\n') +
        '\n]';
        triggerDownload(jsonString, `${scope}-backup.json`);
    }
}

async function handleUnifiedDelete() {
    const scope = document.getElementById('tableSelect').value;
    if (scope === 'all') {
        if (confirm('Are you sure you want to permanently delete the entire database? This action cannot be undone.')) {
            try {
                await deleteDatabase();
                alert('Database deleted successfully. The page will now reload.');
                location.reload();
            } catch (err) {
                console.error('Error deleting database:', err);
                alert('Could not delete the database.');
            }
        }
    } else {
        if (!scope) {
            alert('Please select a target scope to delete.');
            return;
        }
        if (confirm(`Are you sure you want to delete all data from the '${scope}' table?`)) {
            try {
                const db = await openDB();
                const transaction = db.transaction([scope], 'readwrite');
                const store = transaction.objectStore(scope);
                store.clear();
                transaction.oncomplete = async () => { 
                    alert(`Table '${scope}' has been cleared.`); 
                    window.dispatchEvent(new Event('app-refresh'));
                    renderSelectedTable();
                };
                transaction.onerror = (err) => { 
                    console.error(`Error clearing table ${scope}:`, err); 
                    alert(`Failed to clear table '${scope}'.`); 
                };
            } catch (err) {
                console.error('Error clearing table:', err);
            }
        }
    }
}

async function handleUnifiedImport() {
    clearMergeLog();
    const scope = document.getElementById('tableSelect').value;
    const fileInput = document.getElementById('dbFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a JSON file to import.');
        return;
    }

    if (!confirm('Are you sure you want to overwrite? ALL existing records in the target scope will be erased!')) return;
    
    logMergeResult(`Starting absolute overwrite for ${scope === 'all' ? 'Entire Database' : 'Table: ' + scope}...`, false);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const db = await openDB(); 
            
            if (scope === 'all') {
                if (typeof data !== 'object' || Array.isArray(data)) {
                    logMergeResult(`Error: Invalid JSON format. Root must be an object keyed by table names.`, true);
                    return;
                }
                const stores = getObjectStores();
                const validStores = Object.keys(data).filter(s => stores.includes(s));
                if (validStores.length === 0) {
                    logMergeResult('Error: No valid tables found in import file.', true);
                    return;
                }
                const transaction = db.transaction(validStores, 'readwrite');
                for (const storeName of validStores) {
                    const store = transaction.objectStore(storeName);
                    store.clear();
                    const items = data[storeName];
                    if (Array.isArray(items)) {
                        for (const item of items) { store.put(item); }
                    }
                }
                transaction.oncomplete = async () => {
                    logMergeResult(`Overwrite Successful! Database replaced.`);
                    alert('Database overwritten successfully!');
                    fileInput.value = '';
                    window.dispatchEvent(new Event('app-refresh'));
                    renderSelectedTable();
                };
                transaction.onerror = (err) => { 
                    logMergeResult(`Overwrite Failed: ${err.target.error.message}`, true);
                };
            } else {
                if (!Array.isArray(data)) {
                    logMergeResult(`Error: Invalid JSON format. Expected an array of records for a specific table.`, true);
                    return;
                }
                const transaction = db.transaction([scope], 'readwrite');
                const store = transaction.objectStore(scope);
                store.clear();
                data.forEach(item => store.put(item));
                transaction.oncomplete = async () => { 
                    logMergeResult(`Table '${scope}' imported successfully!`); 
                    alert(`Table '${scope}' imported successfully!`); 
                    fileInput.value = '';
                    window.dispatchEvent(new Event('app-refresh'));
                    renderSelectedTable();
                };
                transaction.onerror = (err) => { 
                    logMergeResult(`Import Failed: ${err.target.error.message}`, true);
                };
            }
        } catch (error) { 
            console.error('Error parsing or importing DB file:', error); 
            logMergeResult(`Critical Error: Invalid JSON file format.`, true);
        };
    };
    reader.readAsText(file);
}

async function handleUnifiedMerge() {
    clearMergeLog();
    const scope = document.getElementById('tableSelect').value;
    const fileInput = document.getElementById('dbFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a JSON file to merge.');
        return;
    }

    if (!confirm('Are you sure you want to merge this data? Existing records with matching IDs will be overwritten.')) return;

    logMergeResult(`Starting Merge Process for ${scope === 'all' ? 'Entire Database' : 'Table: ' + scope}...`, false);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const db = await openDB();
            
            if (scope === 'all') {
                if (typeof data !== 'object' || Array.isArray(data)) {
                    logMergeResult('Error: Invalid JSON format for entire DB. Root must be an object.', true);
                    return;
                }
                const stores = getObjectStores();
                const validStores = Object.keys(data).filter(s => stores.includes(s));

                if (validStores.length === 0) {
                    logMergeResult('Error: No valid tables found in merge file.', true);
                    return;
                }

                const transaction = db.transaction(validStores, 'readwrite');
                let successCount = 0;

                for (const storeName of validStores) {
                    const store = transaction.objectStore(storeName);
                    const items = data[storeName];
                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            if (!item.id) {
                                item.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
                            }
                            store.put(item);
                            successCount++;
                        });
                    }
                }

                transaction.oncomplete = () => {
                    logMergeResult(`Merge Successful! Processed ${successCount} records.`);
                    alert('Database merged successfully!');
                    fileInput.value = '';
                    window.dispatchEvent(new Event('app-refresh'));
                    renderSelectedTable();
                };

                transaction.onerror = (err) => {
                    logMergeResult(`Merge Failed: ${err.target.error.message}`, true);
                };
            } else {
                if (!Array.isArray(data)) {
                    logMergeResult('Error: Invalid JSON format. Expected an array for table merge.', true);
                    return;
                }
                const transaction = db.transaction([scope], 'readwrite');
                const store = transaction.objectStore(scope);
                let successCount = 0;
                
                data.forEach(item => {
                    if (!item.id) {
                        item.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
                    }
                    store.put(item);
                    successCount++;
                });
                
                transaction.oncomplete = () => {
                    logMergeResult(`Merge Successful! Processed ${successCount} records for table '${scope}'.`);
                    alert(`Table '${scope}' merged successfully!`);
                    fileInput.value = '';
                    window.dispatchEvent(new Event('app-refresh'));
                    renderSelectedTable();
                };

                transaction.onerror = (err) => {
                    logMergeResult(`Merge Failed: ${err.target.error.message}`, true);
                };
            }
        } catch (error) {
            console.error(error);
            logMergeResult(`Critical Error: Invalid JSON file format.`, true);
        }
    };
    reader.readAsText(file);
}

async function importMasterDatabase() {
    if (!confirm('Are you sure you want to restore the default master database? This will overwrite all existing data.')) {
        return;
    }

    const url = 'https://raw.githubusercontent.com/loathengine/Empirical-Percision/main/master-db.json';
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const db = await openDB();
        const stores = getObjectStores();

        const transaction = db.transaction(stores, 'readwrite');
        for (const storeName of stores) {
            if (data[storeName]) {
                const store = transaction.objectStore(storeName);
                store.clear();
                for (const item of data[storeName]) {
                    store.put(item);
                }
            }
        }
        transaction.oncomplete = async () => {
            alert('Default Master Database restored successfully!');
            window.dispatchEvent(new Event('app-refresh'));
            renderSelectedTable();
        };
        transaction.onerror = (err) => {
            console.error('Import transaction error:', err);
            alert('Failed to restore master database.');
        };
    } catch (error) {
        console.error('Error fetching or importing master DB file:', error);
        alert('Could not fetch or import the master database.');
    }
}

export async function renderSelectedTable() {
    const tableName = document.getElementById('tableSelect').value;
    const container = document.getElementById('table-display-container');
    const titleSpan = document.getElementById('selectedTableName');
    container.innerHTML = '';
    titleSpan.textContent = tableName === 'all' ? 'Entire Database' : tableName;

    if (!tableName || tableName === 'all') {
        container.innerHTML = '<p style="text-align: center; color: #9ca3af;">Select a specific table to view its contents.</p>';
        return;
    }

    const items = await getAllItems(tableName);

    if (items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #9ca3af;">This table is empty.</p>';
        return;
    }

    let displayItems = items;
    
    // Flatten complex objects for specific tables to improve visibility
    if (tableName === 'bullets') {
        displayItems = items.map(item => {
            const flat = { ...item };
            if (flat.ballistics) {
                flat.pref_model = flat.ballistics.preferred_model;
                flat.g1_bc = flat.ballistics.g1_bc;
                flat.g7_bc = flat.ballistics.g7_bc;
                delete flat.ballistics;
            }
            if (flat.stability_vars) {
                flat.is_tipped = flat.stability_vars.is_tipped;
                flat.tip_length = flat.stability_vars.tip_length;
                delete flat.stability_vars;
            }
            return flat;
        });
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const headerRow = document.createElement('tr');

    const headerSet = new Set();
    displayItems.forEach(item => {
        Object.keys(item).forEach(key => headerSet.add(key));
    });
    const headers = Array.from(headerSet);

    if (headers.includes('id')) {
        headers.splice(headers.indexOf('id'), 1);
        headers.unshift('id');
    }

    const actionTh = document.createElement('th');
    actionTh.textContent = 'Actions';
    headerRow.appendChild(actionTh);

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    displayItems.forEach(item => {
        const row = document.createElement('tr');
        
        const actionTd = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn-red';
        deleteBtn.style.padding = '0.2rem 0.5rem';
        deleteBtn.style.fontSize = '0.75rem';
        deleteBtn.onclick = async () => {
            if (confirm(`Are you sure you want to delete this specific record (ID: ${item.id})?`)) {
                try {
                    await deleteItem(tableName, item.id);
                    window.dispatchEvent(new Event('app-refresh'));
                    renderSelectedTable();
                } catch (e) {
                    console.error('Failed to delete item:', e);
                    alert('Error deleting item.');
                }
            }
        };
        actionTd.appendChild(deleteBtn);
        row.appendChild(actionTd);

        headers.forEach(header => {
            const td = document.createElement('td');
            let value = item[header];
            let displayValue = '';
            
            if (header === 'dataUrl' && typeof value === 'string' && value.length > 100) {
                 displayValue = `[Base64 Image Data: ${(value.length / 1024).toFixed(1)} KB]`; 
            } else if (value === undefined || value === null) {
                displayValue = '';
            } else if (typeof value === 'object') {
                displayValue = JSON.stringify(value, null, 2);
            } else {
                displayValue = value;
            }

            const textarea = document.createElement('textarea');
            textarea.value = displayValue;
            textarea.readOnly = true;
            textarea.style.width = '200px';
            textarea.style.height = '60px';
            textarea.style.minHeight = '60px';
            textarea.style.resize = 'both';
            textarea.style.border = '1px solid #4b5563';
            textarea.style.borderRadius = '0.25rem';
            textarea.style.backgroundColor = '#111827';
            textarea.style.color = '#d1d5db';
            textarea.style.padding = '0.25rem';
            textarea.style.fontSize = '0.8rem';
            
            td.appendChild(textarea);
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);
}
