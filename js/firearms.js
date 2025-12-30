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

    refreshFirearmsUI();
}

export async function refreshFirearmsUI() {
    const diameters = await getAllItems('diameters');
    populateSelect('firearmDiameter', diameters, 'imperial', 'id');
    await refreshFirearmCartridgeDropdown();
    renderFirearmsTable();
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
    renderFirearmsTable();
    refreshImpactMarkingUI(); 
}

async function renderFirearmsTable() {
    const [firearms, cartridges] = await Promise.all([
        getAllItems('firearms'),
        getAllItems('cartridges')
    ]);
    const cartridgeMap = new Map(cartridges.map(c => [c.id, c.name]));
    const tableBody = document.getElementById('firearmsTableBody');
    tableBody.innerHTML = '';
    for (const firearm of firearms) {
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
            renderFirearmsTable(); 
            refreshImpactMarkingUI(); 
        }
    } else if (action === 'edit') {
        const item = await getItem('firearms', id);
        document.getElementById('firearmId').value = item.id;
        document.getElementById('firearmNickname').value = item.nickname;
        document.getElementById('firearmDiameter').value = item.diameterId;
        await refreshFirearmCartridgeDropdown();
        document.getElementById('firearmCartridge').value = item.cartridgeId;
        document.getElementById('firearmBarrelLength').value = item.barrelLength;
        document.getElementById('firearmTwistRate').value = item.twistRate;
        document.getElementById('firearmMagCoal').value = item.magCoal;
    }
}
