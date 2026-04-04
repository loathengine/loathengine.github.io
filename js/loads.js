// js/loads.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { populateSelect } from './utils.js';
import { refreshImpactMarkingUI } from './marking.js';

let currentLoadTypeFilter = 'all';

async function refreshLoadCartridgeDropdown() {
    const allCartridges = await getAllItems('cartridges');
    const selectedDiameter = document.getElementById('loadDiameter').value;
    const filteredCartridges = selectedDiameter ? allCartridges.filter(c => c.diameterId === selectedDiameter) : [];
    populateSelect('loadCartridge', filteredCartridges, 'name', 'id');
}

async function refreshBulletWeightDropdown() {
    const diameterId = document.getElementById('loadDiameter').value;
    const bulletWeightSelect = document.getElementById('loadBulletWeight');
    const bulletSelect = document.getElementById('loadBullet');

    bulletWeightSelect.innerHTML = '<option value="">-- Select --</option>';
    bulletSelect.innerHTML = '<option value="">-- Select --</option>';

    if (!diameterId) return;

    const allBullets = await getAllItems('bullets');
    const filteredBullets = allBullets.filter(b => b.diameterId === diameterId);

    const weights = [...new Set(filteredBullets.map(b => b.weight))];
    weights.sort((a, b) => a - b);

    weights.forEach(weight => {
        const option = document.createElement('option');
        option.value = weight;
        option.textContent = `${weight} gr`;
        bulletWeightSelect.appendChild(option);
    });
}

async function refreshBulletNameDropdown() {
    const diameterId = document.getElementById('loadDiameter').value;
    const selectedWeight = document.getElementById('loadBulletWeight').value;
    const bulletSelect = document.getElementById('loadBullet');

    bulletSelect.innerHTML = '<option value="">-- Select --</option>';

    if (!diameterId || !selectedWeight) return;

    const allBullets = await getAllItems('bullets');
    const allManufacturers = await getAllItems('manufacturers');
    const filteredBullets = allBullets.filter(b => b.diameterId === diameterId && b.weight == selectedWeight);

    for (const bullet of filteredBullets) {
        const manufacturer = allManufacturers.find(m => m.id === bullet.manufacturerId);
        const option = document.createElement('option');
        option.value = bullet.id;
        option.textContent = `${manufacturer ? manufacturer.name : ''} ${bullet.name}`;
        bulletSelect.appendChild(option);
    }
}

async function refreshBrassDropdownForLoad() {
    const selectedCartridgeId = document.getElementById('loadCartridge').value;
    const brassSelect = document.getElementById('loadBrass');
    
    if (!selectedCartridgeId) {
         brassSelect.innerHTML = '<option value="">-- Select Cartridge First --</option>';
         return;
    }

    const allBrass = await getAllItems('brass');
    const filteredBrass = allBrass.filter(b => b.cartridgeId === selectedCartridgeId);

    const oldValue = brassSelect.value;
    brassSelect.innerHTML = '<option value="">-- Select --</option>';

    if (filteredBrass.length === 0) {
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = "-- No Brass Inventory --";
        brassSelect.appendChild(option);
    }

    for (const brassItem of filteredBrass) {
        const manufacturer = await getItem('manufacturers', brassItem.manufacturerId);
        const option = document.createElement('option');
        option.value = brassItem.id;
        
        let label = manufacturer ? manufacturer.name : 'Unknown Mfg';
        if (brassItem.primerPocket) label += ` (${brassItem.primerPocket})`;
        
        option.textContent = label;
        brassSelect.appendChild(option);
    }
    brassSelect.value = oldValue;
}

async function refreshPowderNameDropdown() {
    const manufacturerId = document.getElementById('loadPowderManufacturer').value;
    const allPowders = await getAllItems('powders');
    const powderSelect = document.getElementById('loadPowder');
    
    const filteredPowders = manufacturerId ? allPowders.filter(p => p.manufacturerId === manufacturerId) : [];
    
    const oldValue = powderSelect.value;
    powderSelect.innerHTML = '<option value="">-- Select --</option>';
    for (const powder of filteredPowders) {
        const option = document.createElement('option');
        option.value = powder.id;
        option.textContent = powder.name;
        powderSelect.appendChild(option);
    }
    powderSelect.value = oldValue;
}

