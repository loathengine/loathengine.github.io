// js/loads.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { populateSelect, formatManufacturerName } from './utils.js';
import { refreshImpactMarkingUI } from './marking.js';

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
        option.textContent = `${manufacturer ? formatManufacturerName(manufacturer) : ''} ${bullet.name}`;
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
        
        let label = manufacturer ? formatManufacturerName(manufacturer) : 'Unknown Mfg';
        if (brassItem.primerPocketId) label += ` (${brassItem.primerPocketId})`;
        
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



async function refreshLoadFilters() {
    const allLoads = await getAllItems('loads');
    const allCartridges = await getAllItems('cartridges');
    const allBullets = await getAllItems('bullets');
    const allPowders = await getAllItems('powders');
    const allManufacturers = await getAllItems('manufacturers');

    const filterCartridgeSelect = document.getElementById('filterCartridge');
    const filterBulletSelect = document.getElementById('filterBullet');
    const filterPowderSelect = document.getElementById('filterPowder');

    const selectedCartridge = filterCartridgeSelect.value;
    const selectedBullet = filterBulletSelect.value;
    const selectedPowder = filterPowderSelect.value;

    const availableCartridgeIds = new Set(allLoads.map(l => l.cartridgeId).filter(Boolean));
    filterCartridgeSelect.innerHTML = '<option value="">All</option>';
    allCartridges.filter(c => availableCartridgeIds.has(c.id)).sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        filterCartridgeSelect.appendChild(opt);
    });
    filterCartridgeSelect.value = availableCartridgeIds.has(selectedCartridge) ? selectedCartridge : '';

    let validLoadBullets = allLoads;
    if (filterCartridgeSelect.value) {
        validLoadBullets = validLoadBullets.filter(l => l.cartridgeId === filterCartridgeSelect.value);
    }
    const availableBulletIds = new Set(validLoadBullets.map(l => l.bulletId).filter(Boolean));
    
    filterBulletSelect.innerHTML = '<option value="">All</option>';
    const filteredBullets = allBullets.filter(b => availableBulletIds.has(b.id));
    filteredBullets.sort((a, b) => {
        if (a.weight !== b.weight) return a.weight - b.weight;
        return a.name.localeCompare(b.name);
    });
    for (const bullet of filteredBullets) {
        const mfg = allManufacturers.find(m => m.id === bullet.manufacturerId);
        const opt = document.createElement('option');
        opt.value = bullet.id;
        opt.textContent = `${bullet.weight}gr ${mfg ? formatManufacturerName(mfg) : 'Unknown'} ${bullet.name}`;
        filterBulletSelect.appendChild(opt);
    }
    filterBulletSelect.value = availableBulletIds.has(selectedBullet) ? selectedBullet : '';

    let validLoadPowders = validLoadBullets;
    if (filterBulletSelect.value) {
        validLoadPowders = validLoadPowders.filter(l => l.bulletId === filterBulletSelect.value);
    }
    const availablePowderIds = new Set(validLoadPowders.map(l => l.powderId).filter(Boolean));

    filterPowderSelect.innerHTML = '<option value="">All</option>';
    allPowders.filter(p => availablePowderIds.has(p.id)).sort((a,b) => a.name.localeCompare(b.name)).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        filterPowderSelect.appendChild(opt);
    });
    filterPowderSelect.value = availablePowderIds.has(selectedPowder) ? selectedPowder : '';
}

