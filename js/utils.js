// js/utils.js
import { getItem } from './db.js';

export function triggerDownload(content, fileName) {
    const a = document.createElement('a');
    const blob = new Blob([content], { type: 'application/json' });
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

export function convertToWebP(dataUrl, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const webpDataUrl = canvas.toDataURL('image/webp', quality);
            resolve(webpDataUrl);
        };
        img.onerror = (err) => {
            console.error("Error loading image for conversion:", err);
            reject("Failed to load image for WebP conversion.");
        };
        img.src = dataUrl;
    });
}

export function populateSelect(elementId, data, textKey, valueKey) {
    const select = document.getElementById(elementId);
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Select --</option>';
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[textKey];
        select.appendChild(option);
    });
    select.value = currentVal;
}

export async function createSessionName(session) {
    if (!session) return "Invalid Session";
    
    // Firearm Text
    let firearmText = 'No Firearm';
    if (session.firearmId) {
        const firearm = await getItem('firearms', session.firearmId);
        firearmText = firearm ? firearm.nickname : 'Unknown Firearm';
    }

    // Load Text
    let loadText = 'No Load';
    if (session.loadId) {
        const load = await getItem('loads', session.loadId);
        if (load) {
            if (load.loadType === 'commercial') {
                const mfg = await getItem('manufacturers', load.manufacturerId);
                loadText = `${mfg ? mfg.name : ''} ${load.name}`;
            } else {
                const bullet = await getItem('bullets', load.bulletId);
                const powder = await getItem('powders', load.powderId);
                let bulletText = '?gr';
                if (bullet) {
                    const bulletMfg = await getItem('manufacturers', bullet.manufacturerId);
                    bulletText = `${bulletMfg ? bulletMfg.name : ''} ${bullet.weight}gr`;
                }
                const powderName = powder ? powder.name : '?';
                const chargeWeight = load.chargeWeight || '?';
                loadText = `HL: ${bulletText} / ${powderName} ${chargeWeight}gr`;
            }
        }
    }
    
    // Target Text
    let targetText = 'No Target';
    if (session.targetImageId) {
        const target = await getItem('targetImages', session.targetImageId);
        // Truncate long target names for display
        targetText = target ? (target.name.length > 25 ? target.name.substring(0, 22) + '...' : target.name) : 'Deleted Target';
    }

    // Shot Count
    const totalShots = session.shots ? session.shots.length : 0;
    const shotText = totalShots > 0 ? `(${totalShots} shots)` : '';

    return `${firearmText} | ${loadText} | ${targetText} ${shotText}`.trim().replace(/  +/g, ' ');
}
