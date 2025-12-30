// js/components.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { populateSelect } from './utils.js';
import { refreshLoadsUI } from './loads.js';

async function refreshBrassFormDropDowns(diameterId = null) {
    const allDiameters = await getAllItems('diameters');
    const allCartridges = await getAllItems('cartridges');
    
    populateSelect('brassDiameter', allDiameters, 'imperial', 'id');
    if(diameterId) {
        document.getElementById('brassDiameter').value = diameterId;
    }

    const selectedDiameter = document.getElementById('brassDiameter').value;
    const filteredCartridges = selectedDiameter ? allCartridges.filter(c => c.diameterId === selectedDiameter) : allCartridges;
    populateSelect('brassCartridge', filteredCartridges, 'name', 'id');
}

export function initComponentsManagement() {
    const subTabContainer = document.querySelector('#components .tabs-nav');
    if (!subTabContainer) return;

    const subTabContents = document.querySelectorAll('#components .tab-content');
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

    document.getElementById('bulletForm').addEventListener('submit', handleBulletSubmit);
    document.getElementById('bulletForm').addEventListener('reset', () => document.getElementById('bulletId').value = '');
    document.getElementById('bulletsTableBody').addEventListener('click', handleBulletTableClick);
    
    document.getElementById('powderForm').addEventListener('submit', handlePowderSubmit);
    document.getElementById('powderForm').addEventListener('reset', () => document.getElementById('powderId').value = '');
    document.getElementById('powdersTableBody').addEventListener('click', handlePowderTableClick);

    document.getElementById('primerForm').addEventListener('submit', handlePrimerSubmit);
    document.getElementById('primerForm').addEventListener('reset', () => document.getElementById('primerId').value = '');
    document.getElementById('primersTableBody').addEventListener('click', handlePrimerTableClick);

    document.getElementById('brassForm').addEventListener('submit', handleBrassSubmit);
    document.getElementById('brassForm').addEventListener('reset', () => document.getElementById('brassId').value = '');
    document.getElementById('brassTableBody').addEventListener('click', handleBrassTableClick);
    document.getElementById('brassDiameter').addEventListener('change', () => refreshBrassFormDropDowns());

    refreshComponentUI();
}

export async function refreshComponentUI() {
    const manufacturers = await getAllItems('manufacturers');
    const diameters = await getAllItems('diameters');
    
    populateSelect('bulletManufacturer', manufacturers.filter(m => m.type && m.type.includes('bullet')), 'name', 'id');
    populateSelect('powderManufacturer', manufacturers.filter(m => m.type && m.type.includes('powder')), 'name', 'id');
    populateSelect('primerManufacturer', manufacturers.filter(m => m.type && m.type.includes('primer')), 'name', 'id');
    populateSelect('brassManufacturer', manufacturers.filter(m => m.type && m.type.includes('brass')), 'name', 'id');
    populateSelect('bulletDiameter', diameters, 'imperial', 'id');

    refreshBrassFormDropDowns();
    renderBulletsTable();
    renderPowdersTable();
    renderPrimersTable();
    renderBrassTable();
}

async function handleBulletSubmit(e) {
    e.preventDefault();
    const bullet = {
        id: document.getElementById('bulletId').value || generateUniqueId(),
        manufacturerId: document.getElementById('bulletManufacturer').value,
        diameterId: document.getElementById('bulletDiameter').value,
        name: document.getElementById('bulletName').value,
        weight: parseFloat(document.getElementById('bulletWeight').value),
        length: parseFloat(document.getElementById('bulletLength').value)
    };
    await updateItem('bullets', bullet);
    e.target.reset();
    renderBulletsTable();
    refreshLoadsUI();
}