async function refreshCommercialAmmoCartridgeDropdown() {
    const diameterId = document.getElementById('commercialAmmoDiameter').value;
    const allCartridges = await getAllItems('cartridges');
    const filteredCartridges = diameterId
        ? allCartridges.filter(c => c.diameterId === diameterId)
        : []; 
    populateSelect('commercialAmmoCartridge', filteredCartridges, 'name', 'id');
    
    await refreshCommercialAmmoBulletDropdown();
}

async function refreshCommercialAmmoBulletDropdown() {
    const diameterId = document.getElementById('commercialAmmoDiameter').value;
    const bulletSelect = document.getElementById('commercialAmmoBullet');
    
    bulletSelect.innerHTML = '<option value="">-- Select --</option>';
    
    if (!diameterId) return;

    const allBullets = await getAllItems('bullets');
    const allManufacturers = await getAllItems('manufacturers');
    
    const filteredBullets = allBullets.filter(b => b.diameterId === diameterId);

    filteredBullets.sort((a, b) => {
        if (a.weight !== b.weight) return a.weight - b.weight;
        return a.name.localeCompare(b.name);
    });

    for (const bullet of filteredBullets) {
        const manufacturer = allManufacturers.find(m => m.id === bullet.manufacturerId);
        const mfgName = manufacturer ? manufacturer.name : 'Unknown';
        
        const option = document.createElement('option');
        option.value = bullet.id;
        option.textContent = `${bullet.weight}gr ${mfgName} ${bullet.name}`;
        bulletSelect.appendChild(option);
    }
}

async function refreshFilterBulletDropdown() {
    const allBullets = await getAllItems('bullets');
    const allManufacturers = await getAllItems('manufacturers');
    const filterCartridgeId = document.getElementById('filterCartridge').value;
    
    let filteredBullets = allBullets;
    if (filterCartridgeId) {
        const cartridge = await getItem('cartridges', filterCartridgeId);
        if (cartridge) {
            filteredBullets = allBullets.filter(b => b.diameterId === cartridge.diameterId);
        }
    }

    const filterBulletSelect = document.getElementById('filterBullet');
    const oldBulletFilter = filterBulletSelect.value;
    filterBulletSelect.innerHTML = '<option value="">All</option>';
    
    // Sort bullets by weight then name
    filteredBullets.sort((a, b) => {
        if (a.weight !== b.weight) return a.weight - b.weight;
        return a.name.localeCompare(b.name);
    });

    for (const bullet of filteredBullets) {
        const mfg = allManufacturers.find(m => m.id === bullet.manufacturerId);
        const mfgName = mfg ? mfg.name : 'Unknown';
        const opt = document.createElement('option');
        opt.value = bullet.id;
        opt.textContent = `${bullet.weight}gr ${mfgName} ${bullet.name}`;
        filterBulletSelect.appendChild(opt);
    }
    
    filterBulletSelect.value = oldBulletFilter || '';
    if (filterBulletSelect.selectedIndex === -1) {
        filterBulletSelect.value = '';
    }
}

