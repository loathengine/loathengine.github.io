// js/stability.js
import { getAllItems, getItem } from './db.js';
import { createSessionName } from './utils.js';

export function initStabilityCalculator() {
    const calculateBtn = document.getElementById('calculateStabilityBtn');
    const firearmSelect = document.getElementById('stabFirearmSelect');
    const loadSelect = document.getElementById('stabLoadSelect');
    const bulletSelect = document.getElementById('stabBulletSelect');
    const sessionSelect = document.getElementById('stabSessionSelect');
    const caliberFilterSelect = document.getElementById('stabBulletCaliberSelect');
    const useFirearmDataCheckbox = document.getElementById('stabUseFirearmData');
    const useLoadBulletCheckbox = document.getElementById('stabUseLoadBullet');
    const useSessionCheckbox = document.getElementById('stabUseSession');
    const isTippedCheckbox = document.getElementById('stabIsTipped');
    
    const firearmSelectContainer = document.getElementById('stabFirearmSelectContainer');
    const loadSelectContainer = document.getElementById('stabLoadSelectContainer');
    const manualBulletContainer = document.getElementById('stabManualBulletContainer');
    const sessionSelectContainer = document.getElementById('stabSessionSelectContainer');
    const tipLengthContainer = document.getElementById('stabTipLengthContainer');

    if (calculateBtn) calculateBtn.addEventListener('click', calculateStability);
    if (firearmSelect) firearmSelect.addEventListener('change', handleFirearmChange);
    if (loadSelect) loadSelect.addEventListener('change', handleLoadChange);
    if (bulletSelect) bulletSelect.addEventListener('change', handleBulletChange);
    if (sessionSelect) sessionSelect.addEventListener('change', handleSessionChange);
    if (caliberFilterSelect) caliberFilterSelect.addEventListener('change', refreshBulletInventoryDropdown);

    if (useFirearmDataCheckbox) {
        useFirearmDataCheckbox.addEventListener('change', (e) => {
            firearmSelectContainer.style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) {
                handleFirearmChange();
            } else {
                if (firearmSelect) firearmSelect.value = '';
            }
        });
    }
    
    if (useLoadBulletCheckbox) {
        useLoadBulletCheckbox.addEventListener('change', (e) => {
            loadSelectContainer.style.display = e.target.checked ? 'block' : 'none';
            manualBulletContainer.style.display = e.target.checked ? 'none' : 'block';
            if (e.target.checked) handleLoadChange(); else handleBulletChange();
        });
    }

    if (useSessionCheckbox) {
        useSessionCheckbox.addEventListener('change', (e) => {
            sessionSelectContainer.style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) handleSessionChange();
        });
    }

    if (isTippedCheckbox) {
        isTippedCheckbox.addEventListener('change', (e) => {
            tipLengthContainer.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    refreshStabilityUI();
}

async function refreshBulletInventoryDropdown() {
    const caliberId = document.getElementById('stabBulletCaliberSelect').value;
    const bulletSelect = document.getElementById('stabBulletSelect');
    
    const bullets = await getAllItems('bullets');
    const manufacturers = await getAllItems('manufacturers');
    
    const currentVal = bulletSelect.value;
    bulletSelect.innerHTML = '<option value="">-- Manual Entry --</option>';
    
    const filteredBullets = caliberId ? bullets.filter(b => b.diameterId === caliberId) : bullets;
    
    filteredBullets.forEach(b => {
        const mfg = manufacturers.find(m => m.id === b.manufacturerId);
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = `${b.weight}gr ${mfg ? mfg.name : ''} ${b.name}`;
        bulletSelect.appendChild(opt);
    });
    
    if ([...bulletSelect.options].some(o => o.value === currentVal)) {
        bulletSelect.value = currentVal;
    } else {
        bulletSelect.value = "";
    }
}

export async function refreshStabilityUI() {
    const [firearms, loads, bullets, manufacturers, cartridges, sessions, diameters] = await Promise.all([
        getAllItems('firearms'),
        getAllItems('loads'),
        getAllItems('bullets'),
        getAllItems('manufacturers'),
        getAllItems('cartridges'),
        getAllItems('impactData'),
        getAllItems('diameters')
    ]);

    const caliberFilter = document.getElementById('stabBulletCaliberSelect');
    if (caliberFilter) {
        const currentVal = caliberFilter.value;
        caliberFilter.innerHTML = '<option value="">-- All Calibers --</option>';
        diameters.sort((a,b) => (a.imperial || '').localeCompare(b.imperial || '')).forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.imperial;
            caliberFilter.appendChild(opt);
        });
        caliberFilter.value = currentVal;
    }

    const firearmSelect = document.getElementById('stabFirearmSelect');
    if (firearmSelect) {
        const currentVal = firearmSelect.value;
        firearmSelect.innerHTML = '<option value="">-- Select Firearm --</option>';
        firearms.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.nickname;
            firearmSelect.appendChild(opt);
        });
        firearmSelect.value = currentVal;
    }

    const loadSelect = document.getElementById('stabLoadSelect');
    if (loadSelect) {
        const currentVal = loadSelect.value;
        loadSelect.innerHTML = '<option value="">-- Select Load --</option>';
        for (const l of loads) {
            const cartridge = cartridges.find(c => c.id === l.cartridgeId);
            const opt = document.createElement('option');
            opt.value = l.id;
            if (l.loadTypeId === 'LT_COMM') {
                opt.textContent = `${cartridge ? cartridge.name : 'N/A'}: ${l.name}`;
            } else {
                const bullet = bullets.find(b => b.id === l.bulletId);
                opt.textContent = `${cartridge ? cartridge.name : 'N/A'}: ${bullet ? bullet.weight : '?'}gr Handload`;
            }
            loadSelect.appendChild(opt);
        }
        loadSelect.value = currentVal;
    }

    await refreshBulletInventoryDropdown();

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
        if (!isNaN(twist)) document.getElementById('stabTwist').value = twist;
    }
}

