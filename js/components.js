// js/components.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { populateSelect, formatManufacturerName } from './utils.js';
import { refreshFirearmsUI } from './firearms.js';
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

    document.getElementById('manufacturerForm').addEventListener('submit', handleManufacturerSubmit);
    document.getElementById('manufacturerForm').addEventListener('reset', () => document.getElementById('manufacturerId').value = '');
    document.getElementById('manufacturersTableBody').addEventListener('click', handleManufacturerTableClick);

    document.getElementById('diameterForm').addEventListener('submit', handleDiameterSubmit);
    document.getElementById('diameterForm').addEventListener('reset', () => document.getElementById('diameterId').value = '');
    document.getElementById('diametersTableBody').addEventListener('click', handleDiameterTableClick);
    
    document.getElementById('cartridgeForm').addEventListener('submit', handleCartridgeSubmit);
    document.getElementById('cartridgeForm').addEventListener('reset', () => document.getElementById('cartridgeId').value = '');
    document.getElementById('cartridgesTableBody').addEventListener('click', handleCartridgeTableClick);


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

    // Filter Event Listeners
    document.getElementById('filterManufacturerType').addEventListener('change', renderManufacturersTable);
    document.getElementById('clearManufacturerFilters').addEventListener('click', () => { document.getElementById('filterManufacturerType').value=''; renderManufacturersTable(); });

    document.getElementById('filterDiameterSearch').addEventListener('input', renderDiametersTable);
    document.getElementById('clearDiameterFilters').addEventListener('click', () => { document.getElementById('filterDiameterSearch').value=''; renderDiametersTable(); });

    document.getElementById('filterCartridgeDiameter').addEventListener('change', renderCartridgesTable);
    document.getElementById('clearCartridgeFilters').addEventListener('click', () => { document.getElementById('filterCartridgeDiameter').value=''; renderCartridgesTable(); });

    document.getElementById('filterBulletDiameter').addEventListener('change', async () => { await refreshComponentFilters(); renderBulletsTable(); });
    document.getElementById('filterBulletManufacturer').addEventListener('change', renderBulletsTable);
    document.getElementById('clearBulletFilters').addEventListener('click', async () => { document.getElementById('filterBulletDiameter').value=''; document.getElementById('filterBulletManufacturer').value=''; await refreshComponentFilters(); renderBulletsTable(); });

    document.getElementById('filterPowderManufacturer').addEventListener('change', renderPowdersTable);
    document.getElementById('clearPowderFilters').addEventListener('click', () => { document.getElementById('filterPowderManufacturer').value=''; renderPowdersTable(); });

    document.getElementById('filterPrimerManufacturer').addEventListener('change', renderPrimersTable);
    document.getElementById('clearPrimerFilters').addEventListener('click', () => { document.getElementById('filterPrimerManufacturer').value=''; renderPrimersTable(); });

    document.getElementById('filterBrassCartridge').addEventListener('change', async () => { await refreshComponentFilters(); renderBrassTable(); });
    document.getElementById('filterBrassManufacturer').addEventListener('change', renderBrassTable);
    document.getElementById('clearBrassFilters').addEventListener('click', async () => { document.getElementById('filterBrassCartridge').value=''; document.getElementById('filterBrassManufacturer').value=''; await refreshComponentFilters(); renderBrassTable(); });


    renderManufacturersTable();
    renderDiametersTable();
    renderCartridgesTable();
    refreshComponentUI();
}

