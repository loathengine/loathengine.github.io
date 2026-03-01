// js/db-management.js
import { getAllItems, getObjectStores, deleteDatabase, openDB } from './db.js';
import { triggerDownload } from './utils.js';

export function initDbManagement() {
    const tableSelect = document.getElementById('tableSelect');
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select Table --';
    tableSelect.appendChild(defaultOption);

    const stores = getObjectStores();
    stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store;
        option.textContent = store.charAt(0).toUpperCase() + store.slice(1);
        tableSelect.appendChild(option);
    });

    // Global Actions
    document.getElementById('exportDbBtn').addEventListener('click', exportDatabase);
    document.getElementById('importMasterDbBtn').addEventListener('click', importMasterDatabase);
    document.getElementById('importDbInput').addEventListener('change', importDatabase);
    document.getElementById('deleteDbBtn').addEventListener('click', handleDeleteDatabase);
    
    // Merge Actions
    document.getElementById('testMergeBtn').addEventListener('click', handleTestMerge);
    document.getElementById('mergeDbBtn').addEventListener('click', handleMergeDatabase);

    // Table Actions
    document.getElementById('exportTableBtn').addEventListener('click', exportTableData);
    document.getElementById('importTableInput').addEventListener('change', importTableData);
    document.getElementById('clearTableBtn').addEventListener('click', clearTableData);

    tableSelect.addEventListener('change', renderSelectedTable);
}

// Helper to log to the merge result area
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

async function handleTestMerge() {
    clearMergeLog();
    const fileInput = document.getElementById('mergeDbInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a JSON file to merge.');
        return;
    }

    logMergeResult('Starting Test Merge...', false);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (typeof data !== 'object' || Array.isArray(data)) {
                logMergeResult('Error: Invalid JSON format. Root must be an object keyed by table names.', true);
                return;
            }

            const db = await openDB();
            const stores = getObjectStores();
            let totalNew = 0;
            let totalUpdates = 0;
            let errors = 0;

            for (const storeName of Object.keys(data)) {
                if (!stores.includes(storeName)) {
                    logMergeResult(`Warning: Table '${storeName}' does not exist in the database. Skipping.`, true);
                    continue;
                }

                const items = data[storeName];
                if (!Array.isArray(items)) {
                    logMergeResult(`Error: Data for table '${storeName}' is not an array.`, true);
                    errors++;
                    continue;
                }

                let newCount = 0;
                let updateCount = 0;

                // Check items against DB
                // We use a transaction to check existence
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);

                // We need to wait for all requests in this loop
                // Using Promise.all with store.get requests
                const checkPromises = items.map(item => {
                    return new Promise((resolve) => {
                        if (!item.id) {
                            // If no ID, it will be a new item (generated ID)
                            resolve('new'); 
                            return;
                        }
                        const req = store.get(item.id);
                        req.onsuccess = () => {
                            if (req.result) resolve('update');
                            else resolve('new');
                        };
                        req.onerror = () => resolve('error');
                    });
                });

                const results = await Promise.all(checkPromises);
                
                results.forEach(res => {
                    if (res === 'new') newCount++;
                    else if (res === 'update') updateCount++;
                });

                totalNew += newCount;
                totalUpdates += updateCount;

                logMergeResult(`Table '${storeName}': ${newCount} New, ${updateCount} Updates.`);
            }

            logMergeResult('-----------------------------------');
            logMergeResult(`Test Complete: ${totalNew} Records to Insert, ${totalUpdates} Records to Update.`);
            if (errors > 0) logMergeResult(`Found ${errors} errors.`, true);
            else logMergeResult('No schema errors found. Safe to merge.');

        } catch (error) {
            console.error(error);
            logMergeResult(`Critical Error: ${error.message}`, true);
        }
    };
    reader.readAsText(file);
}

async function handleMergeDatabase() {
    clearMergeLog();
    const fileInput = document.getElementById('mergeDbInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a JSON file to merge.');
        return;
    }

    if (!confirm('Are you sure you want to merge this data? Existing records with matching IDs will be overwritten.')) {
        return;
    }

    logMergeResult('Starting Merge Process...', false);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const db = await openDB();
            const stores = getObjectStores();
            const validStores = Object.keys(data).filter(s => stores.includes(s));

            if (validStores.length === 0) {
                logMergeResult('Error: No valid tables found in import file.', true);
                return;
            }

            const transaction = db.transaction(validStores, 'readwrite');
            let successCount = 0;

            for (const storeName of validStores) {
                const store = transaction.objectStore(storeName);
                const items = data[storeName];
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        // Ensure item has an ID if missing, though typically merge implies we want to keep IDs.
                        // If ID is missing, put() might fail if keyPath is 'id' and autoIncrement is false (default).
                        // Our db.js generates IDs in updateItem, but here we use raw put.
                        // If no ID, generate one.
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
                window.dispatchEvent(new Event('app-refresh'));
                fileInput.value = ''; // Clear input
            };

            transaction.onerror = (err) => {
                console.error('Merge transaction error:', err);
                logMergeResult(`Merge Failed: ${err.target.error.message}`, true);
                alert('Merge failed. See log for details.');
            };

        } catch (error) {
            console.error(error);
            logMergeResult(`Critical Error: ${error.message}`, true);
            alert('Merge failed due to a critical error.');
        }
    };
    reader.readAsText(file);
}

