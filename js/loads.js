// js/loads.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { populateSelect } from './utils.js';
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
        option.textContent = `${manufacturer ? manufacturer.name : ''} ${bullet.name}`;
        bulletSelect.appendChild(option);
    }
}

async function refreshBrassDropdownForLoad() {
    const selectedCartridgeId = document.getElementById('loadCartridge').value;
    const allBrass = await getAllItems('brass');
    const brassSelect = document.getElementById('loadBrass');
    
    const filteredBrass = selectedCartridgeId ? allBrass.filter(b => b.cartridgeId === selectedCartridgeId) : [];

    const oldValue = brassSelect.value;
    brassSelect.innerHTML = '<option value="">-- Select --</option>';
    for (const brassItem of filteredBrass) {
        const manufacturer = await getItem('manufacturers', brassItem.manufacturerId);
        const option = document.createElement('option');
        option.value = brassItem.id;
        option.textContent = manufacturer ? manufacturer.name : 'N/A';
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
                document.getElementById('loadForm').reset();
                document.getElementById('commercialAmmoForm').reset();
                document.getElementById('loadId').value = '';
                document.getElementById('commercialAmmoId').value = '';
            }
        });
    }

    document.getElementById('commercialAmmoForm').addEventListener('submit', handleCommercialAmmoSubmit);
    document.getElementById('commercialAmmoForm').addEventListener('reset', () => document.getElementById('commercialAmmoId').value = '');
    document.getElementById('commercialAmmoDiameter').addEventListener('change', refreshCommercialAmmoCartridgeDropdown);

    refreshLoadsUI();
}

export async function refreshLoadsUI() {
    const allDiameters = await getAllItems('diameters');
    const allPrimers = await getAllItems('primers');
    const allManufacturers = await getAllItems('manufacturers');
    
    // Handload Form: Populate only the non-dependent dropdowns
    populateSelect('loadDiameter', allDiameters, 'imperial', 'id');
    populateSelect('loadPrimer', allPrimers, 'name', 'id');
    const powderManufacturers = allManufacturers.filter(m => m.type && m.type.includes('powder'));
    populateSelect('loadPowderManufacturer', powderManufacturers, 'name', 'id');
    
    // Clear dependent dropdowns to ensure a fresh start
    document.getElementById('loadCartridge').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadBulletWeight').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadBullet').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadPowder').innerHTML = '<option value="">-- Select --</option>';
    document.getElementById('loadBrass').innerHTML = '<option value="">-- Select --</option>';

    // Commercial Ammo Form
    populateSelect('commercialAmmoManufacturer', allManufacturers, 'name', 'id');
    populateSelect('commercialAmmoDiameter', allDiameters, 'imperial', 'id');
    await refreshCommercialAmmoCartridgeDropdown();

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
        cbto: parseFloat(document.getElementById('loadCbto').value),
        primerId: document.getElementById('loadPrimer').value,
        primerLot: document.getElementById('loadPrimerLot').value,
        brassId: document.getElementById('loadBrass').value,
        brassLot: document.getElementById('loadBrassLot').value,
        firings: parseInt(document.getElementById('loadFirings').value)
    };
    await updateItem('loads', load);
    e.target.reset();
    renderLoadsTable();
    refreshImpactMarkingUI();
}

async function handleCommercialAmmoSubmit(e) {
    e.preventDefault();
    const ammo = {
        id: document.getElementById('commercialAmmoId').value || generateUniqueId(),
        loadType: 'commercial',
        manufacturerId: document.getElementById('commercialAmmoManufacturer').value,
        name: document.getElementById('commercialAmmoName').value,
        diameterId: document.getElementById('commercialAmmoDiameter').value,
        cartridgeId: document.getElementById('commercialAmmoCartridge').value,
        bulletWeight: parseFloat(document.getElementById('commercialAmmoBulletWeight').value),
        lot: document.getElementById('commercialAmmoLot').value,
    };
    await updateItem('loads', ammo);
    e.target.reset();
    renderLoadsTable();
    refreshImpactMarkingUI();
}

