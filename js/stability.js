// js/stability.js
import { getAllItems, getItem } from './db.js';
import { populateSelect } from './utils.js';

export function initStabilityCalculator() {
    const calculateBtn = document.getElementById('calculateStabilityBtn');
    const firearmSelect = document.getElementById('stabFirearmSelect');
    const loadSelect = document.getElementById('stabLoadSelect');
    const bulletSelect = document.getElementById('stabBulletSelect');
    const useLoadBulletCheckbox = document.getElementById('stabUseLoadBullet');
    
    const loadSelectContainer = document.getElementById('stabLoadSelectContainer');
    const manualBulletContainer = document.getElementById('stabManualBulletContainer');

    if (calculateBtn) calculateBtn.addEventListener('click', calculateStability);
    
    if (firearmSelect) firearmSelect.addEventListener('change', handleFirearmChange);
    if (loadSelect) loadSelect.addEventListener('change', handleLoadChange);
    if (bulletSelect) bulletSelect.addEventListener('change', handleBulletChange);
    
    if (useLoadBulletCheckbox) {
        useLoadBulletCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                loadSelectContainer.style.display = 'block';
                manualBulletContainer.style.display = 'none';
                handleLoadChange();
            } else {
                loadSelectContainer.style.display = 'none';
                manualBulletContainer.style.display = 'block';
                handleBulletChange();
            }
        });
    }

    refreshStabilityUI();
}

export async function refreshStabilityUI() {
    const firearms = await getAllItems('firearms');
    const loads = await getAllItems('loads');
    const bullets = await getAllItems('bullets');
    const manufacturers = await getAllItems('manufacturers');
    const cartridges = await getAllItems('cartridges');

    // Populate Firearms
    const firearmSelect = document.getElementById('stabFirearmSelect');
    if (firearmSelect) {
        const currentVal = firearmSelect.value;
        firearmSelect.innerHTML = '<option value="">-- Manual Entry --</option>';
        firearms.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.nickname;
            firearmSelect.appendChild(opt);
        });
        firearmSelect.value = currentVal;
    }

    // Populate Loads
    const loadSelect = document.getElementById('stabLoadSelect');
    if (loadSelect) {
        const currentVal = loadSelect.value;
        loadSelect.innerHTML = '<option value="">-- Select Load --</option>';
        for (const l of loads) {
            const cartridge = cartridges.find(c => c.id === l.cartridgeId);
            const cartName = cartridge ? cartridge.name : 'N/A';
            let label = '';
            if (l.loadType === 'commercial') {
                label = `${cartName}: ${l.name}`;
            } else {
                const bullet = bullets.find(b => b.id === l.bulletId);
                const weight = bullet ? bullet.weight : '?';
                label = `${cartName}: ${weight}gr Handload`;
            }
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.textContent = label;
            loadSelect.appendChild(opt);
        }
        loadSelect.value = currentVal;
    }

    // Populate Bullets
    const bulletSelect = document.getElementById('stabBulletSelect');
    if (bulletSelect) {
        const currentVal = bulletSelect.value;
        bulletSelect.innerHTML = '<option value="">-- Manual Entry --</option>';
        bullets.forEach(b => {
            const mfg = manufacturers.find(m => m.id === b.manufacturerId);
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = `${b.weight}gr ${mfg ? mfg.name : ''} ${b.name}`;
            bulletSelect.appendChild(opt);
        });
        bulletSelect.value = currentVal;
    }
}

async function handleFirearmChange() {
    const id = document.getElementById('stabFirearmSelect').value;
    if (!id) return;
    const firearm = await getItem('firearms', id);
    if (firearm && firearm.twistRate) {
        // Assume twist rate is entered as X in 1:X
        const twist = parseFloat(firearm.twistRate.replace('1:', '').trim());
        if (!isNaN(twist)) {
            document.getElementById('stabTwist').value = twist;
        }
    }
}

async function handleLoadChange() {
    const id = document.getElementById('stabLoadSelect').value;
    if (!id) return;
    const load = await getItem('loads', id);
    if (load && load.bulletId) {
        populateBulletFields(load.bulletId);
    }
}

async function handleBulletChange() {
    const id = document.getElementById('stabBulletSelect').value;
    if (!id) return;
    populateBulletFields(id);
}

async function populateBulletFields(bulletId) {
    const bullet = await getItem('bullets', bulletId);
    if (bullet) {
        document.getElementById('stabBulletWeight').value = bullet.weight || '';
        document.getElementById('stabBulletLength').value = bullet.length || '';
        
        const diameter = await getItem('diameters', bullet.diameterId);
        if (diameter) {
            document.getElementById('stabBulletDiameter').value = parseFloat(diameter.imperial.replace(/[^0-9.]/g, '')) || '';
        }
    }
}

function calculateStability() {
    const m = parseFloat(document.getElementById('stabBulletWeight').value);
    const d = parseFloat(document.getElementById('stabBulletDiameter').value);
    const l = parseFloat(document.getElementById('stabBulletLength').value);
    const t = parseFloat(document.getElementById('stabTwist').value);
    const v = parseFloat(document.getElementById('stabVelocity').value);
    const temp = parseFloat(document.getElementById('stabTemp').value);
    const p = parseFloat(document.getElementById('stabPressure').value);

    const output = document.getElementById('stabilityResultOutput');

    if (isNaN(m) || isNaN(d) || isNaN(l) || isNaN(t) || isNaN(v)) {
        output.innerHTML = '<p style="color: #ef4444;">Please fill in all required fields (Weight, Diameter, Length, Twist, Velocity).</p>';
        return;
    }

    // Miller Twist Formula
    // Sg = (30 * m) / (t^2 * d^3 * l/d * (1 + (l/d)^2))
    
    const ld = l / d;
    let sg = (30 * m) / (Math.pow(t, 2) * Math.pow(d, 3) * ld * (1 + Math.pow(ld, 2)));

    // Correct for Velocity (Miller's formula is for 2800 fps)
    // Miller suggests a correction factor: (v / 2800)^(1/3)
    const velCorrection = Math.pow(v / 2800, 1/3);
    sg *= velCorrection;

    // Correct for Atmosphere
    // Standard is 59F and 29.92 inHg
    // Sg is proportional to air density. Miller formula assumes standard density.
    // Factor = (Standard Density / Current Density)
    // Simple approximation: (Standard Pressure / Current Pressure) * (Current Temp + 460) / (Standard Temp + 460)
    const atmCorrection = (29.92 / p) * ((temp + 459.67) / (59 + 459.67));
    sg *= atmCorrection;

    let color = "#ef4444"; // Red
    let status = "Unstable";

    if (sg >= 1.5) {
        color = "#10b981"; // Green
        status = "Stable";
    } else if (sg >= 1.0) {
        color = "#f59e0b"; // Yellow
        status = "Marginally Stable";
    }

    output.innerHTML = `
        <div style="font-size: 3rem; font-weight: 700; color: ${color};">${sg.toFixed(2)}</div>
        <div style="font-size: 1.5rem; color: ${color}; margin-top: 0.5rem;">${status}</div>
        <div style="margin-top: 1.5rem; text-align: left; display: inline-block;">
             <p><strong>Bullet:</strong> ${m}gr, ${d}" dia, ${l}" long</p>
             <p><strong>Barrel Twist:</strong> 1:${t}"</p>
             <p><strong>Environment:</strong> ${v} fps @ ${temp}°F / ${p} inHg</p>
        </div>
    `;
}
