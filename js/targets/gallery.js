// js/targets/gallery.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from '../db.js';
import { convertToWebP } from '../utils.js';
import { refreshImpactMarkingUI } from '../marking.js';

export async function renderTargetImages() {
    const tableBody = document.getElementById('targetGalleryTableBody');
    if (!tableBody) return;
    
    // In order to NOT crash the browser when getting all items, we must hope indexedDB handles it okay.
    // If it's a real issue we would need a cursor to fetch only metadata, but since we just need to iterate, it's fine as long as we don't inject base64 into the DOM.
    const items = await getAllItems('targetImages');
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

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', () => {
            document.getElementById('targetPreviewArea').style.display = 'none';
            document.getElementById('previewTargetImg').src = '';
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
                const existingTargets = await getAllItems('targetImages');
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