export function initLoadsManagement() {
    document.getElementById('loadForm').addEventListener('submit', handleLoadSubmit);
    document.getElementById('loadForm').addEventListener('reset', () => document.getElementById('loadId').value = '');
    document.getElementById('loadsTableBody').addEventListener('click', handleLoadTableClick);
    
    document.getElementById('loadDiameter').addEventListener('change', async () => {
        await refreshLoadCartridgeDropdown();
        await refreshBrassDropdownForLoad();
        await refreshBulletWeightDropdown();
    });
    document.getElementById('loadCartridge').addEventListener('change', refreshBrassDropdownForLoad);
    document.getElementById('loadBulletWeight').addEventListener('change', refreshBulletNameDropdown);
    document.getElementById('loadPowderManufacturer').addEventListener('change', refreshPowderNameDropdown);

    const subTabContainer = document.querySelector('#loads .tabs-nav');
    if(subTabContainer) {
        const subTabContents = document.querySelectorAll('#load-forms-container .tab-content');
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

                if (subTabId === 'hand-load') {
                    currentLoadTypeFilter = 'handload';
                } else if (subTabId === 'commercial-ammo') {
                    currentLoadTypeFilter = 'commercial';
                } else {
                    currentLoadTypeFilter = 'all';
                }
                
                document.getElementById('loadForm').reset();
                document.getElementById('commercialAmmoForm').reset();
                document.getElementById('loadId').value = '';
                document.getElementById('commercialAmmoId').value = '';

                renderLoadsTable();
            }
        });
        
        const activeTab = subTabContainer.querySelector('.sub-tab-link.active');
        if (activeTab) {
             const subTabId = activeTab.getAttribute('data-subtab');
             if (subTabId === 'hand-load') currentLoadTypeFilter = 'handload';
             else if (subTabId === 'commercial-ammo') currentLoadTypeFilter = 'commercial';
        }
    }

    document.getElementById('commercialAmmoForm').addEventListener('submit', handleCommercialAmmoSubmit);
    document.getElementById('commercialAmmoForm').addEventListener('reset', () => document.getElementById('commercialAmmoId').value = '');
    document.getElementById('commercialAmmoDiameter').addEventListener('change', refreshCommercialAmmoCartridgeDropdown);

    document.getElementById('filterCartridge').addEventListener('change', async () => {
        await refreshFilterBulletDropdown();
        renderLoadsTable();
    });
    document.getElementById('filterBullet').addEventListener('change', renderLoadsTable);
    document.getElementById('filterPowder').addEventListener('change', renderLoadsTable);
    document.getElementById('clearFilters').addEventListener('click', async () => {
        document.getElementById('filterCartridge').value = '';
        await refreshFilterBulletDropdown();
        document.getElementById('filterBullet').value = '';
        document.getElementById('filterPowder').value = '';
        renderLoadsTable();
    });

    refreshLoadsUI();
}

export async function refreshLoadsUI() {
    const allDiameters = await getAllItems('diameters');
    const allPrimers = await getAllItems('primers');
    const allManufacturers = await getAllItems('manufacturers');
    
    populateSelect('loadDiameter', allDiameters, 'imperial', 'id');
    populateSelect('loadPrimer', allPrimers, 'name', 'id');
    const powderManufacturers = allManufacturers.filter(m => m.type && m.type.includes('powder'));
    populateSelect('loadPowderManufacturer', powderManufacturers, 'name', 'id');
    
    document.getElementById('loadCartridge').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadBulletWeight').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadBullet').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadPowder').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadBrass').innerHTML = '<option value="">-- Select --</option>';

    populateSelect('commercialAmmoDiameter', allDiameters, 'imperial', 'id');
    await refreshCommercialAmmoCartridgeDropdown();

    const allCartridges = await getAllItems('cartridges');
    const allPowders = await getAllItems('powders');

    const filterCartridgeSelect = document.getElementById('filterCartridge');
    const oldCartridgeFilter = filterCartridgeSelect.value;
    filterCartridgeSelect.innerHTML = '<option value="">All</option>';
    allCartridges.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        filterCartridgeSelect.appendChild(opt);
    });
    filterCartridgeSelect.value = oldCartridgeFilter || '';

    const filterPowderSelect = document.getElementById('filterPowder');
    const oldPowderFilter = filterPowderSelect.value;
    filterPowderSelect.innerHTML = '<option value="">All</option>';
    allPowders.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        filterPowderSelect.appendChild(opt);
    });
    filterPowderSelect.value = oldPowderFilter || '';

    await refreshFilterBulletDropdown();

    renderLoadsTable();
}