async function importMasterDatabase() {
    if (!confirm('Are you sure you want to import the master database? This will overwrite all existing data.')) {
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
            alert('Master database imported successfully!');
            window.dispatchEvent(new Event('app-refresh'));
        };
        transaction.onerror = (err) => {
            console.error('Import transaction error:', err);
            alert('Failed to import master database.');
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
    titleSpan.textContent = tableName;

    if (!tableName) {
        container.innerHTML = '<p style="text-align: center; color: #9ca3af;">Select a table to view its contents.</p>';
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

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    displayItems.forEach(item => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            let value = item[header];
            let displayValue = '';
            
            if (header === 'dataUrl' && typeof value === 'string' && value.length > 100) {
                 displayValue = value; // Keep full value for textarea
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

async function exportDatabase() {
    const allData = {};
    const stores = getObjectStores();
    for (const storeName of stores) { allData[storeName] = await getAllItems(storeName); }
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10);
    const jsonString = '{\n' +
        Object.keys(allData).map(storeName => {
            const items = allData[storeName].map(item => '    ' + JSON.stringify(item));
            return `  "${storeName}": [\n${items.join(',\n')}\n  ]`;
        }).join(',\n') +
    '\n}';
    triggerDownload(jsonString, `master-db-backup-${dateString}.json`);
}

function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const db = await openDB(); 
        const stores = getObjectStores();

        try {
            const data = JSON.parse(e.target.result);
            const transaction = db.transaction(stores, 'readwrite');
            for (const storeName of stores) {
                if (data[storeName]) {
                    const store = transaction.objectStore(storeName);
                    store.clear();
                    for (const item of data[storeName]) { store.put(item); }
                }
            }
            transaction.oncomplete = async () => {
                alert('Database imported successfully!');
                event.target.value = '';
                window.dispatchEvent(new Event('app-refresh'));
            };
            transaction.onerror = (err) => { console.error('Import transaction error:', err); alert('Failed to import database.'); };
        } catch (error) { console.error('Error parsing or importing DB file:', error); alert('Invalid database file format.'); };
    };
    reader.readAsText(file);
}

async function handleDeleteDatabase() {
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
}

async function exportTableData() {
    const tableName = document.getElementById('tableSelect').value;
    if (!tableName) {
        alert('Please select a table to export.');
        return;
    }
    const data = await getAllItems(tableName);
    const jsonString = '[\n' +
        data.map(item => '  ' + JSON.stringify(item)).join(',\n') +
    '\n]';
    triggerDownload(jsonString, `${tableName}-backup.json`);
}

function importTableData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const tableName = document.getElementById('tableSelect').value;
        if (!tableName) {
        alert('Please select a table to import data into.');
        event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const db = await openDB();
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) throw new Error('JSON is not an array.');
            const transaction = db.transaction([tableName], 'readwrite');
            const store = transaction.objectStore(tableName);
            store.clear();
            data.forEach(item => store.put(item));
            transaction.oncomplete = async () => { 
                alert(`Table '${tableName}' imported successfully!`); 
                event.target.value = '';
                window.dispatchEvent(new Event('app-refresh'));
            };
            transaction.onerror = (err) => { console.error(`Import error for table ${tableName}:`, err); alert(`Failed to import data for table '${tableName}'.`); };
        } catch (error) { console.error('Error parsing or importing table file:', error); alert('Invalid table file format. Must be a JSON array.'); };
    };
    reader.readAsText(file);
}

async function clearTableData() {
    const tableName = document.getElementById('tableSelect').value;
        if (!tableName) {
        alert('Please select a table to clear.');
        return;
    }
    if (confirm(`Are you sure you want to delete all data from the '${tableName}' table?`)) {
        const db = await openDB();
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        store.clear();
        transaction.oncomplete = async () => { 
            alert(`Table '${tableName}' has been cleared.`); 
            window.dispatchEvent(new Event('app-refresh'));
        };
        transaction.onerror = (err) => { console.error(`Error clearing table ${tableName}:`, err); alert(`Failed to clear table '${tableName}'.`); };
    }
}
