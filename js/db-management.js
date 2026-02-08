// js/db-management.js
import { getAllItems, getObjectStores, deleteDatabase } from './db.js';
import { triggerDownload } from './utils.js';
import { refreshAllUI } from './main.js'; // Note: circular dependency if main imports this, handled by init pattern
import { openDB } from './db.js'; // Needed for imports

// We can avoid importing main.js by passing the refresh function as a callback or using window event.
// For simplicity, we'll dispatch a custom event on window for refresh.

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

    document.getElementById('exportDbBtn').addEventListener('click', exportDatabase);
    document.getElementById('importDbInput').addEventListener('change', importDatabase);
    document.getElementById('deleteDbBtn').addEventListener('click', handleDeleteDatabase);
    
    document.getElementById('exportTableBtn').addEventListener('click', exportTableData);
    document.getElementById('importTableInput').addEventListener('change', importTableData);
    document.getElementById('clearTableBtn').addEventListener('click', clearTableData);

    tableSelect.addEventListener('change', renderSelectedTable);
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

    const table = document.createElement('table');
    table.className = 'data-table';
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const headerRow = document.createElement('tr');

    const headerSet = new Set();
    items.forEach(item => {
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

    items.forEach(item => {
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
    triggerDownload(JSON.stringify(allData, null, 2), `master-db-backup-${dateString}.json`);
}

function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        // We need to access DB instance to start transaction, so importing openDB or assuming global access.
        // Better to re-open or pass db instance. Since module pattern, let's reopen to be safe or export getter.
        // However, `db.js` holds the `db` variable but doesn't export it directly.
        // Let's rely on a helper or just modify `db.js` to export a `getDB` function.
        // For now, let's assume we can get it via openDB resolving quickly.
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
    triggerDownload(JSON.stringify(data, null, 2), `${tableName}-backup.json`);
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