async function renderLoadsTable() {
    const [
        loads, cartridges, bullets, powders, manufacturers
    ] = await Promise.all([
        getAllItems('loads'),
        getAllItems('cartridges'),
        getAllItems('bullets'),
        getAllItems('powders'),
        getAllItems('manufacturers')
    ]);

    const cartridgeMap = new Map(cartridges.map(i => [i.id, i.name]));
    const manufacturerMap = new Map(manufacturers.map(i => [i.id, i.name]));
    const powderMap = new Map(powders.map(i => [i.id, i.name]));
    
    const bulletMap = new Map(bullets.map(i => {
        const mfgName = manufacturerMap.get(i.manufacturerId) || '';
        const text = `${i.weight}gr ${mfgName} ${i.name}`;
        return [i.id, text];
    }));

    const tableBody = document.getElementById('loadsTableBody');
    tableBody.innerHTML = '';

    for (const load of loads) {
        let type, details, charge, colCbto, recipeButton = '';
        const cartridgeName = cartridgeMap.get(load.cartridgeId) || 'N/A';

        if (load.loadType === 'commercial') {
            type = 'Commercial';
            const mfgName = manufacturerMap.get(load.manufacturerId) || '';
            details = `${mfgName} ${load.name} ${load.bulletWeight || ''}gr`.trim();
            charge = 'N/A';
            colCbto = 'N/A';
        } else { // Handload or legacy data
            type = 'Hand Load';
            details = bulletMap.get(load.bulletId) || 'N/A';
            charge = `${load.chargeWeight || ''} gr ${powderMap.get(load.powderId) || ''}`.trim();
            colCbto = `${load.col ? load.col.toFixed(3) : '---'} / ${load.cbto ? load.cbto.toFixed(3) : '---'}`;
            recipeButton = `<button class="btn-indigo btn-small" data-id="${load.id}" data-action="recipe">Recipe</button>`;
        }

        const row = `
            <tr>
                <td>${type}</td>
                <td>${cartridgeName}</td>
                <td>${details}</td>
                <td>${charge}</td>
                <td>${colCbto}</td>
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
            document.getElementById('commercialAmmoId').value = item.id;
            document.getElementById('commercialAmmoManufacturer').value = item.manufacturerId;
            document.getElementById('commercialAmmoName').value = item.name;
            document.getElementById('commercialAmmoDiameter').value = item.diameterId;
            await refreshCommercialAmmoCartridgeDropdown();
            document.getElementById('commercialAmmoCartridge').value = item.cartridgeId;
            document.getElementById('commercialAmmoBulletWeight').value = item.bulletWeight;
            document.getElementById('commercialAmmoLot').value = item.lot;
        } else {
            document.getElementById('loadForm').reset();
            document.getElementById('loadId').value = item.id;
            
            document.getElementById('loadDiameter').value = item.diameterId;
            await refreshLoadCartridgeDropdown();
            document.getElementById('loadCartridge').value = item.cartridgeId;
            
            const bullet = await getItem('bullets', item.bulletId);
            await refreshBulletWeightDropdown();
            if (bullet) {
                document.getElementById('loadBulletWeight').value = bullet.weight;
            }

            await refreshBulletNameDropdown();
            document.getElementById('loadBullet').value = item.bulletId;
            document.getElementById('loadBulletLot').value = item.bulletLot;
            
            const powder = await getItem('powders', item.powderId);
            if (powder) {
                document.getElementById('loadPowderManufacturer').value = powder.manufacturerId;
            }
            await refreshPowderNameDropdown();
            document.getElementById('loadPowder').value = item.powderId;
            document.getElementById('loadPowderLot').value = item.powderLot;
            document.getElementById('loadChargeWeight').value = item.chargeWeight;
            
            document.getElementById('loadPrimer').value = item.primerId;
            document.getElementById('loadPrimerLot').value = item.primerLot;
            document.getElementById('loadCol').value = item.col;
            document.getElementById('loadCbto').value = item.cbto;

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

    const [cartridge, bullet, powder, primer, brass, mfg] = await Promise.all([
        getItem('cartridges', load.cartridgeId),
        getItem('bullets', load.bulletId),
        getItem('powders', load.powderId),
        getItem('primers', load.primerId),
        getItem('brass', load.brassId),
        getItem('manufacturers', load.manufacturerId)
    ]);
    
    // Resolve manufacturer names
    const bulletMfg = bullet ? await getItem('manufacturers', bullet.manufacturerId) : null;
    const powderMfg = powder ? await getItem('manufacturers', powder.manufacturerId) : null;
    const primerMfg = primer ? await getItem('manufacturers', primer.manufacturerId) : null;
    const brassMfg = brass ? await getItem('manufacturers', brass.manufacturerId) : null;

    const recipeTitle = `Reloading Recipe: ${cartridge ? cartridge.name : 'Unknown Cartridge'}`;
    const date = new Date().toLocaleDateString();

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${recipeTitle}</title>
            <style>
                body { font-family: 'Inter', sans-serif; padding: 2rem; color: #1f2937; line-height: 1.5; }
                h1 { border-bottom: 2px solid #374151; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .section { margin-bottom: 2rem; }
                .section h3 { background-color: #f3f4f6; padding: 0.5rem; border-radius: 0.25rem; margin-bottom: 0.5rem; }
                .item { margin-bottom: 0.5rem; display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding-bottom: 0.25rem; }
                .label { font-weight: 600; color: #4b5563; }
                .value { font-weight: 500; }
                .notes { border: 1px solid #d1d5db; padding: 1rem; height: 150px; border-radius: 0.5rem; margin-top: 1rem; }
                @media print {
                    body { padding: 0; }
                    .btn-print { display: none; }
                }
                .btn-print {
                    background-color: #2563eb; color: white; border: none; padding: 0.5rem 1rem; 
                    border-radius: 0.25rem; cursor: pointer; font-size: 1rem; margin-bottom: 2rem;
                }
            </style>
        </head>
        <body>
            <button class="btn-print" onclick="window.print()">Print Recipe</button>
            <h1>${recipeTitle}</h1>
            <p><strong>Date Generated:</strong> ${date}</p>
            
            <div class="grid">
                <div>
                    <div class="section">
                        <h3>Projectile</h3>
                        <div class="item"><span class="label">Manufacturer:</span> <span class="value">${bulletMfg ? bulletMfg.name : 'N/A'}</span></div>
                        <div class="item"><span class="label">Name:</span> <span class="value">${bullet ? bullet.name : 'N/A'}</span></div>
                        <div class="item"><span class="label">Weight:</span> <span class="value">${bullet ? bullet.weight + ' gr' : 'N/A'}</span></div>
                        <div class="item"><span class="label">Diameter:</span> <span class="value">${bullet ? bullet.diameterId : 'N/A'}</span></div> <!-- Ideally map ID to text -->
                        <div class="item"><span class="label">Lot #:</span> <span class="value">${load.bulletLot || 'N/A'}</span></div>
                    </div>
                    
                    <div class="section">
                        <h3>Powder</h3>
                        <div class="item"><span class="label">Manufacturer:</span> <span class="value">${powderMfg ? powderMfg.name : 'N/A'}</span></div>
                        <div class="item"><span class="label">Name:</span> <span class="value">${powder ? powder.name : 'N/A'}</span></div>
                        <div class="item"><span class="label">Charge Weight:</span> <span class="value">${load.chargeWeight} gr</span></div>
                        <div class="item"><span class="label">Lot #:</span> <span class="value">${load.powderLot || 'N/A'}</span></div>
                    </div>
                </div>

                <div>
                    <div class="section">
                        <h3>Primer & Case</h3>
                        <div class="item"><span class="label">Primer Mfg:</span> <span class="value">${primerMfg ? primerMfg.name : 'N/A'}</span></div>
                        <div class="item"><span class="label">Primer Name:</span> <span class="value">${primer ? primer.name : 'N/A'}</span></div>
                        <div class="item"><span class="label">Primer Lot:</span> <span class="value">${load.primerLot || 'N/A'}</span></div>
                        <div class="item"><span class="label">Brass Mfg:</span> <span class="value">${brassMfg ? brassMfg.name : 'N/A'}</span></div>
                        <div class="item"><span class="label">Brass Lot:</span> <span class="value">${load.brassLot || 'N/A'}</span></div>
                        <div class="item"><span class="label"># of Firings:</span> <span class="value">${load.firings || '0'}</span></div>
                    </div>

                    <div class="section">
                        <h3>Dimensions</h3>
                        <div class="item"><span class="label">C.O.L.:</span> <span class="value">${load.col ? load.col.toFixed(3) + '"' : 'N/A'}</span></div>
                        <div class="item"><span class="label">C.B.T.O.:</span> <span class="value">${load.cbto ? load.cbto.toFixed(3) + '"' : 'N/A'}</span></div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3>Notes / Performance Data</h3>
                <div class="notes">
                    <!-- Space for handwritten notes -->
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