export async function refreshComponentUI() {
    const manufacturers = await getAllItems('manufacturers');
    manufacturers.forEach(m => m.displayName = formatManufacturerName(m));
    const diameters = await getAllItems('diameters');
    const primerPockets = await getAllItems('primerPockets');
    const primerHoles = await getAllItems('primerHoles');
    
    populateSelect('bulletManufacturer', manufacturers.filter(m => m.type && m.type.includes && m.type.includes('bullet')), 'displayName', 'id');
    populateSelect('powderManufacturer', manufacturers.filter(m => m.type && m.type.includes && m.type.includes('powder')), 'displayName', 'id');
    populateSelect('primerManufacturer', manufacturers.filter(m => m.type && m.type.includes && m.type.includes('primer')), 'displayName', 'id');
    populateSelect('brassManufacturer', manufacturers.filter(m => m.type && m.type.includes && m.type.includes('brass')), 'displayName', 'id');
    populateSelect('bulletDiameter', diameters, 'imperial', 'id');
    populateSelect('cartridgeDiameter', diameters, 'imperial', 'id');
    populateSelect('primerPocket', primerPockets, 'name', 'id');
    populateSelect('brassPrimerPocket', primerPockets, 'name', 'id');
    populateSelect('brassPrimerHole', primerHoles, 'name', 'id');


    refreshBrassFormDropDowns();
    await refreshComponentFilters();
    renderBulletsTable();
    renderPowdersTable();
    renderPrimersTable();
    renderBrassTable();
}