export function initLoadsManagement() {
    document.getElementById('loadForm').addEventListener('submit', handleLoadSubmit);
    document.getElementById('loadForm').addEventListener('reset', () => {
        document.getElementById('loadId').value = '';
        setTimeout(toggleCommercialFields, 0);
    });
    
    document.getElementById('loadsTableBody').addEventListener('click', handleLoadTableClick);
    
    const isCommercialCheckbox = document.getElementById('loadIsCommercialCheckbox');
    if (isCommercialCheckbox) {
        isCommercialCheckbox.addEventListener('change', toggleCommercialFields);
    }
    
    document.getElementById('loadDiameter').addEventListener('change', async () => {
        await refreshLoadCartridgeDropdown();
        await refreshBrassDropdownForLoad();
        await refreshBulletWeightDropdown();
    });
    document.getElementById('loadCartridge').addEventListener('change', refreshBrassDropdownForLoad);
    document.getElementById('loadBulletWeight').addEventListener('change', refreshBulletNameDropdown);
    document.getElementById('loadPowderManufacturer').addEventListener('change', refreshPowderNameDropdown);

    document.getElementById('filterShowAll').addEventListener('change', renderLoadsTable);
    document.getElementById('filterShowHandloads').addEventListener('change', renderLoadsTable);
    document.getElementById('filterShowCommercial').addEventListener('change', renderLoadsTable);

    document.getElementById('filterCartridge').addEventListener('change', async () => {
        await refreshLoadFilters();
        renderLoadsTable();
    });
    document.getElementById('filterBullet').addEventListener('change', async () => {
        await refreshLoadFilters();
        renderLoadsTable();
    });
    document.getElementById('filterPowder').addEventListener('change', renderLoadsTable);
    document.getElementById('clearFilters').addEventListener('click', async () => {
        document.getElementById('filterCartridge').value = '';
        document.getElementById('filterBullet').value = '';
        document.getElementById('filterPowder').value = '';
        await refreshLoadFilters();
        renderLoadsTable();
    });

    refreshLoadsUI();
}

export async function refreshLoadsUI() {
    const allDiameters = await getAllItems('diameters');
    const allPrimers = await getAllItems('primers');
    const allManufacturers = await getAllItems('manufacturers');
    allManufacturers.forEach(m => m.displayName = formatManufacturerName(m));
    
    populateSelect('loadDiameter', allDiameters, 'imperial', 'id');
    populateSelect('loadPrimer', allPrimers, 'name', 'id');
    const powderManufacturers = allManufacturers.filter(m => m.type && m.type.includes('powder'));
    populateSelect('loadPowderManufacturer', powderManufacturers, 'displayName', 'id');
    const ammoManufacturers = allManufacturers.filter(m => m.type && m.type.includes('ammo'));
    populateSelect('loadCommercialManufacturer', ammoManufacturers, 'displayName', 'id');
    
    document.getElementById('loadCartridge').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadBulletWeight').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadBullet').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadPowder').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadBrass').innerHTML = '<option value="">-- Select --</option>';

    await refreshLoadFilters();

    renderLoadsTable();
}

function toggleCommercialFields() {
    const isCommercial = document.getElementById('loadIsCommercialCheckbox').checked;
    const commercialOnly = document.getElementById('commercialNameContainer');
    const handloadOnly = document.getElementById('handloadOnlySections');
    const chargeWeightInput = document.getElementById('loadChargeWeight');
    const commNameInput = document.getElementById('loadCommercialName');
    
    if (isCommercial) {
        commercialOnly.style.display = 'grid';
        handloadOnly.style.display = 'none';
        chargeWeightInput.removeAttribute('required');
        commNameInput.setAttribute('required', 'true');
    } else {
        commercialOnly.style.display = 'none';
        handloadOnly.style.display = 'block';
        chargeWeightInput.setAttribute('required', 'true');
        commNameInput.removeAttribute('required');
    }
}

