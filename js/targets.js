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
                    <button class="btn-indigo btn-small" data-action="apply-info">Apply Info</button>
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
    
    uploadInput.addEventListener('change', handleTargetUpload);
    targetGallery.addEventListener('click', handleGalleryClick);

    async function handleTargetUpload(e) {
        const files = Array.from(e.target.files); // Convert FileList to Array
        if (files.length === 0) return;

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

        let processedCount = 0;

        files.forEach((file, index) => {
            if (!file.type.startsWith('image/')) {
                processedCount++;
                return;
            }

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

                    // Append firearm and load info if available
                    const parts = [];
                    if (finalName) parts.push(finalName);
                    if (firearmName) parts.push(firearmName);
                    if (loadName) parts.push(loadName);
                    
                    // If multiple files are selected, append the index (1-based) to ensure uniqueness
                    if (files.length > 1) {
                         parts.push(index + 1);
                    }

                    const name = parts.join(' - ') + '.webp';

                    const targetData = {
                        id: generateUniqueId(),
                        name: name,
                        dataUrl: webpDataUrl,
                        timestamp: new Date().toISOString(),
                        firearmId: firearmId || null,
                        loadId: loadId || null
                    };
                    await updateItem('targetImages', targetData);
                } catch (error) {
                    console.error("Failed to process and save image:", error);
                    alert("There was an error converting the image to WebP format.");
                } finally {
                    processedCount++;
                    // Only render once all files are processed to avoid flickering and performance issues
                    if (processedCount === files.length) {
                        await renderTargetImages();
                        await refreshImpactMarkingUI();
                        // Reset inputs after full batch completion
                        e.target.value = '';
                        document.getElementById('targetNamePrefix').value = '';
                    }
                }
            };
            reader.readAsDataURL(file);
        });
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
        } else if (action === 'apply-info') {
             const firearmId = document.getElementById('targetFirearmSelect').value;
             const loadId = document.getElementById('targetLoadSelect').value;
             const customName = document.getElementById('targetNamePrefix').value.trim();
             
             if (!firearmId && !loadId && !customName) {
                 alert('Please select a firearm, load, or enter a custom name prefix to apply.');
                 return;
             }

             if(!confirm('This will rename the target using the selected Firearm, Load, and Custom Name (if provided). Continue?')) return;

             const item = await getItem('targetImages', id);
             if (!item) return;

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

             // Construct new name
             let finalName = '';
             if (customName) {
                 finalName = customName;
             } else {
                 // Keep existing name prefix if no custom name provided, 
                 // but try to strip old firearm/load info if we can guess it? 
                 // Easier to just use the current name as the base if no custom name is given.
                 // However, "Apply Info" implies we want to standardize it.
                 // Let's use the current "Custom Name" input as the base. 
                 // If empty, we might just prepend to the existing name or replace? 
                 // Let's assume the user wants to REPLACE the metadata part.
                 
                 // If customName is empty, let's use the first part of the existing name 
                 // (assuming it was formatted as Name - Firearm - Load). 
                 // This is a bit risky. 
                 
                 // Safer approach: If customName is empty, ask user or just use "Target".
                 // Or better: Just use the current input value. If empty, maybe just use "Target"?
                 // Actually, if customName is empty, let's just use the current filename (without extension) as the base,
                 // but that might result in "OldName - Firearm - Load".
                 
                 // Let's stick to the behavior: Custom Name replaces the "Event/Date" part.
                 // If no Custom Name is provided, we just append the info to the CURRENT name (stripped of extension).
                 finalName = item.name.replace(/\.[^/.]+$/, "");
             }

             const parts = [finalName];
             if (firearmName) parts.push(firearmName);
             if (loadName) parts.push(loadName);
             
             const newName = parts.join(' - ') + '.webp';
             
             item.name = newName;
             item.firearmId = firearmId || item.firearmId; // Update associations if provided
             item.loadId = loadId || item.loadId;

             await updateItem('targetImages', item);
             alert('Target info applied and renamed.');
             await renderTargetImages();
             await refreshImpactMarkingUI();
        }
    }
    renderTargetImages();
}
