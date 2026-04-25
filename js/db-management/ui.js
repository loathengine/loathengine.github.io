// js/db-management/ui.js
import { getAllItems, deleteItem } from '../db.js';
import { createSessionName } from '../utils.js';

export async function populateAIExportSessionSelect() {
    const select = document.getElementById('aiExportSessionSelect');
    if (!select) return;
    
    const sessions = await getAllItems('impactData');
    
    select.innerHTML = '<option value="">-- Select a Session --</option>';
    
    if (sessions.length === 0) {
        select.innerHTML = '<option value="">-- No Sessions Found --</option>';
        return;
    }

    sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    for (const session of sessions) {
        const option = document.createElement('option');
        option.value = session.id;
        option.textContent = await createSessionName(session);
        select.appendChild(option);
    }
}

export function updateUnifiedButtonLabels() {
    const scope = document.getElementById('tableSelect').value;
    const exportBtn = document.getElementById('unifiedExportBtn');
    const deleteBtn = document.getElementById('unifiedDeleteBtn');
    
    if (scope === 'all') {
        exportBtn.textContent = 'Export Entire Database';
        deleteBtn.textContent = 'Nuclear Reset (All Data)';
    } else {
        const formattedScope = scope.charAt(0).toUpperCase() + scope.slice(1);
        exportBtn.textContent = `Export Table: ${formattedScope}`;
        deleteBtn.textContent = `Clear Table: ${formattedScope}`;
    }
}

export function logMergeResult(message, isError = false) {
    const logDiv = document.getElementById('mergeResultLog');
    logDiv.style.display = 'block';
    const color = isError ? '#ef4444' : '#10b981';
    const timestamp = new Date().toLocaleTimeString();
    logDiv.innerHTML += `<div style="color: ${color}; margin-bottom: 0.25rem;">[${timestamp}] ${message}</div>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

export function clearMergeLog() {
    const logDiv = document.getElementById('mergeResultLog');
    logDiv.innerHTML = '';
    logDiv.style.display = 'none';
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