export async function refreshComponentFilters() {
    const manufacturers = await getAllItems('manufacturers');
    manufacturers.forEach(m => m.displayName = formatManufacturerName(m));
    const diameters = await getAllItems('diameters');
    const cartridges = await getAllItems('cartridges');
    const bullets = await getAllItems('bullets');
    const powders = await getAllItems('powders');
    const primers = await getAllItems('primers');
    const brassItems = await getAllItems('brass');

    const filterCartridgeDiameter = document.getElementById('filterCartridgeDiameter');
    const availableCartridgeDiameters = new Set(cartridges.map(c => c.diameterId).filter(Boolean));
    const oldCartDia = filterCartridgeDiameter.value;
    filterCartridgeDiameter.innerHTML = '<option value="">All</option>';
    diameters.filter(d => availableCartridgeDiameters.has(d.id)).sort((a,b)=>(a.imperial || '').localeCompare(b.imperial || '')).forEach(d => {
        let opt = document.createElement('option'); opt.value = d.id; opt.textContent = d.imperial;
        filterCartridgeDiameter.appendChild(opt);
    });
    filterCartridgeDiameter.value = availableCartridgeDiameters.has(oldCartDia) ? oldCartDia : '';

    const filterBulletDiameter = document.getElementById('filterBulletDiameter');
    const filterBulletManufacturer = document.getElementById('filterBulletManufacturer');
    const oldBulDia = filterBulletDiameter.value;
    const oldBulMfg = filterBulletManufacturer.value;
    
    const availableBulletDiameters = new Set(bullets.map(b => b.diameterId).filter(Boolean));
    filterBulletDiameter.innerHTML = '<option value="">All</option>';
    diameters.filter(d => availableBulletDiameters.has(d.id)).sort((a,b)=>(a.imperial || '').localeCompare(b.imperial || '')).forEach(d => {
        let opt = document.createElement('option'); opt.value = d.id; opt.textContent = d.imperial;
        filterBulletDiameter.appendChild(opt);
    });
    filterBulletDiameter.value = availableBulletDiameters.has(oldBulDia) ? oldBulDia : '';
    
    let validBulletsForMfg = bullets;
    if (filterBulletDiameter.value) { validBulletsForMfg = validBulletsForMfg.filter(b => b.diameterId === filterBulletDiameter.value); }
    const availableBulletMfgs = new Set(validBulletsForMfg.map(b => b.manufacturerId).filter(Boolean));
    filterBulletManufacturer.innerHTML = '<option value="">All</option>';
    manufacturers.filter(m => availableBulletMfgs.has(m.id)).sort((a,b)=>(a.displayName || '').localeCompare(b.displayName || '')).forEach(m => {
        let opt = document.createElement('option'); opt.value = m.id; opt.textContent = m.displayName;
        filterBulletManufacturer.appendChild(opt);
    });
    filterBulletManufacturer.value = availableBulletMfgs.has(oldBulMfg) ? oldBulMfg : '';

    const filterPowderManufacturer = document.getElementById('filterPowderManufacturer');
    const availablePowderMfgs = new Set(powders.map(p => p.manufacturerId).filter(Boolean));
    const oldPowderMfg = filterPowderManufacturer.value;
    filterPowderManufacturer.innerHTML = '<option value="">All</option>';
    manufacturers.filter(m => availablePowderMfgs.has(m.id)).sort((a,b)=>(a.displayName || '').localeCompare(b.displayName || '')).forEach(m => {
        let opt = document.createElement('option'); opt.value = m.id; opt.textContent = m.displayName;
        filterPowderManufacturer.appendChild(opt);
    });
    filterPowderManufacturer.value = availablePowderMfgs.has(oldPowderMfg) ? oldPowderMfg : '';

    const filterPrimerManufacturer = document.getElementById('filterPrimerManufacturer');
    const availablePrimerMfgs = new Set(primers.map(p => p.manufacturerId).filter(Boolean));
    const oldPrimerMfg = filterPrimerManufacturer.value;
    filterPrimerManufacturer.innerHTML = '<option value="">All</option>';
    manufacturers.filter(m => availablePrimerMfgs.has(m.id)).sort((a,b)=>(a.displayName || '').localeCompare(b.displayName || '')).forEach(m => {
        let opt = document.createElement('option'); opt.value = m.id; opt.textContent = m.displayName;
        filterPrimerManufacturer.appendChild(opt);
    });
    filterPrimerManufacturer.value = availablePrimerMfgs.has(oldPrimerMfg) ? oldPrimerMfg : '';

    const filterBrassCartridge = document.getElementById('filterBrassCartridge');
    const filterBrassManufacturer = document.getElementById('filterBrassManufacturer');
    const oldBrassCart = filterBrassCartridge.value;
    const oldBrassMfg = filterBrassManufacturer.value;

    const availableBrassCartridges = new Set(brassItems.map(b => b.cartridgeId).filter(Boolean));
    filterBrassCartridge.innerHTML = '<option value="">All</option>';
    cartridges.filter(c => availableBrassCartridges.has(c.id)).sort((a,b)=>(a.name || '').localeCompare(b.name || '')).forEach(c => {
        let opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name;
        filterBrassCartridge.appendChild(opt);
    });
    filterBrassCartridge.value = availableBrassCartridges.has(oldBrassCart) ? oldBrassCart : '';

    let validBrassForMfg = brassItems;
    if (filterBrassCartridge.value) { validBrassForMfg = validBrassForMfg.filter(b => b.cartridgeId === filterBrassCartridge.value); }
    const availableBrassMfgs = new Set(validBrassForMfg.map(b => b.manufacturerId).filter(Boolean));
    filterBrassManufacturer.innerHTML = '<option value="">All</option>';
    manufacturers.filter(m => availableBrassMfgs.has(m.id)).sort((a,b)=>(a.displayName || '').localeCompare(b.displayName || '')).forEach(m => {
        let opt = document.createElement('option'); opt.value = m.id; opt.textContent = m.displayName;
        filterBrassManufacturer.appendChild(opt);
    });
    filterBrassManufacturer.value = availableBrassMfgs.has(oldBrassMfg) ? oldBrassMfg : '';
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
    let items = await getAllItems('manufacturers');
    const filterType = document.getElementById('filterManufacturerType').value;
    if (filterType) {
        items = items.filter(m => m.type && m.type.includes && m.type.includes(filterType));
    }
    
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    const tableBody = document.getElementById('manufacturersTableBody');
    tableBody.innerHTML = '';
    
    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 1.5rem; color: #9ca3af;">No manufacturers found.</td></tr>';
        return;
    }

    for (const item of items) {
        const row = `
            <tr>
                <td>${item.name}</td>
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
            cb.checked = item.type && item.type.includes && item.type.includes(cb.value);
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
    refreshFirearmsUI();
    refreshLoadsUI();
}

async function renderDiametersTable() {
    let items = await getAllItems('diameters');
    const filterSearch = document.getElementById('filterDiameterSearch').value.toLowerCase();
    if (filterSearch) {
        items = items.filter(d => 
            (d.imperial && String(d.imperial).toLowerCase().includes(filterSearch)) || 
            (d.metric && String(d.metric).toLowerCase().includes(filterSearch))
        );
    }
    
    items.sort((a, b) => {
        const valA = parseFloat(a.imperial) || 0;
        const valB = parseFloat(b.imperial) || 0;
        return valA - valB;
    });

    const tableBody = document.getElementById('diametersTableBody');
    tableBody.innerHTML = '';
    
    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 1.5rem; color: #9ca3af;">No diameters found.</td></tr>';
        return;
    }

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
        if (confirm('Are you sure?')) { await deleteItem('diameters', id); renderDiametersTable(); refreshComponentUI(); refreshFirearmsUI(); refreshLoadsUI(); }
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
    const [allItems, diameters] = await Promise.all([
        getAllItems('cartridges'),
        getAllItems('diameters')
    ]);
    const filterDiam = document.getElementById('filterCartridgeDiameter').value;
    let items = filterDiam ? allItems.filter(c => c.diameterId === filterDiam) : allItems;
    
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const diameterMap = new Map(diameters.map(d => [d.id, d.imperial]));
    const tableBody = document.getElementById('cartridgesTableBody');
    tableBody.innerHTML = '';
    
    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 1.5rem; color: #9ca3af;">No cartridges found.</td></tr>';
        return;
    }

    for (const item of items) {
        const diameterImperial = diameterMap.get(item.diameterId) || 'N/A';
        const row = `
            <tr>
                <td>${item.name}</td>
                <td>${diameterImperial}</td>
                <td>${item.oal || ''}</td>
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
        document.getElementById('cartridgeMinCaseLength').value = item.minCaseLength || '';
        document.getElementById('cartridgeMaxCaseLength').value = item.maxCaseLength;
        document.getElementById('cartridgeTrimLength').value = item.trimLength;
    }
}


