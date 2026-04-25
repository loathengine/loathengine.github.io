// js/db-management/operations.js
import { getAllItems, getObjectStores, clearDatabase, getDB } from '../db.js';
import { triggerDownload } from '../utils.js';
import { logMergeResult, clearMergeLog, renderSelectedTable } from './ui.js';

export async function handleUnifiedExport() {
    const scope = document.getElementById('tableSelect').value;
    if (scope === 'all') {
        const allData = {};
        const stores = getObjectStores();
        for (const storeName of stores) { 
            allData[storeName] = await getAllItems(storeName); 
        }
        const now = new Date();
        const timestamp = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') + '-' +
            String(now.getMinutes()).padStart(2, '0') + '-' +
            String(now.getSeconds()).padStart(2, '0');
            
        const jsonString = '{\n' +
            Object.keys(allData).map(storeName => {
                const items = allData[storeName].map(item => '    ' + JSON.stringify(item));
                return `  "${storeName}": [\n${items.join(',\n')}\n  ]`;
            }).join(',\n') +
        '\n}';
        triggerDownload(jsonString, `MDB_${timestamp}.json`);
    } else {
        if (!scope) {
            alert('Please select a target scope to export.');
            return;
        }
        const data = await getAllItems(scope);
        const jsonString = '{\n  "' + scope + '": [\n' +
            data.map(item => '    ' + JSON.stringify(item)).join(',\n') +
        '\n  ]\n}';
        triggerDownload(jsonString, `${scope}-backup.json`);
    }
}

export async function handleUnifiedDelete() {
    const scope = document.getElementById('tableSelect').value;
    if (scope === 'all') {
        if (confirm('Are you sure you want to permanently delete the entire database? This action cannot be undone.')) {
            try {
                await clearDatabase();
                alert('Nuclear Reset complete. All data has been permanently deleted.');
                window.location.reload(); // Force a full reload to re-initialize everything cleanly
            } catch (err) {
                console.error('Error clearing database:', err);
                alert('Could not completely clear the database. Check console for details.');
            }
        }
    } else {
        if (!scope) {
            alert('Please select a target scope to delete.');
            return;
        }
        if (confirm(`Are you sure you want to delete all data from the '${scope}' table?`)) {
            try {
                const db = await getDB();
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

export async function handleUnifiedRestore(isOverwrite) {
    clearMergeLog();
    const fileInput = document.getElementById('dbFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a JSON file to restore from.');
        return;
    }

    if (isOverwrite) {
        if (!confirm('Are you sure you want to OVERWRITE data? Existing records in the imported tables will be completely erased and replaced.')) return;
    } else {
        if (!confirm('Are you sure you want to MERGE data? Existing records with matching IDs will be updated.')) return;
    }

    logMergeResult(`Starting ${isOverwrite ? 'Overwrite' : 'Merge'} Process...`, false);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const db = await getDB();
            
            if (typeof data !== 'object' || Array.isArray(data)) {
                logMergeResult('Error: Invalid JSON format. Expected an object with table names as keys.', true);
                return;
            }

            const stores = getObjectStores();
            const validStores = Object.keys(data).filter(s => stores.includes(s) && Array.isArray(data[s]));

            if (validStores.length === 0) {
                logMergeResult('Error: No valid tables found in the backup file.', true);
                return;
            }

            const transaction = db.transaction(validStores, 'readwrite');
            let successCount = 0;

            for (const storeName of validStores) {
                const store = transaction.objectStore(storeName);
                if (isOverwrite) {
                    store.clear();
                }
                const items = data[storeName];
                items.forEach(item => {
                    if (!item.id) {
                        item.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
                    }
                    store.put(item);
                    successCount++;
                });
            }

            transaction.oncomplete = () => {
                logMergeResult(`Restore Successful! Processed ${successCount} records across ${validStores.length} tables.`);
                alert(`Database ${isOverwrite ? 'overwritten' : 'merged'} successfully!`);
                fileInput.value = '';
                window.dispatchEvent(new Event('app-refresh'));
                renderSelectedTable();
            };

            transaction.onerror = (err) => {
                logMergeResult(`Restore Failed: ${err.target.error.message}`, true);
            };
        } catch (error) {
            console.error(error);
            logMergeResult(`Critical Error: Invalid JSON file format.`, true);
        }
    };
    reader.readAsText(file);
}

export async function handleSyncMaster(url) {
    if (!confirm('Are you sure you want to sync Database Data? This will completely overwrite records in all matching tables using the data from the imported file.')) {
        return;
    }

    clearMergeLog();
    logMergeResult(`Fetching database from ${url}...`, false);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const db = await getDB();
        
        // Find ALL present stores inside the imported DB that currently exist in our schema
        const validStores = Array.from(db.objectStoreNames).filter(s => data[s] && Array.isArray(data[s]));

        if (validStores.length === 0) {
            logMergeResult('Error: No valid tables found in the given database file.', true);
            return;
        }

        const transaction = db.transaction(validStores, 'readwrite');
        let totalItems = 0;

        for (const storeName of validStores) {
            const store = transaction.objectStore(storeName);
            store.clear(); // Complete overwrite per 'all data equal' philosophy
            for (const item of data[storeName]) {
                store.put(item);
                totalItems++;
            }
        }
        
        transaction.oncomplete = async () => {
            logMergeResult(`Sync Successful! Imported ${totalItems} records across ${validStores.length} tables.`);
            alert('Database explicitly synchronized successfully!');
            window.dispatchEvent(new Event('app-refresh'));
            renderSelectedTable();
        };
        transaction.onerror = (err) => {
            console.error('Import transaction error:', err);
            logMergeResult(`Sync Failed: ${err.target.error.message}`, true);
            alert('Failed to sync master database.');
        };
    } catch (error) {
        console.error('Error fetching or importing master DB file:', error);
        logMergeResult(`Critical Error: Could not fetch or parse the master database.`, true);
        alert('Could not fetch or import the master database.');
    }
}
