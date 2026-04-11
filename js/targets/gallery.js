// js/targets/gallery.js
import { getAllItems, updateItem, deleteItem, getItem, generateUniqueId } from '../db.js';
import { convertToWebP } from '../utils.js';
import { refreshImpactMarkingUI } from '../marking.js';

export async function renderTargetImages() {
    const targetGallery = document.getElementById('targetGallery');
    const combineBtn = document.getElementById('combineTargetsBtn');
    
    if (!targetGallery) return;
    
    const items = await getAllItems('targetImages');
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    targetGallery.innerHTML = '';
    if (items.length === 0) {
        targetGallery.innerHTML = '<p style="color: #9ca3af; grid-column: 1 / -1; text-align: center;">No targets uploaded yet. Use the button above to add some.</p>';
        if (combineBtn) combineBtn.style.display = 'none';
        return;
    }
    
    // Check if we are in "Manage Targets" mode to show checkboxes? 
    // The requirement says "add the ability to combine multiple uploads".
    // We can add a checkbox to each card.
    
    items.forEach(item => {
        const cardHtml = `
            <div class="card" data-id="${item.id}" style="text-align: center; position: relative;">
                <div style="position: absolute; top: 0.5rem; left: 0.5rem; z-index: 10;">
                    <input type="checkbox" class="combine-checkbox" data-id="${item.id}" style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                </div>
                <div style="width: 100%; aspect-ratio: 1 / 1.4; background-color: #374151; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 0.25rem;">
                     <img src="${item.dataUrl || item.data}" alt="${item.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <input type="text" value="${item.name}" class="target-name-input" style="margin-top: 0.5rem; width: 100%; box-sizing: border-box;">
                <div class="flex-container" style="margin-top: 0.5rem; justify-content: center;">
                    <button class="btn-yellow btn-small" data-action="rename">Rename</button>
                    <button class="btn-red btn-small" data-action="delete">Delete</button>
                </div>
            </div>
        `;
        targetGallery.insertAdjacentHTML('beforeend', cardHtml);
    });

    // Handle combine button visibility
    const checkboxes = targetGallery.querySelectorAll('.combine-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const checkedCount = targetGallery.querySelectorAll('.combine-checkbox:checked').length;
            if (combineBtn) {
                combineBtn.style.display = checkedCount >= 2 ? 'inline-block' : 'none';
                combineBtn.textContent = `Combine ${checkedCount} Targets`;
            }
        });
    });
    
    if (combineBtn) combineBtn.style.display = 'none';
}

export function initGallery() {
    const uploadInput = document.getElementById('uploadTargetImage');
    const targetGallery = document.getElementById('targetGallery');
    const combineBtn = document.getElementById('combineTargetsBtn');

    if (uploadInput) {
        uploadInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            let processedCount = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) {
                    processedCount++;
                    continue;
                }

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                         const webpDataUrl = await convertToWebP(event.target.result);
                    
                        let name = file.name.replace(/\.[^/.]+$/, "");
                        if (files.length > 1) {
                             name += ` - ${i + 1}`;
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
                        alert("There was an error converting the image.");
                    } finally {
                        processedCount++;
                        if (processedCount === files.length) {
                            await renderTargetImages();
                            await refreshImpactMarkingUI(); // Update dropdowns in other tabs
                            e.target.value = '';
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (targetGallery) {
        targetGallery.addEventListener('click', async (e) => {
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
        });
    }

    if (combineBtn) {
        combineBtn.addEventListener('click', async () => {
            const checkedBoxes = document.querySelectorAll('.combine-checkbox:checked');
            if (checkedBoxes.length < 2) return;
            
            const ids = Array.from(checkedBoxes).map(cb => cb.dataset.id);
            await combineImages(ids);
        });
    }

    renderTargetImages();
}

async function combineImages(ids) {
    try {
        const images = [];
        for (const id of ids) {
            const item = await getItem('targetImages', id);
            if (item) images.push(item);
        }

        // Sort by timestamp if needed, but the user selection order is not guaranteed. 
        // We will just use the order they were retrieved or maybe sort by name?
        // Let's sort by timestamp to keep chronological order of shots.
        images.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Create a canvas to stitch them.
        // Strategy: 
        // If 2 images: side-by-side or vertical? 
        // If > 2: grid?
        // The request says "combine the pictures into a single target". 
        // Usually, this means stitching. Let's do a simple vertical stack or horizontal?
        // Let's try to make a grid.
        
        const count = images.length;
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);

        // Load all images to get dimensions
        const loadedImages = await Promise.all(images.map(imgData => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = imgData.dataUrl;
            });
        }));

        // Determine max width/height of a cell to normalize sizing?
        // Or just stack them with their original aspect ratios.
        // To make it look like a single target sheet, we probably want to normalize the widths.
        
        const maxWidth = Math.max(...loadedImages.map(img => img.width));
        // Scale all images to maxWidth
        
        let totalHeight = 0;
        let currentRowHeight = 0;
        let totalWidth = 0;

        // Simplified approach: Just stack them vertically if the user wants to "combine".
        // Or grid. Grid is better for viewing.
        
        // Let's assume we want them in a grid, scaled to have same width.
        const gap = 20;
        const cellWidth = maxWidth; // We can scale others to this or average?
        
        // Actually, if we are combining targets, they might be photos of the same size paper.
        // Let's calculate the canvas size.
        
        // We will arrange in a grid.
        // Canvas Width = (cellWidth * cols) + (gap * (cols - 1))
        // We need to calculate row heights.
        
        // Let's standardize the width to 1000px for calculation to keep it simple, or keep max resolution.
        const standardWidth = 1000;
        
        const rescaledImages = loadedImages.map(img => {
            const scale = standardWidth / img.width;
            return {
                img: img,
                w: standardWidth,
                h: img.height * scale
            };
        });
        
        // Calculate rows heights
        const rowHeights = [];
        for (let r = 0; r < rows; r++) {
            let maxH = 0;
            for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                if (idx < rescaledImages.length) {
                    maxH = Math.max(maxH, rescaledImages[idx].h);
                }
            }
            rowHeights.push(maxH);
        }
        
        const canvasWidth = (standardWidth * cols) + (gap * (cols - 1)) + (gap * 2); // margins
        const canvasHeight = rowHeights.reduce((a, b) => a + b, 0) + (gap * (rows - 1)) + (gap * 2);
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        let currentY = gap;
        for (let r = 0; r < rows; r++) {
            let currentX = gap;
            for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                if (idx < rescaledImages.length) {
                    const item = rescaledImages[idx];
                    // Center vertically in the row? or top align. Top align is fine.
                    // Center horizontally in the cell (standardWidth)
                    
                    ctx.drawImage(item.img, currentX, currentY, item.w, item.h);
                    
                    currentX += standardWidth + gap;
                }
            }
            currentY += rowHeights[r] + gap;
        }
        
        const finalDataUrl = canvas.toDataURL('image/webp', 0.8);
        
        const newName = `Combined Target - ${new Date().toLocaleString().replace(/[/,:]/g, '-')}.webp`;
        
        const targetData = {
            id: generateUniqueId(),
            name: newName,
            dataUrl: finalDataUrl,
            timestamp: new Date().toISOString()
        };
        
        await updateItem('targetImages', targetData);
        alert('Targets combined successfully!');
        
        await renderTargetImages();
        await refreshImpactMarkingUI();

    } catch (error) {
        console.error("Error combining images:", error);
        alert("Failed to combine images.");
    }
}
