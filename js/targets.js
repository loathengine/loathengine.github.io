// js/targets.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from './db.js';
import { convertToWebP } from './utils.js';
import { refreshImpactMarkingUI } from './marking.js';

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

    uploadInput.addEventListener('change', handleTargetUpload);
    targetGallery.addEventListener('click', handleGalleryClick);

    async function handleTargetUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

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
                    
                    let name = file.name.replace(/\.[^/.]+$/, "");
                    
                    // If multiple files are selected, append the index (1-based) to ensure uniqueness
                    if (files.length > 1) {
                         name += ` - ${index + 1}`;
                    }

                    name += '.webp';

                    const targetData = {
                        id: generateUniqueId(),
                        name: name,
                        dataUrl: webpDataUrl,
                        timestamp: new Date().toISOString()
                    };
                    await updateItem('targetImages', targetData);
                } catch (error) {
                    console.error("Failed to process and save image:", error);
                    alert("There was an error converting the image to WebP format.");
                } finally {
                    processedCount++;
                    if (processedCount === files.length) {
                        await renderTargetImages();
                        await refreshImpactMarkingUI();
                        e.target.value = '';
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
        }
    }
    renderTargetImages();
}
