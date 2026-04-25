// js/db-management/export.js
import { getItem } from '../db.js';
import { calculateStatsForSession } from '../analysis/stats.js';
import { generateAnalysisCanvas } from '../analysis/export.js';
import { triggerDownload, createSessionName } from '../utils.js';

export async function handleSessionExport() {
    const sessionId = document.getElementById('aiExportSessionSelect').value;
    if (!sessionId) {
        alert("Please select a session to export.");
        return;
    }

    const session = await getItem('impactData', sessionId);
    if (!session) {
        alert("Session not found.");
        return;
    }

    const sessionName = await createSessionName(session);

    const readableData = {
        export_purpose: "Human-readable and easily parsed session data.",
        sessionName: sessionName,
        environmental: {
            temperature: session.temp,
            altitude: session.altitude,
            pressure: session.pressure,
            pressureType: session.pressureType,
            targetDistance: session.targetDistance,
            distanceUnits: session.distanceUnits
        },
        firearm: null,
        load: null,
        stats: null,
        shots: session.shots || []
    };

    if (session.firearmId) {
        const firearm = await getItem('firearms', session.firearmId);
        if (firearm) {
            readableData.firearm = {
                nickname: firearm.nickname,
                manufacturer: firearm.manufacturer,
                model: firearm.model,
                caliber: firearm.caliber,
                barrelLength: firearm.barrelLength,
                twistRate: firearm.twistRate,
                optic: firearm.optic
            };
        }
    }

    if (session.loadId) {
        const load = await getItem('loads', session.loadId);
        if (load) {
            readableData.load = {
                name: load.name,
                type: load.loadTypeId
            };
            if (load.bulletId) {
                const bullet = await getItem('bullets', load.bulletId);
                if (bullet) {
                    const bMfg = await getItem('manufacturers', bullet.manufacturerId);
                    readableData.load.bullet = {
                        manufacturer: bMfg ? bMfg.name : 'Unknown',
                        name: bullet.name,
                        weight: bullet.weight,
                        bcG1: bullet.bcG1,
                        bcG7: bullet.bcG7
                    };
                }
            }
            if (load.powderId) {
                const powder = await getItem('powders', load.powderId);
                if (powder) {
                    const pMfg = await getItem('manufacturers', powder.manufacturerId);
                    readableData.load.powder = {
                        manufacturer: pMfg ? pMfg.name : 'Unknown',
                        name: powder.name,
                        chargeWeight: load.chargeWeight
                    };
                }
            }
            if (load.primerId) {
                 const primer = await getItem('primers', load.primerId);
                 if (primer) readableData.load.primer = primer.name;
            }
            if (load.brassId) {
                 const brass = await getItem('brass', load.brassId);
                 if (brass) readableData.load.brass = brass.name;
            }
            if (load.coal) readableData.load.coal = load.coal;
            if (load.cbto) readableData.load.cbto = load.cbto;
        }
    }

    const stats = calculateStatsForSession(session.shots, session.targetDistance, session.distanceUnits);
    if (stats) {
        readableData.stats = stats;
    }

    // Build raw DB import object
    const dbImport = {
        impactData: [session],
        firearms: [], loads: [], targetImages: [],
        bullets: [], powders: [], brass: [], primers: [],
        manufacturers: [], cartridges: [], diameters: []
    };
    const manufacturerIds = new Set();
    const diameterIds = new Set();
    const cartridgeIds = new Set();

    if (session.targets) {
        for (const t of session.targets) {
            const targetImage = await getItem('targetImages', t.targetImageId);
            if (targetImage) dbImport.targetImages.push(targetImage);
        }
    }

    if (session.firearmId) {
        const firearm = await getItem('firearms', session.firearmId);
        if (firearm) {
            dbImport.firearms.push(firearm);
            if (firearm.manufacturerId) manufacturerIds.add(firearm.manufacturerId);
        }
    }

    if (session.loadId) {
        const load = await getItem('loads', session.loadId);
        if (load) {
            dbImport.loads.push(load);
            if (load.manufacturerId) manufacturerIds.add(load.manufacturerId);
            if (load.cartridgeId) cartridgeIds.add(load.cartridgeId);

            if (load.bulletId) {
                const bullet = await getItem('bullets', load.bulletId);
                if (bullet) {
                    dbImport.bullets.push(bullet);
                    if (bullet.manufacturerId) manufacturerIds.add(bullet.manufacturerId);
                    if (bullet.diameterId) diameterIds.add(bullet.diameterId);
                }
            }
            if (load.powderId) {
                const powder = await getItem('powders', load.powderId);
                if (powder) {
                    dbImport.powders.push(powder);
                    if (powder.manufacturerId) manufacturerIds.add(powder.manufacturerId);
                }
            }
            if (load.primerId) {
                 const primer = await getItem('primers', load.primerId);
                 if (primer) { dbImport.primers.push(primer); if (primer.manufacturerId) manufacturerIds.add(primer.manufacturerId); }
            }
            if (load.brassId) {
                 const brass = await getItem('brass', load.brassId);
                 if (brass) { dbImport.brass.push(brass); if (brass.manufacturerId) manufacturerIds.add(brass.manufacturerId); }
            }
        }
    }

    for (const mId of manufacturerIds) { const m = await getItem('manufacturers', mId); if (m) dbImport.manufacturers.push(m); }
    for (const dId of diameterIds) { const d = await getItem('diameters', dId); if (d) dbImport.diameters.push(d); }
    for (const cId of cartridgeIds) { const c = await getItem('cartridges', cId); if (c) dbImport.cartridges.push(c); }

    const finalDbImport = {};
    for (const key in dbImport) {
        if (dbImport[key].length > 0) finalDbImport[key] = dbImport[key];
    }
    
    // Create combined JSON export
    const exportData = {
        developer_notes: {
            description: "This file contains a complete relational snapshot of a precision ballistics session.",
            image_decoding: [
                "The analysis plot is stored as a Base64 data URI in 'analysis_plot_base64'.",
                "Raw target images are stored in 'database_import.targetImages[].dataUrl' as Base64 data URIs.",
                "To save these strings as image files (e.g., in Python):",
                "1. Strip the prefix (e.g., 'data:image/png;base64,').",
                "2. Decode the remaining string using base64.b64decode().",
                "3. Write the resulting bytes to a file (e.g., 'image.png')."
            ]
        },
        readable_session_data: readableData,
        database_import: finalDbImport,
        analysis_plot_base64: null
    };

    // Generate Plot Canvas and embed as Base64 string
    if (stats) {
        const canvas = await generateAnalysisCanvas([{ session, shots: session.shots, stats, sessionName }]);
        if (canvas) {
            const dataUrl = canvas.toDataURL("image/png");
            exportData.analysis_plot_base64 = dataUrl;
        }
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    
    const now = new Date();
    const timestamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0');
    
    triggerDownload(jsonString, `Session_Export_${timestamp}.json`);
}