async function renderBulletsTable() {
    const [bullets, manufacturers, diameters] = await Promise.all([
        getAllItems('bullets'),
        getAllItems('manufacturers'),
        getAllItems('diameters')
    ]);

    const manufacturerMap = new Map(manufacturers.map(m => [m.id, m.name]));
    const diameterMap = new Map(diameters.map(d => [d.id, d.imperial]));

    const tableBody = document.getElementById('bulletsTableBody');
    tableBody.innerHTML = '';

    for (const bullet of bullets) {
        const manufacturerName = manufacturerMap.get(bullet.manufacturerId) || 'N/A';
        const diameterImperial = diameterMap.get(bullet.diameterId) || 'N/A';
        
        const row = `
            <tr>
                <td>${bullet.name}</td>
                <td>${manufacturerName}</td>
                <td>${diameterImperial}</td>
                <td>${bullet.weight} gr</td>
                <td>${bullet.length ? bullet.length.toFixed(3) + '"' : ''}</td>
                <td>
                    <div class="flex-container">
                        <button class="btn-yellow btn-small" data-id="${bullet.id}" data-action="edit">Edit</button>
                        <button class="btn-red btn-small" data-id="${bullet.id}" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

async function handleBulletTableClick(e) {
    const { id, action } = e.target.dataset;
    if (!id || !action) return;
    if (action === 'delete') {
        if (confirm('Are you sure?')) { 
            await deleteItem('bullets', id); 
            renderBulletsTable(); 
            refreshLoadsUI();
        }
    } else if (action === 'edit') {
        const bullet = await getItem('bullets', id);
        document.getElementById('bulletId').value = bullet.id;
        document.getElementById('bulletManufacturer').value = bullet.manufacturerId;
        document.getElementById('bulletDiameter').value = bullet.diameterId;
        document.getElementById('bulletName').value = bullet.name;
        document.getElementById('bulletWeight').value = bullet.weight;
        document.getElementById('bulletLength').value = bullet.length;
    }
}

async function handlePowderSubmit(e) {
    e.preventDefault();
    const powder = {
        id: document.getElementById('powderId').value || generateUniqueId(),
        manufacturerId: document.getElementById('powderManufacturer').value,
        name: document.getElementById('powderName').value
    };
    await updateItem('powders', powder);
    e.target.reset();
    renderPowdersTable();
    refreshLoadsUI();
}

async function renderPowdersTable() {
    const [powders, manufacturers] = await Promise.all([
        getAllItems('powders'),
        getAllItems('manufacturers')
    ]);
    const manufacturerMap = new Map(manufacturers.map(m => [m.id, m.name]));
    const tableBody = document.getElementById('powdersTableBody');
    tableBody.innerHTML = '';
    for (const powder of powders) {
        const manufacturerName = manufacturerMap.get(powder.manufacturerId) || 'N/A';
        const row = `
            <tr>
                <td>${powder.name}</td>
                <td>${manufacturerName}</td>
                <td>
                    <div class="flex-container">
                        <button class="btn-yellow btn-small" data-id="${powder.id}" data-action="edit">Edit</button>
                        <button class="btn-red btn-small" data-id="${powder.id}" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

 async function handlePowderTableClick(e) {
    const { id, action } = e.target.dataset;
    if (!id || !action) return;
    if (action === 'delete') {
        if (confirm('Are you sure?')) { 
            await deleteItem('powders', id); 
            renderPowdersTable(); 
            refreshLoadsUI();
        }
    } else if (action === 'edit') {
        const item = await getItem('powders', id);
        document.getElementById('powderId').value = item.id;
        document.getElementById('powderManufacturer').value = item.manufacturerId;
        document.getElementById('powderName').value = item.name;
    }
}

async function handlePrimerSubmit(e) {
    e.preventDefault();
    const primer = {
        id: document.getElementById('primerId').value || generateUniqueId(),
        manufacturerId: document.getElementById('primerManufacturer').value,
        name: document.getElementById('primerName').value
    };
    await updateItem('primers', primer);
    e.target.reset();
    renderPrimersTable();
    refreshLoadsUI();
}

async function renderPrimersTable() {
    const [primers, manufacturers] = await Promise.all([
        getAllItems('primers'),
        getAllItems('manufacturers')
    ]);
    const manufacturerMap = new Map(manufacturers.map(m => [m.id, m.name]));
    const tableBody = document.getElementById('primersTableBody');
    tableBody.innerHTML = '';
    for (const primer of primers) {
        const manufacturerName = manufacturerMap.get(primer.manufacturerId) || 'N/A';
        const row = `
            <tr>
                <td>${primer.name}</td>
                <td>${manufacturerName}</td>
                <td>
                    <div class="flex-container">
                        <button class="btn-yellow btn-small" data-id="${primer.id}" data-action="edit">Edit</button>
                        <button class="btn-red btn-small" data-id="${primer.id}" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

async function handlePrimerTableClick(e) {
    const { id, action } = e.target.dataset;
    if (!id || !action) return;
    if (action === 'delete') {
        if (confirm('Are you sure?')) { 
            await deleteItem('primers', id); 
            renderPrimersTable(); 
            refreshLoadsUI();
        }
    } else if (action === 'edit') {
        const item = await getItem('primers', id);
        document.getElementById('primerId').value = item.id;
        document.getElementById('primerManufacturer').value = item.manufacturerId;
        document.getElementById('primerName').value = item.name;
    }
}

async function handleBrassSubmit(e) {
    e.preventDefault();
    const brass = {
        id: document.getElementById('brassId').value || generateUniqueId(),
        cartridgeId: document.getElementById('brassCartridge').value,
        manufacturerId: document.getElementById('brassManufacturer').value,
        primerPocket: document.getElementById('brassPrimerPocket').value,
        primerHole: document.getElementById('brassPrimerHole').value
    };
    await updateItem('brass', brass);
    e.target.reset();
    renderBrassTable();
    refreshLoadsUI();
}

async function renderBrassTable() {
    const [brassItems, manufacturers, cartridges] = await Promise.all([
        getAllItems('brass'),
        getAllItems('manufacturers'),
        getAllItems('cartridges')
    ]);
    const manufacturerMap = new Map(manufacturers.map(m => [m.id, m.name]));
    const cartridgeMap = new Map(cartridges.map(c => [c.id, c.name]));

    const tableBody = document.getElementById('brassTableBody');
    tableBody.innerHTML = '';
    for (const brass of brassItems) {
        const manufacturerName = manufacturerMap.get(brass.manufacturerId) || 'N/A';
        const cartridgeName = cartridgeMap.get(brass.cartridgeId) || 'N/A';
        const row = `
            <tr>
                <td>${cartridgeName}</td>
                <td>${manufacturerName}</td>
                <td>${brass.primerPocket}</td>
                <td>${brass.primerHole}</td>
                <td>
                    <div class="flex-container">
                        <button class="btn-yellow btn-small" data-id="${brass.id}" data-action="edit">Edit</button>
                        <button class="btn-red btn-small" data-id="${brass.id}" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

async function handleBrassTableClick(e) {
    const { id, action } = e.target.dataset;
    if (!id || !action) return;
    if (action === 'delete') {
        if (confirm('Are you sure?')) { 
            await deleteItem('brass', id); 
            renderBrassTable(); 
            refreshLoadsUI();
        }
    } else if (action === 'edit') {
        const item = await getItem('brass', id);
        const cartridge = await getItem('cartridges', item.cartridgeId);
        if (cartridge) {
            await refreshBrassFormDropDowns(cartridge.diameterId);
            document.getElementById('brassCartridge').value = item.cartridgeId;
        }
        document.getElementById('brassId').value = item.id;
        document.getElementById('brassManufacturer').value = item.manufacturerId;
        document.getElementById('brassPrimerPocket').value = item.primerPocket;
        document.getElementById('brassPrimerHole').value = item.primerHole;
    }
}
