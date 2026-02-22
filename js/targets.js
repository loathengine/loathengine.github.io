// js/targets.js
import { initGallery, renderTargetImages } from './targets/gallery.js';
import { initTargetGenerator } from './targets/generator.js';

export { renderTargetImages };

export function initTargetsManagement() {
    // === Sub-Tab Navigation ===
    const subTabNav = document.querySelector('#targets .sub-tabs-nav');
    if (subTabNav) {
        subTabNav.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-link')) {
                const tabId = e.target.dataset.tab;
                
                // Update Buttons
                subTabNav.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                // Update Content
                const parent = document.getElementById('targets');
                parent.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) {
                        content.classList.add('active');
                        // If switching to generator, trigger a redraw just in case canvas size needs update (though CSS handles it mostly)
                        if(tabId === 'create-targets') {
                             const previewBtn = document.getElementById('previewTargetBtn');
                             if(previewBtn) previewBtn.click();
                        }
                    }
                });
            }
        });
    }

    initGallery();
    initTargetGenerator();
}
