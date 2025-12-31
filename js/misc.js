// js/misc.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { populateSelect } from './utils.js';
import { refreshComponentUI } from './components.js';
import { refreshFirearmsUI } from './firearms.js';
import { refreshLoadsUI } from './loads.js';

export function initMiscManagement() {
    const subTabContainer = document.querySelector('#misc .tabs-nav');
    if (!subTabContainer) return;

    const subTabContents = document.querySelectorAll('#misc .tab-content');
    subTabContainer.addEventListener('click', (e) => {
        if(e.target && e.target.classList.contains('sub-tab-link')) {
            e.preventDefault();
            const subTabId = e.target.getAttribute('data-subtab');
            subTabContainer.querySelectorAll('.sub-tab-link').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            subTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${subTabId}-subtab`) { content.classList.add('active'); }
            });
        }
    });

    document.getElementById('manufacturerForm').addEventListener('submit', handleManufacturerSubmit);
    document.getElementById('manufacturerForm').addEventListener('reset', () => document.getElementById('manufacturerId').value = '');
    document.getElementById('manufacturersTableBody').addEventListener('click', handleManufacturerTableClick);

    document.getElementById('diameterForm').addEventListener('submit', handleDiameterSubmit);
    document.getElementById('diameterForm').addEventListener('reset', () => document.getElementById('diameterId').value = '');
    document.getElementById('diametersTableBody').addEventListener('click', handleDiameterTableClick);
    
    document.getElementById('cartridgeForm').addEventListener('submit', handleCartridgeSubmit);
    document.getElementById('cartridgeForm').addEventListener('reset', () => document.getElementById('cartridgeId').value = '');
    document.getElementById('cartridgesTableBody').addEventListener('click', handleCartridgeTableClick);

    renderManufacturersTable();
    renderDiametersTable();
    renderCartridgesTable();
    refreshMiscUI();
}

export async function refreshMiscUI() {
    const diameters = await getAllItems('diameters');
    populateSelect('cartridgeDiameter', diameters, 'imperial', 'id');
}

async function handleManufacturerSubmit(e) {
    e.preventDefault();
    const types = Array.from(document.querySelectorAll('input[name="manufacturerType"]:checked')).map(cb => cb.value);
    const manufacturer = {
        id: document.getElementById('manufacturerId').value || generateUniqueId(),
        name: document.getElementById('manufacturerName').value,
        type: types
    };
    await updateItem('manufacturers', manufacturer);
    e.target.reset();
    renderManufacturersTable();
    refreshComponentUI();
}

async function renderManufacturersTable() {
    const items = await getAllItems('manufacturers');
    const tableBody = document.getElementById('manufacturersTableBody');
    tableBody.innerHTML = '';
    for (const item of items) {
        const row = `
            <tr>
                <td>${item.name}</td>
                <td>${item.type ? item.type.join(', ') : 'N/A'}</td>
                <td>
                    <div class="flex-container">
                        <button class="btn-yellow btn-small" data-id="${item.id}" data-action="edit">Edit</button>
                        <button class="btn-red btn-small" data-id="${item.id}" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

async function handleManufacturerTableClick(e) {
    const { id, action } = e.target.dataset;
    if (!id || !action) return;
    if (action === 'delete') {
        if (confirm('Are you sure?')) { await deleteItem('manufacturers', id); renderManufacturersTable(); refreshComponentUI(); }
    } else if (action === 'edit') {
        const item = await getItem('manufacturers', id);
        document.getElementById('manufacturerId').value = item.id;
        document.getElementById('manufacturerName').value = item.name;
        document.querySelectorAll('input[name="manufacturerType"]').forEach(cb => {
            cb.checked = item.type && item.type.includes(cb.value);
        });
    }
}

async function handleDiameterSubmit(e) {
    e.preventDefault();
    const diameter = {
        id: document.getElementById('diameterId').value || generateUniqueId(),
        imperial: document.getElementById('diameterImperial').value,
        metric: document.getElementById('diameterMetric').value
    };
    await updateItem('diameters', diameter);
    e.target.reset();
    renderDiametersTable();
    refreshComponentUI();
    refreshMiscUI();
    refreshFirearmsUI();
    refreshLoadsUI();
}

async function renderDiametersTable() {
    const items = await getAllItems('diameters');
    const tableBody = document.getElementById('diametersTableBody');
    tableBody.innerHTML = '';
    for (const item of items) {
        const row = `
            <tr>
                <td>${item.imperial}</td>
                <td>${item.metric}</td>
                <td>
                    <div class="flex-container">
                        <button class="btn-yellow btn-small" data-id="${item.id}" data-action="edit">Edit</button>
                        <button class="btn-red btn-small" data-id="${item.id}" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

async function handleDiameterTableClick(e) {
    const { id, action } = e.target.dataset;
    if (!id || !action) return;
    if (action === 'delete') {
        if (confirm('Are you sure?')) { await deleteItem('diameters', id); renderDiametersTable(); refreshComponentUI(); refreshMiscUI(); refreshFirearmsUI(); refreshLoadsUI(); }
    } else if (action === 'edit') {
        const item = await getItem('diameters', id);
        document.getElementById('diameterId').value = item.id;
        document.getElementById('diameterImperial').value = item.imperial;
        document.getElementById('diameterMetric').value = item.metric;
    }
}

async function handleCartridgeSubmit(e) {
    e.preventDefault();
    const cartridge = {
        id: document.getElementById('cartridgeId').value || generateUniqueId(),
        name: document.getElementById('cartridgeName').value,
        diameterId: document.getElementById('cartridgeDiameter').value,
        oal: parseFloat(document.getElementById('cartridgeOAL').value),
        minCaseLength: parseFloat(document.getElementById('cartridgeMinCaseLength').value),
        maxCaseLength: parseFloat(document.getElementById('cartridgeMaxCaseLength').value),
        trimLength: parseFloat(document.getElementById('cartridgeTrimLength').value)
    };
    await updateItem('cartridges', cartridge);
    e.target.reset();
    renderCartridgesTable();
    refreshFirearmsUI();
    refreshLoadsUI();
}

async function renderCartridgesTable() {
    const [items, diameters] = await Promise.all([
        getAllItems('cartridges'),
        getAllItems('diameters')
    ]);
    const diameterMap = new Map(diameters.map(d => [d.id, d.imperial]));
    const tableBody = document.getElementById('cartridgesTableBody');
    tableBody.innerHTML = '';
    for (const item of items) {
        const diameterImperial = diameterMap.get(item.diameterId) || 'N/A';
        const row = `
            <tr>
                <td>${item.name}</td>
                <td>${diameterImperial}</td>
                <td>${item.oal || ''}</td>
                <td>${item.minCaseLength || ''}</td>
                <td>${item.maxCaseLength || ''}</td>
                <td>${item.trimLength || ''}</td>
                <td>
                    <div class="flex-container">
                        <button class="btn-yellow btn-small" data-id="${item.id}" data-action="edit">Edit</button>
                        <button class="btn-red btn-small" data-id="${item.id}" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

async function handleCartridgeTableClick(e) {
    const { id, action } = e.target.dataset;
    if (!id || !action) return;
    if (action === 'delete') {
        if (confirm('Are you sure?')) { 
            await deleteItem('cartridges', id); 
            renderCartridgesTable(); 
            refreshFirearmsUI(); 
            refreshLoadsUI();
        }
    } else if (action === 'edit') {
        const item = await getItem('cartridges', id);
        document.getElementById('cartridgeId').value = item.id;
        document.getElementById('cartridgeName').value = item.name;
        document.getElementById('cartridgeDiameter').value = item.diameterId;
        document.getElementById('cartridgeOAL').value = item.oal;
        document.getElementById('cartridgeMinCaseLength').value = item.minCaseLength;
        document.getElementById('cartridgeMaxCaseLength').value = item.maxCaseLength;
        document.getElementById('cartridgeTrimLength').value = item.trimLength;
    }
}