async function handleLoadChange() {
    const id = document.getElementById('stabLoadSelect').value;
    if (!id) return;
    const load = await getItem('loads', id);
    if (load && load.bulletId) populateBulletFields(load.bulletId);
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
            const useFirearmCb = document.getElementById('stabUseFirearmData');
            if (useFirearmCb) useFirearmCb.checked = true;
            document.getElementById('stabFirearmSelectContainer').style.display = 'block';
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
        if (session.altitude !== undefined && session.altitude !== null) document.getElementById('stabAltitude').value = session.altitude;
        if (session.pressureType) document.getElementById('stabPressureType').value = session.pressureType;
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
        if (bullet.stability_vars && bullet.stability_vars.is_tipped) {
             document.getElementById('stabIsTipped').checked = true;
             document.getElementById('stabTipLengthContainer').style.display = 'block';
             document.getElementById('stabTipLength').value = bullet.stability_vars.tip_length || 0;
        } else {
             document.getElementById('stabIsTipped').checked = false;
             document.getElementById('stabTipLengthContainer').style.display = 'none';
        }
        const diameter = await getItem('diameters', bullet.diameterId);
        if (diameter) {
            const match = diameter.imperial.match(/[0-9.]+/);
            if (match) {
                let val = parseFloat(match[0]);
                if (val > 1) val = val / 1000;
                document.getElementById('stabBulletDiameter').value = val;
            }
        }
    }
}

function calculateStability() {
    const m = parseFloat(document.getElementById('stabBulletWeight').value); // gr
    const d = parseFloat(document.getElementById('stabBulletDiameter').value); // in
    const totalL = parseFloat(document.getElementById('stabBulletLength').value); // in
    const t = parseFloat(document.getElementById('stabTwist').value); // in
    const v = parseFloat(document.getElementById('stabVelocity').value); // fps
    const temp = parseFloat(document.getElementById('stabTemp').value); // F
    const alt = parseFloat(document.getElementById('stabAltitude').value); // ft
    const pInput = parseFloat(document.getElementById('stabPressure').value); // inHg
    const pType = document.getElementById('stabPressureType').value;
    const isTipped = document.getElementById('stabIsTipped').checked;
    const tipL = parseFloat(document.getElementById('stabTipLength').value) || 0;

    const output = document.getElementById('stabilityResultOutput');
    const deepDive = document.getElementById('stabilityDeepDive');
    const deepDiveContent = document.getElementById('stabDeepDiveContent');

    if (isNaN(m) || isNaN(d) || isNaN(totalL) || isNaN(t) || isNaN(v)) {
        output.innerHTML = '<p style="color: #ef4444;">Please fill in all required fields.</p>';
        return;
    }

    // 1. Tip Correction (Effective Length Logic)
    const l = isTipped ? (totalL - tipL) : totalL;

    // 2. Air Density Ratio (ADR)
    // Relative to Sea Level Standard (59F, 29.92 inHg)
    let stationPressure = pInput;
    if (pType === 'sea') {
        stationPressure = pInput * Math.pow(1 - (0.0000068755 * alt), 5.2559);
    }
    const adr = (stationPressure / 29.92) * (518.67 / (temp + 459.67));

    // 3. Miller Twist Formula (Standard Logic)
    // Formula for Twist in inches (T):
    // Sg = (30 * m) / (T^2 * l * (1 + (l/d)^2))
    // This assumes T is in inches and l is in inches.
    const ld = l / d;
    let sg = (30 * m) / (Math.pow(t, 2) * l * (1 + Math.pow(ld, 2)));

    // 4. Velocity Correction
    // Miller is for 2800 fps. Refined Miller uses (v/2800)^(1/3).
    const velFactor = Math.pow(v / 2800, 1/3);
    sg *= velFactor;

    // 5. Air Density Correction
    // Stability is inversely proportional to air density.
    sg = sg / adr;

    let color = "#ef4444"; 
    let status = "Unstable";
    if (sg >= 1.5) { color = "#10b981"; status = "Stable"; }
    else if (sg >= 1.1) { color = "#f59e0b"; status = "Marginally Stable"; }

    output.innerHTML = `
        <div style="font-size: 3rem; font-weight: 700; color: ${color};">${sg.toFixed(2)}</div>
        <div style="font-size: 1.5rem; color: ${color}; margin-top: 0.5rem;">${status}</div>
    `;

    deepDive.style.display = 'block';
    deepDiveContent.innerHTML = `
        <p>Metal Length: ${l.toFixed(3)}"</p>
        <p>Length/Diameter Ratio: ${ld.toFixed(3)}</p>
        <p>Station Pressure: ${stationPressure.toFixed(2)} inHg</p>
        <p>Air Density Ratio (ADR): ${adr.toFixed(4)}</p>
        <p>Velocity Correction: ${velFactor.toFixed(4)}</p>
    `;
}