async function handleLoadSubmit(e) {
    e.preventDefault();
    const load = {
        id: document.getElementById('loadId').value || generateUniqueId(),
        loadType: 'handload',
        cartridgeId: document.getElementById('loadCartridge').value,
        diameterId: document.getElementById('loadDiameter').value,
        bulletId: document.getElementById('loadBullet').value,
        bulletLot: document.getElementById('loadBulletLot').value,
        powderId: document.getElementById('loadPowder').value,
        powderLot: document.getElementById('loadPowderLot').value,
        chargeWeight: parseFloat(document.getElementById('loadChargeWeight').value),
        col: parseFloat(document.getElementById('loadCol').value),
        cbto: parseFloat(document.getElementById('loadCbto').value) || null,
        cbtoComp: document.getElementById('loadCbtoComp').value || '',
        shoulder: parseFloat(document.getElementById('loadShoulder').value) || null,
        shoulderComp: document.getElementById('loadShoulderComp').value || '',
        primerId: document.getElementById('loadPrimer').value,
        primerLot: document.getElementById('loadPrimerLot').value,
        brassId: document.getElementById('loadBrass').value,
        brassLot: document.getElementById('loadBrassLot').value,
        firings: parseInt(document.getElementById('loadFirings').value)
    };
    await updateItem('loads', load);
    e.target.reset();
    document.getElementById('loadId').value = ''; 
    renderLoadsTable();
    refreshImpactMarkingUI();
}

async function handleCommercialAmmoSubmit(e) {
    e.preventDefault();
    const ammo = {
        id: document.getElementById('commercialAmmoId').value || generateUniqueId(),
        loadType: 'commercial',
        name: document.getElementById('commercialAmmoName').value,
        diameterId: document.getElementById('commercialAmmoDiameter').value,
        cartridgeId: document.getElementById('commercialAmmoCartridge').value,
        bulletId: document.getElementById('commercialAmmoBullet').value,
        partNumber: document.getElementById('commercialAmmoPartNumber').value,
        lot: document.getElementById('commercialAmmoLot').value,
    };
    await updateItem('loads', ammo);
    e.target.reset();
    document.getElementById('commercialAmmoId').value = ''; 
    renderLoadsTable();
    refreshImpactMarkingUI();
}

