// js/targets.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { convertToWebP, populateSelect } from './utils.js';
import { refreshImpactMarkingUI } from './marking.js';

async function refreshTargetDropdowns() {
    const firearms = await getAllItems('firearms');
    populateSelect('targetFirearmSelect', firearms, 'nickname', 'id');

    const loads = await getAllItems('loads');
    const loadSelect = document.getElementById('targetLoadSelect');
    if (!loadSelect) return;
    
    // Save current value if any
    const currentLoadVal = loadSelect.value;
    
    loadSelect.innerHTML = '<option value="">-- Select Load --</option>';
    
    for (const load of loads) {
        const option = document.createElement('option');
        option.value = load.id;
        
        if (load.loadType === 'commercial') {
            const mfg = await getItem('manufacturers', load.manufacturerId);
            option.textContent = `${mfg ? mfg.name : ''} ${load.name} ${load.bulletWeight || ''}gr`.trim();
        } else {
            const bullet = await getItem('bullets', load.bulletId);
            const powder = await getItem('powders', load.powderId);
            let bulletName = 'Unknown Bullet';
            if (bullet) {
                const bulletMfg = await getItem('manufacturers', bullet.manufacturerId);
                bulletName = `${bullet.weight}gr ${bulletMfg ? bulletMfg.name : ''} ${bullet.name}`;
            }
            const powderName = powder ? powder.name : 'Unknown Powder';
            
            let chargeVal = '---';
            if (Array.isArray(load.chargeWeight)) {
                chargeVal = load.chargeWeight.join(', ');
            } else if (load.chargeWeight !== undefined) {
                 chargeVal = load.chargeWeight;
            }

            option.textContent = `(HL) ${bulletName} | ${powderName} ${chargeVal}gr`;
        }
        loadSelect.appendChild(option);
    }
    loadSelect.value = currentLoadVal;
}

export async function renderTargetImages() {
    const targetGallery = document.getElementById('targetGallery');
    const items = await getAllItems('targetImages');
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    targetGallery.innerHTML = '';
    if (items.length === 0) {
        targetGallery.innerHTML = '<p style="color: #9ca3af; grid-column: 1 / -1; text-align: center;">No targets uploaded yet. Use the button above to add some.</p>';
        return;
    }
    
    items.forEach(item => {
        const cardHtml = `
            <div class="card" data-id="${item.id}">
                <img src="${item.dataUrl}" alt="${item.name}" style="width: 100%; aspect-ratio: 1 / 1.4; object-fit: contain; border-radius: 0.25rem; background-color: #374151;">
                <input type="text" value="${item.name}" class="target-name-input" style="margin-top: 0.5rem; width: 100%; box-sizing: border-box;">
                <div class="flex-container" style="margin-top: 0.5rem;">
                    <button class="btn-yellow btn-small" data-action="rename">Rename</button>
                    <button class="btn-red btn-small" data-action="delete">Delete</button>
                </div>
            </div>
        `;
        targetGallery.insertAdjacentHTML('beforeend', cardHtml);
    });
}

export function initTargetsManagement() {
    const uploadInput = document.getElementById('uploadTargetImage');
    const targetGallery = document.getElementById('targetGallery');

    // Populate dropdowns on init
    refreshTargetDropdowns();
    
    // Also listen for a global refresh event if we implement one, 
    // or just call it every time the tab is shown (if tab logic supports it).
    // For now, we call it once here. The user can switch tabs to refresh.

    uploadInput.addEventListener('change', handleTargetUpload);
    targetGallery.addEventListener('click', handleGalleryClick);

    async function handleTargetUpload(e) {
        const files = e.target.files;
        const firearmId = document.getElementById('targetFirearmSelect').value;
        const loadId = document.getElementById('targetLoadSelect').value;
        const customName = document.getElementById('targetNamePrefix').value.trim();

        let firearmName = '';
        if (firearmId) {
            const firearm = await getItem('firearms', firearmId);
            if (firearm) firearmName = firearm.nickname;
        }

        let loadName = '';
        if (loadId) {
            const load = await getItem('loads', loadId);
            if (load) {
                 if (load.loadType === 'commercial') {
                    loadName = load.name;
                } else {
                    const bullet = await getItem('bullets', load.bulletId);
                    if (bullet) loadName = `${bullet.weight}gr ${bullet.name}`;
                }
            }
        }

        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const webpDataUrl = await convertToWebP(event.target.result);
                    
                    // Construct a smart name
                    let finalName = '';
                    if (customName) {
                        finalName = customName;
                    } else {
                         // Fallback to filename if no custom name
                        finalName = file.name.replace(/\.[^/.]+$/, "");
                    }

                    // Append firearm and load info if available and not already part of the name
                    const parts = [];
                    if (finalName) parts.push(finalName);
                    if (firearmName) parts.push(firearmName);
                    if (loadName) parts.push(loadName);
                    
                    // If multiple files are selected, we might want to append an index or timestamp to avoid collisions if the base name is identical
                    // But for now, we'll just trust the user or let them rename later. 
                    // To be safe, we can append a short timestamp segment.
                    if (files.length > 1) {
                         parts.push(Math.floor(Math.random() * 1000));
                    }

                    const name = parts.join(' - ') + '.webp';

                    const targetData = {
                        id: generateUniqueId(),
                        name: name,
                        dataUrl: webpDataUrl,
                        timestamp: new Date().toISOString(),
                        firearmId: firearmId || null, // Store association if possible for future use
                        loadId: loadId || null
                    };
                    await updateItem('targetImages', targetData);
                    await renderTargetImages();
                    await refreshImpactMarkingUI();
                } catch (error) {
                    console.error("Failed to process and save image:", error);
                    alert("There was an error converting the image to WebP format.");
                }
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
        // Optionally clear the inputs
        document.getElementById('targetNamePrefix').value = '';
        // document.getElementById('targetFirearmSelect').value = '';
        // document.getElementById('targetLoadSelect').value = '';
    }
    
    async function handleGalleryClick(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const card = button.closest('[data-id]');
        const id = card.dataset.id;
        const action = button.dataset.action;

        if (action === 'delete') {
            if (confirm('Are you sure you want to delete this target?')) {
                await deleteItem('targetImages', id);
                await renderTargetImages();
                await refreshImpactMarkingUI();
            }
        } else if (action === 'rename') {
            const nameInput = card.querySelector('.target-name-input');
            const newName = nameInput.value;
            const item = await getItem('targetImages', id);
            if (item) {
                item.name = newName;
                await updateItem('targetImages', item);
                alert('Target renamed.');
                await renderTargetImages();
                await refreshImpactMarkingUI();
            }
        }
    }
    renderTargetImages();
}