async function handleBulletSubmit(e) {
    e.preventDefault();
    const bullet = {
        id: document.getElementById('bulletId').value || generateUniqueId(),
        manufacturerId: document.getElementById('bulletManufacturer').value,
        diameterId: document.getElementById('bulletDiameter').value,
        name: document.getElementById('bulletName').value,
        weight: parseFloat(document.getElementById('bulletWeight').value),
        length: parseFloat(document.getElementById('bulletLength').value),
        drag_model: document.getElementById('bulletDragModel').value || null,
        stability_vars: {
            ix: parseFloat(document.getElementById('bulletIx').value) || null,
            iy: parseFloat(document.getElementById('bulletIy').value) || null,
            cg_from_base: parseFloat(document.getElementById('bulletCgFromBase').value) || null,
            meplat_diameter: parseFloat(document.getElementById('bulletMeplat').value) || null,
            is_tipped: document.getElementById('bulletIsTipped').checked,
            tip_length: parseFloat(document.getElementById('bulletTipLength').value) || null
        },
        ballistics: {
            preferred_model: document.getElementById('bulletPreferredModel').value,
            g1_bc: parseFloat(document.getElementById('bulletG1BC').value) || null,
            g7_bc: parseFloat(document.getElementById('bulletG7BC').value) || null,
            g7_form_factor: parseFloat(document.getElementById('bulletG7FormFactor').value) || null,
            bc_velocity_bands: []
        }
    };
    await updateItem('bullets', bullet);
    e.target.reset();
    renderBulletsTable();
    refreshLoadsUI();
}