async function renderLoadsTable() {
    let [
        loads, cartridges, bullets, powders, manufacturers
    ] = await Promise.all([
        getAllItems('loads'),
        getAllItems('cartridges'),
        getAllItems('bullets'),
        getAllItems('powders'),
        getAllItems('manufacturers')
    ]);

    if (currentLoadTypeFilter === 'handload') {
        loads = loads.filter(l => l.loadType !== 'commercial');
    } else if (currentLoadTypeFilter === 'commercial') {
        loads = loads.filter(l => l.loadType === 'commercial');
    }

    const filterCartridge = document.getElementById('filterCartridge').value;
    const filterBullet = document.getElementById('filterBullet').value;
    const filterPowder = document.getElementById('filterPowder').value;

    if (filterCartridge) loads = loads.filter(l => l.cartridgeId === filterCartridge);
    if (filterBullet) loads = loads.filter(l => l.bulletId === filterBullet);
    if (filterPowder) loads = loads.filter(l => l.powderId === filterPowder);

    const cartridgeMap = new Map(cartridges.map(i => [i.id, i.name]));
    const manufacturerMap = new Map(manufacturers.map(i => [i.id, i.name]));
    const powderMap = new Map(powders.map(i => [i.id, i.name]));
    
    const getBulletDescription = (bulletId) => {
        const bullet = bullets.find(b => b.id === bulletId);
        if (!bullet) return 'Unknown Bullet';
        const mfgName = manufacturerMap.get(bullet.manufacturerId) || '';
        return `${bullet.weight}gr ${mfgName} ${bullet.name}`;
    };

    const bulletMap = new Map(bullets.map(i => {
        const mfgName = manufacturerMap.get(i.manufacturerId) || '';
        const text = `${i.weight}gr ${mfgName} ${i.name}`;
        return [i.id, text];
    }));

    const tableBody = document.getElementById('loadsTableBody');
    tableBody.innerHTML = '';

    for (const load of loads) {
        let type, details, charge, col, recipeButton = '';
        const cartridgeName = cartridgeMap.get(load.cartridgeId) || 'N/A';

        if (load.loadType === 'commercial') {
            type = 'Commercial';
            const mfgName = load.manufacturerId ? (manufacturerMap.get(load.manufacturerId) || '') : '';
            
            let bulletDesc = '';
            if (load.bulletId) {
                bulletDesc = getBulletDescription(load.bulletId);
            } else if (load.bulletWeight) {
                bulletDesc = `${load.bulletWeight}gr`;
            }

            details = `${mfgName} ${load.name} with ${bulletDesc}`.trim();

            if (load.partNumber) {
                details += ` (Part: ${load.partNumber})`;
            }
            charge = 'N/A';
            col = 'N/A';
        } else { 
            type = 'Hand Load';
            details = bulletMap.get(load.bulletId) || 'N/A';
            
            let chargeVal = '---';
            if (Array.isArray(load.chargeWeight)) {
                chargeVal = load.chargeWeight[0] || '---';
            } else if (load.chargeWeight !== undefined) {
                 chargeVal = load.chargeWeight;
            }

            let colVal = '---';
             if (Array.isArray(load.col)) {
                colVal = load.col[0] || '---';
            } else if (load.col !== undefined) {
                 colVal = load.col;
            }

            charge = `${chargeVal} gr ${powderMap.get(load.powderId) || ''}`.trim();
            col = `${colVal}`;
            recipeButton = `<button class="btn-indigo btn-small" data-id="${load.id}" data-action="recipe">Recipe</button>`;
        }

        const row = `
            <tr>
                <td>${cartridgeName}</td>
                <td>${details}</td>
                <td>${charge}</td>
                <td>${col}</td>
                <td>
                    <div class="flex-container">
                        ${recipeButton}
                        <button class="btn-yellow btn-small" data-id="${load.id}" data-action="edit">Edit</button>
                        <button class="btn-red btn-small" data-id="${load.id}" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

async function handleLoadTableClick(e) {
    const { id, action } = e.target.dataset;
    if (!id || !action) return;

    if (action === 'delete') {
        if (confirm('Are you sure?')) { 
            await deleteItem('loads', id); 
            renderLoadsTable(); 
            refreshImpactMarkingUI();
        }
    } else if (action === 'edit') {
        const item = await getItem('loads', id);
        
        const subTabContainer = document.querySelector('#loads .tabs-nav');
        const subTabContents = document.querySelectorAll('#load-forms-container .tab-content');
        const targetTab = item.loadType === 'commercial' ? 'commercial-ammo' : 'hand-load';
        
        subTabContainer.querySelectorAll('.sub-tab-link').forEach(l => {
            l.classList.toggle('active', l.dataset.subtab === targetTab);
        });
        subTabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${targetTab}-subtab`);
        });

        if (item.loadType === 'commercial') {
            currentLoadTypeFilter = 'commercial';
        } else {
            currentLoadTypeFilter = 'handload';
        }
        renderLoadsTable();

        if (item.loadType === 'commercial') {
            document.getElementById('commercialAmmoId').value = item.id;
            document.getElementById('commercialAmmoName').value = item.name;
            document.getElementById('commercialAmmoDiameter').value = item.diameterId;
            await refreshCommercialAmmoCartridgeDropdown();
            document.getElementById('commercialAmmoCartridge').value = item.cartridgeId;
            document.getElementById('commercialAmmoBullet').value = item.bulletId;
            document.getElementById('commercialAmmoPartNumber').value = item.partNumber || '';
            document.getElementById('commercialAmmoLot').value = item.lot;
        } else {
            document.getElementById('loadForm').reset();
            document.getElementById('loadId').value = item.id;
            document.getElementById('loadDiameter').value = item.diameterId;
            await refreshLoadCartridgeDropdown();
            document.getElementById('loadCartridge').value = item.cartridgeId;
            const bullet = await getItem('bullets', item.bulletId);
            await refreshBulletWeightDropdown();
            if (bullet) document.getElementById('loadBulletWeight').value = bullet.weight;
            await refreshBulletNameDropdown();
            document.getElementById('loadBullet').value = item.bulletId;
            document.getElementById('loadBulletLot').value = item.bulletLot;
            const powder = await getItem('powders', item.powderId);
            if (powder) document.getElementById('loadPowderManufacturer').value = powder.manufacturerId;
            await refreshPowderNameDropdown();
            document.getElementById('loadPowder').value = item.powderId;
            document.getElementById('loadPowderLot').value = item.powderLot;
            
            if (Array.isArray(item.chargeWeight)) document.getElementById('loadChargeWeight').value = item.chargeWeight[0] || '';
            else document.getElementById('loadChargeWeight').value = item.chargeWeight;
            
            document.getElementById('loadPrimer').value = item.primerId;
            document.getElementById('loadPrimerLot').value = item.primerLot;
            
            if (Array.isArray(item.col)) document.getElementById('loadCol').value = item.col[0] || '';
            else document.getElementById('loadCol').value = item.col;

            document.getElementById('loadCbto').value = item.cbto || '';
            document.getElementById('loadCbtoComp').value = item.cbtoComp || '';
            document.getElementById('loadShoulder').value = item.shoulder || '';
            document.getElementById('loadShoulderComp').value = item.shoulderComp || '';

            await refreshBrassDropdownForLoad();
            document.getElementById('loadBrass').value = item.brassId;
            document.getElementById('loadBrassLot').value = item.brassLot;
            document.getElementById('loadFirings').value = item.firings;
        }
    } else if (action === 'recipe') {
        await generateRecipeSheet(id);
    }
}

