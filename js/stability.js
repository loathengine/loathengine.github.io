// js/stability.js
import { getAllItems, getItem } from './db.js';
import { createSessionName } from './utils.js';

export function initStabilityCalculator() {
    const calculateBtn = document.getElementById('calculateStabilityBtn');
    const firearmSelect = document.getElementById('stabFirearmSelect');
    const loadSelect = document.getElementById('stabLoadSelect');
    const bulletSelect = document.getElementById('stabBulletSelect');
    const sessionSelect = document.getElementById('stabSessionSelect');
    const useLoadBulletCheckbox = document.getElementById('stabUseLoadBullet');
    const useSessionCheckbox = document.getElementById('stabUseSession');
    
    const loadSelectContainer = document.getElementById('stabLoadSelectContainer');
    const manualBulletContainer = document.getElementById('stabManualBulletContainer');
    const sessionSelectContainer = document.getElementById('stabSessionSelectContainer');

    if (calculateBtn) calculateBtn.addEventListener('click', calculateStability);
    
    if (firearmSelect) firearmSelect.addEventListener('change', handleFirearmChange);
    if (loadSelect) loadSelect.addEventListener('change', handleLoadChange);
    if (bulletSelect) bulletSelect.addEventListener('change', handleBulletChange);
    if (sessionSelect) sessionSelect.addEventListener('change', handleSessionChange);
    
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

    if (useSessionCheckbox) {
        useSessionCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                sessionSelectContainer.style.display = 'block';
                handleSessionChange();
            } else {
                sessionSelectContainer.style.display = 'none';
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
    const sessions = await getAllItems('impactData');

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

    // Populate Sessions
    const sessionSelect = document.getElementById('stabSessionSelect');
    if (sessionSelect) {
        const currentVal = sessionSelect.value;
        sessionSelect.innerHTML = '<option value="">-- Select Session --</option>';
        sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        for (const s of sessions) {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = await createSessionName(s);
            sessionSelect.appendChild(opt);
        }
        sessionSelect.value = currentVal;
    }
}

async function handleFirearmChange() {
    const id = document.getElementById('stabFirearmSelect').value;
    if (!id) return;
    const firearm = await getItem('firearms', id);
    if (firearm && firearm.twistRate) {
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

async function handleSessionChange() {
    const id = document.getElementById('stabSessionSelect').value;
    if (!id) return;
    const session = await getItem('impactData', id);
    if (session) {
        if (session.firearmId) {
            document.getElementById('stabFirearmSelect').value = session.firearmId;
            await handleFirearmChange();
        }
        if (session.loadId) {
            document.getElementById('stabUseLoadBullet').checked = true;
            document.getElementById('stabLoadSelectContainer').style.display = 'block';
            document.getElementById('stabManualBulletContainer').style.display = 'none';
            document.getElementById('stabLoadSelect').value = session.loadId;
            await handleLoadChange();
        }
        if (session.temp) document.getElementById('stabTemp').value = session.temp;
        if (session.pressure) document.getElementById('stabPressure').value = session.pressure;
        if (session.shots && session.shots.length > 0) {
            const velocities = session.shots.map(s => s.velocity).filter(v => v !== null && v !== undefined && v !== '');
            if (velocities.length > 0) {
                const avgVel = velocities.reduce((a, b) => a + b, 0) / velocities.length;
                document.getElementById('stabVelocity').value = Math.round(avgVel);
            }
        }
    }
}

async function populateBulletFields(bulletId) {
    const bullet = await getItem('bullets', bulletId);
    if (bullet) {
        document.getElementById('stabBulletWeight').value = bullet.weight || '';
        document.getElementById('stabBulletLength').value = bullet.length || '';
        const diameter = await getItem('diameters', bullet.diameterId);
        if (diameter) {
            // Ensure we extract a decimal value like 0.308
            const match = diameter.imperial.match(/[0-9.]+/);
            if (match) {
                let val = parseFloat(match[0]);
                // If it's a whole number like 308, convert to inches
                if (val > 1) val = val / 1000;
                document.getElementById('stabBulletDiameter').value = val;
            }
        }
    }
}

function calculateStability() {
    const m = parseFloat(document.getElementById('stabBulletWeight').value); // grains
    const d = parseFloat(document.getElementById('stabBulletDiameter').value); // inches
    const l = parseFloat(document.getElementById('stabBulletLength').value); // inches
    const t = parseFloat(document.getElementById('stabTwist').value); // inches
    const v = parseFloat(document.getElementById('stabVelocity').value); // fps
    const temp = parseFloat(document.getElementById('stabTemp').value); // F
    const p = parseFloat(document.getElementById('stabPressure').value); // inHg

    const output = document.getElementById('stabilityResultOutput');

    if (isNaN(m) || isNaN(d) || isNaN(l) || isNaN(t) || isNaN(v)) {
        output.innerHTML = '<p style="color: #ef4444;">Please fill in all required fields (Weight, Diameter, Length, Twist, Velocity).</p>';
        return;
    }

    // Miller Twist Formula (Corrected for T in inches)
    // Sg = (30 * m) / (T^2 * d^3 * (l/d) * (1 + (l/d)^2))
    // Which simplifies to:
    // Sg = (30 * m) / (T^2 * d * l * (1 + (l/d)^2))
    
    const ld = l / d;
    let sg = (30 * m) / (Math.pow(t, 2) * d * l * (1 + Math.pow(ld, 2)));

    // Correct for Velocity (Miller's formula is calibrated for 2800 fps)
    const velCorrection = Math.pow(v / 2800, 1/3);
    sg *= velCorrection;

    // Correct for Atmosphere (Miller formula assumes standard density)
    const atmCorrection = (29.92 / p) * ((temp + 459.67) / (59 + 459.67));
    sg *= atmCorrection;

    let color = "#ef4444"; 
    let status = "Unstable";

    if (sg >= 1.5) {
        color = "#10b981"; 
        status = "Stable";
    } else if (sg >= 1.0) {
        color = "#f59e0b"; 
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