async function renderBulletsTable() {
    const [allBullets, manufacturers, diameters] = await Promise.all([
        getAllItems('bullets'),
        getAllItems('manufacturers'),
        getAllItems('diameters')
    ]);

    const filterDia = document.getElementById('filterBulletDiameter').value;
    const filterMfg = document.getElementById('filterBulletManufacturer').value;

    let bullets = allBullets;
    if (filterDia) bullets = bullets.filter(b => b.diameterId === filterDia);
    if (filterMfg) bullets = bullets.filter(b => b.manufacturerId === filterMfg);

    bullets.sort((a, b) => {
        const weightA = a.weight || 0;
        const weightB = b.weight || 0;
        if (weightA !== weightB) return weightA - weightB;
        
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
    });

    const manufacturerMap = new Map(manufacturers.map(m => [m.id, formatManufacturerName(m)]));
    const diameterMap = new Map(diameters.map(d => [d.id, d.imperial]));

    const tableBody = document.getElementById('bulletsTableBody');
    tableBody.innerHTML = '';
    
    if (bullets.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 1.5rem; color: #9ca3af;">No bullets found.</td></tr>';
        return;
    }

    for (const bullet of bullets) {
        const manufacturerName = manufacturerMap.get(bullet.manufacturerId) || 'N/A';
        const diameterImperial = diameterMap.get(bullet.diameterId) || 'N/A';
        const prefModel = (bullet.ballistics && bullet.ballistics.preferred_model) ? bullet.ballistics.preferred_model : '-';
        const g1 = (bullet.ballistics && bullet.ballistics.g1_bc) ? bullet.ballistics.g1_bc : '-';
        const g7 = (bullet.ballistics && bullet.ballistics.g7_bc) ? bullet.ballistics.g7_bc : '-';
        
        const row = `
            <tr>
                <td>${bullet.name}</td>
                <td>${manufacturerName}</td>
                <td>${diameterImperial}</td>
                <td>${bullet.weight} gr</td>
                <td>${prefModel}</td>
                <td>${g1}</td>
                <td>${g7}</td>
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

        // Populate new fields
        document.getElementById('bulletDragModel').value = bullet.drag_model || '';
        
        if (bullet.stability_vars) {
            document.getElementById('bulletIx').value = bullet.stability_vars.ix || '';
            document.getElementById('bulletIy').value = bullet.stability_vars.iy || '';
            document.getElementById('bulletCgFromBase').value = bullet.stability_vars.cg_from_base || '';
            document.getElementById('bulletMeplat').value = bullet.stability_vars.meplat_diameter || '';
            document.getElementById('bulletIsTipped').checked = bullet.stability_vars.is_tipped || false;
            document.getElementById('bulletTipLength').value = bullet.stability_vars.tip_length || '';
        } else {
            document.getElementById('bulletIx').value = '';
            document.getElementById('bulletIy').value = '';
            document.getElementById('bulletCgFromBase').value = '';
            document.getElementById('bulletMeplat').value = '';
            document.getElementById('bulletIsTipped').checked = false;
            document.getElementById('bulletTipLength').value = '';
        }

        if (bullet.ballistics) {
            document.getElementById('bulletPreferredModel').value = bullet.ballistics.preferred_model || 'G7';
            document.getElementById('bulletG1BC').value = bullet.ballistics.g1_bc || '';
            document.getElementById('bulletG7BC').value = bullet.ballistics.g7_bc || '';
            document.getElementById('bulletG7FormFactor').value = bullet.ballistics.g7_form_factor || '';
        } else {
            document.getElementById('bulletPreferredModel').value = 'G7';
            document.getElementById('bulletG1BC').value = '';
            document.getElementById('bulletG7BC').value = '';
            document.getElementById('bulletG7FormFactor').value = '';
        }
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
    const [allPowders, manufacturers] = await Promise.all([
        getAllItems('powders'),
        getAllItems('manufacturers')
    ]);
    const filterMfg = document.getElementById('filterPowderManufacturer').value;
    let powders = filterMfg ? allPowders.filter(p => p.manufacturerId === filterMfg) : allPowders;
    
    powders.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    const manufacturerMap = new Map(manufacturers.map(m => [m.id, formatManufacturerName(m)]));
    const tableBody = document.getElementById('powdersTableBody');
    tableBody.innerHTML = '';
    
    if (powders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 1.5rem; color: #9ca3af;">No powders found.</td></tr>';
        return;
    }

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
        primerPocketId: document.getElementById('primerPocket').value,
        name: document.getElementById('primerName').value
    };
    await updateItem('primers', primer);
    e.target.reset();
    renderPrimersTable();
    refreshLoadsUI();
}

async function renderPrimersTable() {
    const [allPrimers, manufacturers, primerPockets] = await Promise.all([
        getAllItems('primers'),
        getAllItems('manufacturers'),
        getAllItems('primerPockets')
    ]);
    const filterMfg = document.getElementById('filterPrimerManufacturer').value;
    let primers = filterMfg ? allPrimers.filter(p => p.manufacturerId === filterMfg) : allPrimers;
    
    primers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    const manufacturerMap = new Map(manufacturers.map(m => [m.id, formatManufacturerName(m)]));
    const pocketMap = new Map(primerPockets.map(p => [p.id, p.name]));
    const tableBody = document.getElementById('primersTableBody');
    tableBody.innerHTML = '';
    
    if (primers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 1.5rem; color: #9ca3af;">No primers found.</td></tr>';
        return;
    }

    for (const primer of primers) {
        const manufacturerName = manufacturerMap.get(primer.manufacturerId) || 'N/A';
        const pocketName = pocketMap.get(primer.primerPocketId) || 'N/A';
        const row = `
            <tr>
                <td>${primer.name}</td>
                <td>${manufacturerName}</td>
                <td>${pocketName}</td>
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
        document.getElementById('primerPocket').value = item.primerPocketId || '';
        document.getElementById('primerName').value = item.name;
    }
}