async function generateRecipeSheet(loadId) {
    const load = await getItem('loads', loadId);
    if (!load) return alert('Load not found.');

    const [cartridge, bullet, powder, primer, brass] = await Promise.all([
        getItem('cartridges', load.cartridgeId),
        getItem('bullets', load.bulletId),
        getItem('powders', load.powderId),
        getItem('primers', load.primerId),
        getItem('brass', load.brassId)
    ]);
    
    const bulletMfg = bullet ? await getItem('manufacturers', bullet.manufacturerId) : null;
    const powderMfg = powder ? await getItem('manufacturers', powder.manufacturerId) : null;
    const primerMfg = primer ? await getItem('manufacturers', primer.manufacturerId) : null;
    const brassMfg = brass ? await getItem('manufacturers', brass.manufacturerId) : null;

    const bulletNameStr = bullet ? `${bulletMfg ? bulletMfg.name : ''} ${bullet.name} ${bullet.weight}gr`.trim() : '';
    const date = new Date().toLocaleDateString();
    const recipeTitle = `${cartridge ? cartridge.name : ''} - ${bulletNameStr} - ${date}`;

    let chargeVal = '';
    if (Array.isArray(load.chargeWeight)) { chargeVal = load.chargeWeight[0] || ''; } 
    else if (load.chargeWeight !== undefined) { chargeVal = load.chargeWeight; }
    
    let colVal = '';
    if (Array.isArray(load.col)) { colVal = load.col[0] || ''; } 
    else if (load.col !== undefined) { colVal = load.col; }

    const formatVal = (val, precision = 3) => {
        if (val === null || val === undefined || val === '') return '';
        if (typeof val === 'number') return val.toFixed(precision);
        return val;
    };

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${recipeTitle}</title>
            <style>
                body { font-family: 'Inter', -apple-system, sans-serif; padding: 1.5rem; color: #111827; line-height: 1.4; background: #fff; }
                .sheet { max-width: 8.5in; margin: 0 auto; border: 1px solid #e5e7eb; padding: 2rem; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #111827; padding-bottom: 0.75rem; margin-bottom: 2rem; }
                h1 { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: -0.025em; }
                .date-label { font-size: 0.875rem; font-weight: 600; color: #6b7280; }
                
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
                .section { margin-bottom: 2rem; }
                .section h3 { font-size: 1rem; font-weight: 700; color: #111827; text-transform: uppercase; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 0.25rem; margin-bottom: 0.75rem; background: transparent; }
                
                .item { margin-bottom: 0.4rem; display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.2rem; }
                .label { font-weight: 600; font-size: 0.8125rem; color: #4b5563; }
                .value { font-weight: 700; font-size: 0.9375rem; color: #111827; font-family: 'JetBrains Mono', 'Courier New', monospace; }
                
                .notes-container { margin-top: 1.5rem; }
                .notes-box { border: 1px solid #d1d5db; border-radius: 0.375rem; height: 180px; background-image: repeating-linear-gradient(white, white 24px, #f3f4f6 25px); line-height: 25px; padding: 0 0.5rem; }
                
                .footer { margin-top: 3rem; pt-1rem; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #9ca3af; text-align: center; font-style: italic; }

                @media print {
                    body { padding: 0; background: #fff; }
                    .sheet { border: none; box-shadow: none; width: 100%; max-width: none; }
                    .btn-print { display: none; }
                }
                .btn-print {
                    position: fixed; top: 1.5rem; right: 1.5rem; background-color: #2563eb; color: white; border: none; padding: 0.625rem 1.25rem; 
                    border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .btn-print:hover { background-color: #1d4ed8; }
            </style>
        </head>
        <body>
            <button class="btn-print" onclick="window.print()">Print Sheet</button>
            <div class="sheet">
                <header>
                    <h1>${recipeTitle.split(' - ').slice(0, 2).join(' - ')}</h1>
                    <div class="date-label">Generated: ${date}</div>
                </header>
                
                <div class="grid">
                    <div>
                        <div class="section">
                            <h3>Projectile</h3>
                            <div class="item"><span class="label">Manufacturer</span> <span class="value">${bulletMfg ? bulletMfg.name : ''}</span></div>
                            <div class="item"><span class="label">Name</span> <span class="value">${bullet ? bullet.name : ''}</span></div>
                            <div class="item"><span class="label">Weight</span> <span class="value">${bullet ? bullet.weight + ' gr' : ''}</span></div>
                            <div class="item"><span class="label">Lot #</span> <span class="value">${load.bulletLot || ''}</span></div>
                        </div>
                        
                        <div class="section">
                            <h3>Powder</h3>
                            <div class="item"><span class="label">Manufacturer</span> <span class="value">${powderMfg ? powderMfg.name : ''}</span></div>
                            <div class="item"><span class="label">Name</span> <span class="value">${powder ? powder.name : ''}</span></div>
                            <div class="item"><span class="label">Charge Weight</span> <span class="value">${chargeVal} ${chargeVal ? 'gr' : ''}</span></div>
                            <div class="item"><span class="label">Lot #</span> <span class="value">${load.powderLot || ''}</span></div>
                        </div>

                        <div class="section">
                            <h3>Primer & Case</h3>
                            <div class="item"><span class="label">Primer Mfg</span> <span class="value">${primerMfg ? primerMfg.name : ''}</span></div>
                            <div class="item"><span class="label">Primer Name</span> <span class="value">${primer ? primer.name : ''}</span></div>
                            <div class="item"><span class="label">Primer Lot</span> <span class="value">${load.primerLot || ''}</span></div>
                            <div class="item"><span class="label">Brass Mfg</span> <span class="value">${brassMfg ? brassMfg.name : ''}</span></div>
                            <div class="item"><span class="label">Brass Lot</span> <span class="value">${load.brassLot || ''}</span></div>
                            <div class="item"><span class="label"># of Firings</span> <span class="value">${load.firings || ''}</span></div>
                        </div>
                    </div>

                    <div>
                        <div class="section">
                            <h3>Dimensions & Specs</h3>
                            <div class="item"><span class="label">C.O.A.L.</span> <span class="value">${colVal}${colVal ? '"' : ''}</span></div>
                            <div class="item"><span class="label">CBTO</span> <span class="value">${formatVal(load.cbto)}${load.cbto ? '"' : ''}</span></div>
                            <div class="item"><span class="label">CBTO Comparator</span> <span class="value">${load.cbtoComp || ''}</span></div>
                            <div class="item"><span class="label">Shoulder Position</span> <span class="value">${formatVal(load.shoulder)}${load.shoulder ? '"' : ''}</span></div>
                            <div class="item"><span class="label">Shoulder Comparator</span> <span class="value">${load.shoulderComp || ''}</span></div>
                            <div class="item" style="margin-top: 0.5rem;"><span class="label">Min Case Length</span> <span class="value">${formatVal(cartridge?.minCaseLength)}${cartridge?.minCaseLength ? '"' : ''}</span></div>
                            <div class="item"><span class="label">Max Case Length</span> <span class="value">${formatVal(cartridge?.maxCaseLength)}${cartridge?.maxCaseLength ? '"' : ''}</span></div>
                            <div class="item"><span class="label">Trim Length</span> <span class="value">${formatVal(cartridge?.trimLength)}${cartridge?.trimLength ? '"' : ''}</span></div>
                        </div>

                        <div class="section notes-container">
                            <h3>Range / Performance Notes</h3>
                            <div class="notes-box"></div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    Empirical Precision - Data-Driven Ballistics Management
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
