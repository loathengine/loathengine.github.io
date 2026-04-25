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

export function generateThumbnail(dataUrl, maxSize = 300) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let width = img.naturalWidth;
            let height = img.naturalHeight;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Fill white background to handle transparency
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
            
            ctx.drawImage(img, 0, 0, width, height);
            // Thumbnails can use higher compression
            const webpDataUrl = canvas.toDataURL('image/webp', 0.6);
            resolve(webpDataUrl);
        };
        img.onerror = (err) => {
            console.error("Error loading image for thumbnail generation:", err);
            reject("Failed to load image for thumbnail generation.");
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
            if (load.loadTypeId === 'LT_COMM') {
                const mfg = await getItem('manufacturers', load.manufacturerId);
                loadText = `${mfg ? mfg.name : ''} ${load.name}`;
            } else {
                const bullet = await getItem('bullets', load.bulletId);
                const powder = await getItem('powders', load.powderId);
                
                let bulletMfgStr = 'Unknown Mfg';
                let bulletNameStr = 'Unknown Bullet';
                let bulletWeightStr = '?gr';
                if (bullet) {
                    const bMfg = await getItem('manufacturers', bullet.manufacturerId);
                    bulletMfgStr = bMfg ? bMfg.name : 'Unknown Mfg';
                    bulletNameStr = bullet.name || 'Unknown Bullet';
                    bulletWeightStr = `${bullet.weight}gr`;
                }

                const powderName = powder ? powder.name : 'Unknown Powder';
                
                let chargeWeight = '?';
                if (Array.isArray(load.chargeWeight)) {
                    chargeWeight = load.chargeWeight.join(', ');
                } else if (load.chargeWeight !== undefined) {
                     chargeWeight = load.chargeWeight;
                }
                
                const namePart = load.name ? `${load.name} - ` : '';
                loadText = `${namePart}${bulletMfgStr} - ${bulletNameStr} ${bulletWeightStr} - ${powderName} - ${chargeWeight}gr`;
            }
        }
    }
    
    // Target Text
    let targetText = 'No Target';
    if (session.targetImageId) {
        const target = await getItem('targetImages', session.targetImageId);
        targetText = target ? target.name : 'Deleted Target';
    }

    // Shot Count
    const totalShots = session.shots ? session.shots.length : 0;
    const shotText = totalShots > 0 ? `(${totalShots} shots)` : '';

    // Date has been removed to save space in Analysis view

    let baseParts = [];
    if (firearmText !== 'No Firearm') baseParts.push(firearmText);
    if (loadText !== 'No Load') baseParts.push(loadText);
    
    // If no firearm and no load, fallback to target image name.
    // If they exist, optionally append target name if it's not redundant.
    if (targetText !== 'No Target' && targetText !== 'Deleted Target') {
        if (baseParts.length === 0) {
            baseParts.push(targetText);
        } else {
            // Only append image name if it's not already the auto-generated name 
            // (preventing "My Rifle - My Load - My Rifle - My Load")
            if (!targetText.includes(firearmText)) {
                baseParts.push(`[${targetText}]`);
            }
        }
    }

    if (baseParts.length === 0) {
        baseParts.push('Unnamed Session');
    }

    let baseText = baseParts.join(' - ');

    return `${baseText} ${shotText}`.trim().replace(/  +/g, ' ');
}

export function formatManufacturerName(m) {
    if (!m) return 'Unknown Manufacturer';
    return m.name;
}

export async function getLoadTypeName(id) {
    const item = await getItem('loadTypes', id);
    return item ? item.name : id;
}

export async function getPrimerPocketName(id) {
    const item = await getItem('primerPockets', id);
    return item ? item.name : id;
}

export async function getPrimerHoleName(id) {
    const item = await getItem('primerHoles', id);
    return item ? item.name : id;
}