async function handleBrassSubmit(e) {
    e.preventDefault();
    const brass = {
        id: document.getElementById('brassId').value || generateUniqueId(),
        cartridgeId: document.getElementById('brassCartridge').value,
        manufacturerId: document.getElementById('brassManufacturer').value,
        primerPocketId: document.getElementById('brassPrimerPocket').value,
        primerHoleId: document.getElementById('brassPrimerHole').value
    };
    await updateItem('brass', brass);
    e.target.reset();
    renderBrassTable();
    refreshLoadsUI();
}

async function renderBrassTable() {
    const [allBrass, manufacturers, cartridges, primerPockets, primerHoles] = await Promise.all([
        getAllItems('brass'),
        getAllItems('manufacturers'),
        getAllItems('cartridges'),
        getAllItems('primerPockets'),
        getAllItems('primerHoles')
    ]);

    const filterCart = document.getElementById('filterBrassCartridge').value;
    const filterMfg = document.getElementById('filterBrassManufacturer').value;

    let brassItems = allBrass;
    if (filterCart) brassItems = brassItems.filter(b => b.cartridgeId === filterCart);
    if (filterMfg) brassItems = brassItems.filter(b => b.manufacturerId === filterMfg);

    const cartridgeMap = new Map(cartridges.map(c => [c.id, c.name]));
    const manufacturerMap = new Map(manufacturers.map(m => [m.id, formatManufacturerName(m)]));
    const pocketMap = new Map(primerPockets.map(p => [p.id, p.name]));
    const holeMap = new Map(primerHoles.map(h => [h.id, h.name]));

    brassItems.sort((a, b) => {
        const cartA = cartridgeMap.get(a.cartridgeId) || '';
        const cartB = cartridgeMap.get(b.cartridgeId) || '';
        if (cartA !== cartB) return cartA.localeCompare(cartB);
        return (a.manufacturerId || '').localeCompare(b.manufacturerId || '');
    });

    const tableBody = document.getElementById('brassTableBody');
    tableBody.innerHTML = '';
    
    if (brassItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 1.5rem; color: #9ca3af;">No brass found.</td></tr>';
        return;
    }

    for (const brass of brassItems) {
        const manufacturerName = manufacturerMap.get(brass.manufacturerId) || 'N/A';
        const cartridgeName = cartridgeMap.get(brass.cartridgeId) || 'N/A';
        const pocketName = pocketMap.get(brass.primerPocketId) || 'N/A';
        const holeName = holeMap.get(brass.primerHoleId) || 'N/A';
        const row = `
            <tr>
                <td>${cartridgeName}</td>
                <td>${manufacturerName}</td>
                <td>${pocketName}</td>
                <td>${holeName}</td>
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
        document.getElementById('brassPrimerPocket').value = item.primerPocketId || '';
        document.getElementById('brassPrimerHole').value = item.primerHoleId || '';
    }
}
