// js/firearms.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { populateSelect } from './utils.js';
import { refreshImpactMarkingUI } from './marking.js';

async function refreshFirearmCartridgeDropdown() {
    const diameterId = document.getElementById('firearmDiameter').value;
    const allCartridges = await getAllItems('cartridges');
    const filteredCartridges = diameterId
        ? allCartridges.filter(c => c.diameterId === diameterId)
        : []; 
    populateSelect('firearmCartridge', filteredCartridges, 'name', 'id');
}

export function initFirearmsManagement() {
    document.getElementById('firearmForm').addEventListener('submit', handleFirearmSubmit);
    document.getElementById('firearmForm').addEventListener('reset', () => {
        document.getElementById('firearmId').value = '';
        setTimeout(refreshFirearmsUI, 0);
    });
    document.getElementById('firearmsTableBody').addEventListener('click', handleFirearmTableClick);
    document.getElementById('firearmDiameter').addEventListener('change', refreshFirearmCartridgeDropdown);
    
    document.getElementById('filterFirearmsCartridge').addEventListener('change', renderFirearmsTable);
    document.getElementById('clearFirearmsFilters').addEventListener('click', () => {
        document.getElementById('filterFirearmsCartridge').value = '';
        renderFirearmsTable();
    });

    refreshFirearmsUI();
}

export async function refreshFirearmsUI() {
    const diameters = await getAllItems('diameters');
    populateSelect('firearmDiameter', diameters, 'imperial', 'id');
    await refreshFirearmCartridgeDropdown(); 
    await refreshFirearmFilters();
    renderFirearmsTable();
}

async function refreshFirearmFilters() {
    const firearms = await getAllItems('firearms');
    const allCartridges = await getAllItems('cartridges');
    
    const filterCartridge = document.getElementById('filterFirearmsCartridge');
    const selectedCartridge = filterCartridge.value;
    
    const availableCartridges = new Set(firearms.map(f => f.cartridgeId).filter(Boolean));
    filterCartridge.innerHTML = '<option value="">All</option>';
    allCartridges.filter(c => availableCartridges.has(c.id)).sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        filterCartridge.appendChild(opt);
    });
    filterCartridge.value = availableCartridges.has(selectedCartridge) ? selectedCartridge : '';
}

async function handleFirearmSubmit(e) {
    e.preventDefault();
    const firearm = {
        id: document.getElementById('firearmId').value || generateUniqueId(),
        nickname: document.getElementById('firearmNickname').value,
        diameterId: document.getElementById('firearmDiameter').value,
        cartridgeId: document.getElementById('firearmCartridge').value,
        barrelLength: parseFloat(document.getElementById('firearmBarrelLength').value),
        twistRate: document.getElementById('firearmTwistRate').value,
        magCoal: parseFloat(document.getElementById('firearmMagCoal').value)
    };
    await updateItem('firearms', firearm);
    e.target.reset();
    await refreshFirearmFilters();
    renderFirearmsTable();
    refreshImpactMarkingUI(); 
}

async function renderFirearmsTable() {
    const [firearms, cartridges] = await Promise.all([
        getAllItems('firearms'),
        getAllItems('cartridges')
    ]);
    const cartridgeMap = new Map(cartridges.map(c => [c.id, c.name]));
    const filterCartridgeId = document.getElementById('filterFirearmsCartridge').value;
    let filteredFirearms = filterCartridgeId ? firearms.filter(f => f.cartridgeId === filterCartridgeId) : firearms;
    
    filteredFirearms.sort((a, b) => {
        const cartA = cartridgeMap.get(a.cartridgeId) || '';
        const cartB = cartridgeMap.get(b.cartridgeId) || '';
        if (cartA !== cartB) return cartA.localeCompare(cartB);
        return (a.nickname || '').localeCompare(b.nickname || '');
    });

    const tableBody = document.getElementById('firearmsTableBody');
    tableBody.innerHTML = '';
    
    if (filteredFirearms.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 1.5rem; color: #9ca3af;">No firearms found.</td></tr>';
        return;
    }

    for (const firearm of filteredFirearms) {
        const cartridgeName = cartridgeMap.get(firearm.cartridgeId) || 'N/A';
        const row = `
            <tr>
                <td>${firearm.nickname}</td>
                <td>${cartridgeName}</td>
                <td>${firearm.barrelLength || ''}"</td>
                <td>${firearm.twistRate || ''}</td>
                <td>
                    <div class="flex-container">
                        <button class="btn-yellow btn-small" data-id="${firearm.id}" data-action="edit">Edit</button>
                        <button class="btn-red btn-small" data-id="${firearm.id}" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

async function handleFirearmTableClick(e) {
    const { id, action } = e.target.dataset;
    if (!id || !action) return;
    if (action === 'delete') {
        if (confirm('Are you sure?')) { 
            await deleteItem('firearms', id); 
            await refreshFirearmFilters();
            renderFirearmsTable(); 
            refreshImpactMarkingUI(); 
        }
    } else if (action === 'edit') {
        const item = await getItem('firearms', id);
        if (!item) return;

        document.getElementById('firearmId').value = item.id;
        document.getElementById('firearmNickname').value = item.nickname;
        
        // Populate diameter and wait for it to be set
        document.getElementById('firearmDiameter').value = item.diameterId;
        
        // Trigger cartridge dropdown refresh based on the selected diameter
        await refreshFirearmCartridgeDropdown();
        
        // Set cartridge value AFTER the dropdown options have been repopulated
        document.getElementById('firearmCartridge').value = item.cartridgeId;
        
        document.getElementById('firearmBarrelLength').value = item.barrelLength;
        document.getElementById('firearmTwistRate').value = item.twistRate;
        document.getElementById('firearmMagCoal').value = item.magCoal;
    }
}