async function handleLoadSubmit(e) {
    e.preventDefault();
    const isCommercial = document.getElementById('loadIsCommercialCheckbox').checked;
    
    const load = {
        id: document.getElementById('loadId').value || generateUniqueId(),
        loadTypeId: isCommercial ? 'LT_COMM' : 'LT_HAND',
        cartridgeId: document.getElementById('loadCartridge').value,
        diameterId: document.getElementById('loadDiameter').value,
        bulletId: document.getElementById('loadBullet').value,
        bulletLot: document.getElementById('loadBulletLot').value,
    };
    
    if (isCommercial) {
        load.manufacturerId = document.getElementById('loadCommercialManufacturer').value;
        load.name = document.getElementById('loadCommercialName').value;
        load.partNumber = document.getElementById('loadCommercialPart').value;
        load.lot = document.getElementById('loadBulletLot').value; // mapping bullet lot to general lot
    } else {
        load.name = document.getElementById('loadHandloadName').value;
        load.powderId = document.getElementById('loadPowder').value;
        load.powderLot = document.getElementById('loadPowderLot').value;
        load.chargeWeight = parseFloat(document.getElementById('loadChargeWeight').value);
        load.col = parseFloat(document.getElementById('loadCol').value);
        load.cbto = parseFloat(document.getElementById('loadCbto').value) || null;
        load.cbtoComp = document.getElementById('loadCbtoComp').value || '';
        load.shoulder = parseFloat(document.getElementById('loadShoulder').value) || null;
        load.shoulderComp = document.getElementById('loadShoulderComp').value || '';
        load.primerId = document.getElementById('loadPrimer').value;
        load.primerLot = document.getElementById('loadPrimerLot').value;
        load.brassId = document.getElementById('loadBrass').value;
        load.brassLot = document.getElementById('loadBrassLot').value;
        load.firings = parseInt(document.getElementById('loadFirings').value);
    }

    await updateItem('loads', load);
    e.target.reset(); // will also trigger timeout to restore UI state
    await refreshLoadFilters();
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

    const showAll = document.getElementById('filterShowAll').checked;
    const showHandloads = document.getElementById('filterShowHandloads').checked;
    const showCommercial = document.getElementById('filterShowCommercial').checked;

    loads = loads.filter(l => {
        if (showAll) return true;
        if (showCommercial && l.loadTypeId === 'LT_COMM') return true;
        if (showHandloads && l.loadTypeId !== 'LT_COMM') return true;
        return false;
    });

    const filterCartridge = document.getElementById('filterCartridge').value;
    const filterBullet = document.getElementById('filterBullet').value;
    const filterPowder = document.getElementById('filterPowder').value;

    if (filterCartridge) loads = loads.filter(l => l.cartridgeId === filterCartridge);
    if (filterBullet) loads = loads.filter(l => l.bulletId === filterBullet);
    if (filterPowder) loads = loads.filter(l => l.powderId === filterPowder);

    const cartridgeMap = new Map(cartridges.map(i => [i.id, i.name]));
    const manufacturerMap = new Map(manufacturers.map(i => [i.id, formatManufacturerName(i)]));
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

    loads.sort((a, b) => {
        const cartA = cartridgeMap.get(a.cartridgeId) || '';
        const cartB = cartridgeMap.get(b.cartridgeId) || '';
        if (cartA !== cartB) return cartA.localeCompare(cartB);
        
        // Secondary sort by load type then ID
        if (a.loadTypeId !== b.loadType) return (a.loadTypeId || '').localeCompare(b.loadTypeId || '');
        return Number(a.id) - Number(b.id);
    });

    if (loads.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 1.5rem; color: #9ca3af;">No loads found.</td></tr>';
        return;
    }

    for (const load of loads) {
        let type, recipeButton = '';
        let nameColumn, bulletColumn, powderColumn, chargeColumn, colColumn;
        const cartridgeName = cartridgeMap.get(load.cartridgeId) || 'N/A';

        if (load.loadTypeId === 'LT_COMM') {
            type = 'Commercial';
            const mfgName = load.manufacturerId ? (manufacturerMap.get(load.manufacturerId) || '') : '';
            
            let bulletDesc = '';
            if (load.bulletId) {
                bulletDesc = getBulletDescription(load.bulletId);
            } else if (load.bulletWeight) {
                bulletDesc = `${load.bulletWeight}gr`;
            }

            nameColumn = `<span style="display:inline-block; padding: 0.1rem 0.4rem; background-color: #374151; border-radius: 0.25rem; font-size: 0.7rem; color: #93c5fd; margin-right: 0.5rem; vertical-align: middle;">Commercial</span>${mfgName} ${load.name}`;
            bulletColumn = bulletDesc || 'N/A';

            if (load.partNumber) {
                nameColumn += ` <span style="font-size:0.8rem;color:#9ca3af;">(Part: ${load.partNumber})</span>`;
            }
            powderColumn = 'N/A';
            chargeColumn = 'N/A';
            colColumn = 'N/A';
        } else { 
            type = 'Hand Load';
            nameColumn = load.name || 'Unnamed Load';
            bulletColumn = bulletMap.get(load.bulletId) || 'N/A';
            
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

            powderColumn = powderMap.get(load.powderId) || '---';
            chargeColumn = chargeVal !== '---' ? `${chargeVal} gr` : '---';
            colColumn = `${colVal}`;
            recipeButton = `<button class="btn-indigo btn-small" data-id="${load.id}" data-action="recipe">Recipe</button>`;
        }

        const row = `
            <tr>
                <td>${nameColumn}</td>
                <td>${cartridgeName}</td>
                <td>${bulletColumn}</td>
                <td>${powderColumn}</td>
                <td>${chargeColumn}</td>
                <td>${colColumn}</td>
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
            await refreshLoadFilters();
            renderLoadsTable(); 
            refreshImpactMarkingUI();
        }
    } else if (action === 'edit') {
        const item = await getItem('loads', id);
        
        document.getElementById('loadForm').reset();
        document.getElementById('loadId').value = item.id;
        
        const isCommercial = item.loadTypeId === 'LT_COMM';
        const checkbox = document.getElementById('loadIsCommercialCheckbox');
        checkbox.checked = isCommercial;
        toggleCommercialFields();

        document.getElementById('loadDiameter').value = item.diameterId;
        await refreshLoadCartridgeDropdown();
        document.getElementById('loadCartridge').value = item.cartridgeId;
        
        const bullet = await getItem('bullets', item.bulletId);
        await refreshBulletWeightDropdown();
        if (bullet) document.getElementById('loadBulletWeight').value = bullet.weight;
        await refreshBulletNameDropdown();
        document.getElementById('loadBullet').value = item.bulletId || '';
        
        if (isCommercial) {
            document.getElementById('loadCommercialManufacturer').value = item.manufacturerId || '';
            document.getElementById('loadCommercialName').value = item.name || '';
            document.getElementById('loadCommercialPart').value = item.partNumber || '';
            document.getElementById('loadBulletLot').value = item.lot || '';
        } else {
            document.getElementById('loadHandloadName').value = item.name || '';
            document.getElementById('loadBulletLot').value = item.bulletLot || '';
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

    const bulletNameStr = bullet ? `${bulletMfg ? formatManufacturerName(bulletMfg) : ''} ${bullet.name} ${bullet.weight}gr`.trim() : '';
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
                            <div class="item"><span class="label">Manufacturer</span> <span class="value">${bulletMfg ? formatManufacturerName(bulletMfg) : ''}</span></div>
                            <div class="item"><span class="label">Name</span> <span class="value">${bullet ? bullet.name : ''}</span></div>
                            <div class="item"><span class="label">Weight</span> <span class="value">${bullet ? bullet.weight + ' gr' : ''}</span></div>
                            <div class="item"><span class="label">Lot #</span> <span class="value">${load.bulletLot || ''}</span></div>
                        </div>
                        
                        <div class="section">
                            <h3>Powder</h3>
                            <div class="item"><span class="label">Manufacturer</span> <span class="value">${powderMfg ? formatManufacturerName(powderMfg) : ''}</span></div>
                            <div class="item"><span class="label">Name</span> <span class="value">${powder ? powder.name : ''}</span></div>
                            <div class="item"><span class="label">Charge Weight</span> <span class="value">${chargeVal} ${chargeVal ? 'gr' : ''}</span></div>
                            <div class="item"><span class="label">Lot #</span> <span class="value">${load.powderLot || ''}</span></div>
                        </div>

                        <div class="section">
                            <h3>Primer & Case</h3>
                            <div class="item"><span class="label">Primer Mfg</span> <span class="value">${primerMfg ? formatManufacturerName(primerMfg) : ''}</span></div>
                            <div class="item"><span class="label">Primer Name</span> <span class="value">${primer ? primer.name : ''}</span></div>
                            <div class="item"><span class="label">Primer Lot</span> <span class="value">${load.primerLot || ''}</span></div>
                            <div class="item"><span class="label">Brass Mfg</span> <span class="value">${brassMfg ? formatManufacturerName(brassMfg) : ''}</span></div>
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
