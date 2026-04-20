// js/targets/gallery.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId, getAllItemsMetadata } from '../db.js';
import { convertToWebP, formatManufacturerName } from '../utils.js';
import { refreshImpactMarkingUI } from '../marking.js';

export async function renderTargetImages() {
    const tableBody = document.getElementById('targetGalleryTableBody');
    if (!tableBody) return;
    
    // In order to NOT crash the browser when getting all items, we must hope indexedDB handles it okay.
    // If it's a real issue we would need a cursor to fetch only metadata, but since we just need to iterate, it's fine as long as we don't inject base64 into the DOM.
    const items = await getAllItemsMetadata('targetImages', ['dataUrl', 'data', 'thumbnailUrl']);
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    tableBody.innerHTML = '';
    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #9ca3af; padding: 1.5rem;">No targets uploaded yet. Use the button above to add some.</td></tr>';
        return;
    }
    
    items.forEach(item => {
        const dateStr = new Date(item.timestamp).toLocaleString();
        const rowHtml = `
            <tr data-id="${item.id}">
                <td><strong>${item.name}</strong></td>
                <td>${dateStr}</td>
                <td>
                    <div class="flex-container" style="justify-content: flex-start;">
                        <button class="btn-indigo btn-small" data-action="preview" data-name="${item.name}">Preview</button>
                        <button class="btn-green btn-small" data-action="autoname" data-name="${item.name}">Tag Target</button>
                        <button class="btn-blue btn-small" data-action="download" data-name="${item.name}">Download</button>
                        <button class="btn-yellow btn-small" data-action="rename" data-name="${item.name}">Rename</button>
                        <button class="btn-red btn-small" data-action="delete">Delete</button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowHtml);
    });
}

export function initGallery() {
    const uploadInput = document.getElementById('uploadTargetImage');
    const tableBody = document.getElementById('targetGalleryTableBody');
    const closePreviewBtn = document.getElementById('closePreviewBtn');

    let currentAutoNameTargetId = null;
    const autoNameModal = document.getElementById('autoNameModal');
    const cancelAutoNameBtn = document.getElementById('cancelAutoNameBtn');
    const saveAutoNameBtn = document.getElementById('saveAutoNameBtn');
    const autoNameFirearm = document.getElementById('autoNameFirearm');
    const autoNameLoad = document.getElementById('autoNameLoad');
    const autoNameBullet = document.getElementById('autoNameBullet');

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', () => {
            document.getElementById('targetPreviewArea').style.display = 'none';
            document.getElementById('previewTargetImg').src = '';
        });
    }

    async function populateAutoNameLoads(firearmId) {
        if (!autoNameLoad) return;
        const currentLoadId = autoNameLoad.value;
        autoNameLoad.innerHTML = '<option value="">-- Select Load --</option>';
        try {
            let loads = await getAllItems('loads');
            
            if (firearmId) {
                const firearm = await getItem('firearms', firearmId);
                if (firearm && firearm.cartridgeId) {
                    loads = loads.filter(l => l.cartridgeId === firearm.cartridgeId);
                }
            }

            const bullets = await getAllItems('bullets');
            const powders = await getAllItems('powders');
            const manufacturers = await getAllItems('manufacturers');

            loads.forEach(l => {
                const option = document.createElement('option');
                option.value = l.id;

                let label = "Unknown Load";
                if (l.loadTypeId === 'LT_COMM') {
                    const mfg = manufacturers.find(m => m.id === l.manufacturerId);
                    const mfgName = mfg ? formatManufacturerName(mfg) : '';
                    let commLabel = `${mfgName} ${l.name}`.trim();
                    
                    if (l.bulletId) {
                        const bullet = bullets.find(b => b.id === l.bulletId);
                        if (bullet) {
                            const bMfg = manufacturers.find(m => m.id === bullet.manufacturerId);
                            const bMfgStr = bMfg ? formatManufacturerName(bMfg) : '';
                            const bName = bullet.name || '';
                            const bulletStr = `${bMfgStr} ${bName} ${bullet.weight}gr`.trim();
                            commLabel += ` - ${bulletStr}`;
                        }
                    }
                    label = commLabel;
                } else {
                    const bullet = bullets.find(b => b.id === l.bulletId);
                    const powder = powders.find(p => p.id === l.powderId);
                    
                    let bulletMfgStr = 'Unknown Mfg';
                    let bulletNameStr = 'Unknown Bullet';
                    let bulletWeightStr = '?gr';

                    if (bullet) {
                        const bMfg = manufacturers.find(m => m.id === bullet.manufacturerId);
                        bulletMfgStr = bMfg ? formatManufacturerName(bMfg) : 'Unknown Mfg';
                        bulletNameStr = bullet.name || 'Unknown Bullet';
                        bulletWeightStr = `${bullet.weight}gr`;
                    }

                    const powderStr = powder ? powder.name : 'Unknown Powder';
                    let chargeStr = '?';
                    if (Array.isArray(l.chargeWeight)) chargeStr = l.chargeWeight.join(', ');
                    else if (l.chargeWeight) chargeStr = l.chargeWeight;
                    
                    const namePart = l.name ? `${l.name} - ` : '';
                    label = `${namePart}${bulletMfgStr} - ${bulletNameStr} ${bulletWeightStr} - ${powderStr} - ${chargeStr}gr`;
                }

                option.textContent = label;
                autoNameLoad.appendChild(option);
            });
            if (currentLoadId) {
                autoNameLoad.value = currentLoadId;
            }
        } catch (err) {
            console.error("Error populating auto name loads:", err);
        }
    }

    if (autoNameFirearm) {
        autoNameFirearm.addEventListener('change', () => {
            populateAutoNameLoads(autoNameFirearm.value);
        });
    }

    if (cancelAutoNameBtn) {
        cancelAutoNameBtn.addEventListener('click', () => {
            if (autoNameModal) autoNameModal.style.display = 'none';
            currentAutoNameTargetId = null;
        });
    }

    if (saveAutoNameBtn) {
        saveAutoNameBtn.addEventListener('click', async () => {
            if (!currentAutoNameTargetId) return;
            const firearmId = autoNameFirearm.value;
            const loadId = autoNameLoad.value;
            
            if (!firearmId) {
                alert("Please select a Firearm.");
                return;
            }

            const item = await getItem('targetImages', currentAutoNameTargetId);
            if (item) {
                item.firearmId = firearmId;
                item.loadId = loadId;
                await updateItem('targetImages', item);
                await renderTargetImages();
                await refreshImpactMarkingUI();
                
                if (autoNameModal) autoNameModal.style.display = 'none';
                currentAutoNameTargetId = null;
            }
        });
    }

    if (uploadInput) {
        uploadInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            e.target.disabled = true;
            let successCount = 0;
            
            const progressContainer = document.getElementById('uploadProgressContainer');
            const progressBar = document.getElementById('uploadProgressBar');
            const progressText = document.getElementById('uploadProgressText');
            
            if (progressContainer) progressContainer.style.display = 'block';
            if (progressBar) progressBar.style.width = `0%`;
            if (progressText) progressText.textContent = `Processing 1 of ${files.length}...`;

            try {
                const existingTargets = await getAllItemsMetadata('targetImages', ['dataUrl', 'data', 'thumbnailUrl']);
                const existingNames = new Set(existingTargets.map(t => t.name));

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (!file.type.startsWith('image/')) continue;
                    
                    if (progressText) progressText.textContent = `Processing ${i + 1} of ${files.length}...`;

                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = event => resolve(event.target.result);
                        reader.onerror = error => reject(error);
                        reader.readAsDataURL(file);
                    });

                    const webpDataUrl = await convertToWebP(dataUrl);

                    let baseName = file.name.replace(/\.[^/.]+$/, "");
                    let name = baseName;
                    let counter = 1;
                    
                    while (existingNames.has(name)) {
                        name = `${baseName} (${counter})`;
                        counter++;
                    }
                    existingNames.add(name);

                    const targetData = {
                        id: generateUniqueId(),
                        name: name,
                        dataUrl: webpDataUrl,
                        timestamp: new Date().toISOString()
                    };
                    
                    await updateItem('targetImages', targetData);
                    successCount++;
                    
                    if (progressBar) progressBar.style.width = `${((i + 1) / files.length) * 100}%`;
                }
            } catch (error) {
                console.error("Failed to process and save image list:", error);
                alert("There was an error converting or saving some images.");
            } finally {
                if (successCount > 0) {
                    await renderTargetImages();
                    await refreshImpactMarkingUI(); // Update dropdowns in other tabs
                }
                if (progressContainer) {
                    progressContainer.style.display = 'none';
                    if (progressBar) progressBar.style.width = '0%';
                }
                e.target.value = '';
                e.target.disabled = false;
            }
        });
    }

    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            const row = button.closest('tr');
            const id = row.dataset.id;
            const action = button.dataset.action;

            if (action === 'delete') {
                if (confirm('Are you sure you want to delete this target?')) {
                    await deleteItem('targetImages', id);
                    await renderTargetImages();
                    await refreshImpactMarkingUI();
                }
            } else if (action === 'rename') {
                const currentName = button.dataset.name;
                const newName = prompt('Enter new target name:', currentName);
                if (newName && newName.trim() !== '' && newName !== currentName) {
                    const item = await getItem('targetImages', id);
                    if (item) {
                        item.name = newName.trim();
                        await updateItem('targetImages', item);
                        await renderTargetImages();
                        await refreshImpactMarkingUI();
                    }
                }
            } else if (action === 'autoname') {
                currentAutoNameTargetId = id;
                if (autoNameModal) {
                    autoNameModal.style.display = 'flex';
                    // Populate dropdowns
                    try {
                        const firearms = await getAllItems('firearms');
                        autoNameFirearm.innerHTML = '<option value="">-- Select Firearm --</option>';
                        firearms.forEach(f => {
                            const option = document.createElement('option');
                            option.value = f.id;
                            option.textContent = f.nickname;
                            autoNameFirearm.appendChild(option);
                        });

                        const item = await getItem('targetImages', id);
                        if (item && item.firearmId) {
                            autoNameFirearm.value = item.firearmId;
                        }
                        
                        await populateAutoNameLoads(autoNameFirearm.value);
                        await populateAutoNameBullets(autoNameFirearm.value);
                        
                        if (item && item.loadId) {
                            autoNameLoad.value = item.loadId;
                        }
                        if (item && item.bulletId) {
                            autoNameBullet.value = item.bulletId;
                        }
                    } catch (err) {
                        console.error("Error loading data for auto name:", err);
                    }
                }
            } else if (action === 'preview') {
                const item = await getItem('targetImages', id);
                if (item) {
                    document.getElementById('previewTargetName').textContent = item.name;
                    document.getElementById('previewTargetImg').src = item.dataUrl || item.data;
                    document.getElementById('targetPreviewArea').style.display = 'block';
                    document.getElementById('targetPreviewArea').scrollIntoView({ behavior: 'smooth' });
                }
            } else if (action === 'download') {
                const item = await getItem('targetImages', id);
                if (item) {
                    const a = document.createElement('a');
                    a.href = item.dataUrl || item.data;
                    a.download = `${item.name}.webp`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            }
        });
    }

    renderTargetImages();
}
