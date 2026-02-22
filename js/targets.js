// js/targets.js
import { initGallery, renderTargetImages } from './targets/gallery.js';
import { initTargetGenerator } from './targets/generator.js';

export { renderTargetImages };

export function initTargetsManagement() {
    // === Sub-Tab Navigation ===
    const subTabNav = document.querySelector('#targets .tabs-nav');
    if (subTabNav) {
        subTabNav.addEventListener('click', (e) => {
            if (e.target.classList.contains('sub-tab-link')) {
                const tabId = e.target.dataset.subtab;
                
                // Update Buttons
                subTabNav.querySelectorAll('.sub-tab-link').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                // Update Content
                const parent = document.getElementById('targets');
                // We need to be careful not to toggle the main tab content if it shares class 'tab-content'
                // But in targets.html, the sub-contents are direct children of the card or the main container.
                // Let's look at the structure:
                // #targets (main tab content) -> .card -> .tab-content (sub-tab content)
                
                // We should select only the sub-tab contents. 
                // Using IDs is safer: manage-targets-subtab, create-targets-subtab
                
                const manageContent = document.getElementById('manage-targets-subtab');
                const createContent = document.getElementById('create-targets-subtab');
                
                if (manageContent) manageContent.classList.remove('active');
                if (createContent) createContent.classList.remove('active');
                
                const targetContent = document.getElementById(`${tabId}-subtab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    
                    // If switching to generator, trigger a redraw
                    if(tabId === 'create-targets') {
                         const previewBtn = document.getElementById('previewTargetBtn');
                         if(previewBtn) previewBtn.click();
                    }
                }
            }
        });
    }

    initGallery();
    initTargetGenerator();
}
