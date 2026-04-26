// js/db-management/export.js
import { getItem } from '../db.js';
import { calculateStatsForSession } from '../analysis/stats.js';
import { generateAnalysisCanvas } from '../analysis/export.js';
import { triggerDownload, createSessionName } from '../utils.js';

export async function handleSessionExport() {
    const select = document.getElementById('aiExportSessionSelect');
    const selectedIds = Array.from(select.selectedOptions).map(opt => opt.value);
    
    if (selectedIds.length === 0) {
        alert("Please select at least one session to export.");
        return;
    }

    const readableDataArray = [];
    const plotPayload = [];
    
    // Build raw DB import object
    const dbImport = {
        impactData: [],
        firearms: [], loads: [], targetImages: [],
        bullets: [], powders: [], brass: [], primers: [],
        manufacturers: [], cartridges: [], diameters: []
    };
    
    // Use Sets to prevent duplicates
    const trackedIds = {
        firearms: new Set(),
        loads: new Set(),
        targetImages: new Set(),
        bullets: new Set(),
        powders: new Set(),
        brass: new Set(),
        primers: new Set(),
        manufacturers: new Set(),
        cartridges: new Set(),
        diameters: new Set()
    };

    for (const sessionId of selectedIds) {
        const session = await getItem('impactData', sessionId);
        if (!session) continue;
        
        dbImport.impactData.push(session);

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

        // Targets
        if (session.targets) {
            for (const t of session.targets) {
                if (t.targetImageId && !trackedIds.targetImages.has(t.targetImageId)) {
                    trackedIds.targetImages.add(t.targetImageId);
                    const targetImage = await getItem('targetImages', t.targetImageId);
                    if (targetImage) dbImport.targetImages.push(targetImage);
                }
            }
        }

        // Firearm
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
                
                if (!trackedIds.firearms.has(session.firearmId)) {
                    trackedIds.firearms.add(session.firearmId);
                    dbImport.firearms.push(firearm);
                }
                if (firearm.manufacturerId) trackedIds.manufacturers.add(firearm.manufacturerId);
            }
        }

        // Load
        if (session.loadId) {
            const load = await getItem('loads', session.loadId);
            if (load) {
                readableData.load = {
                    name: load.name,
                    type: load.loadTypeId
                };
                
                if (!trackedIds.loads.has(session.loadId)) {
                    trackedIds.loads.add(session.loadId);
                    dbImport.loads.push(load);
                }
                
                if (load.manufacturerId) trackedIds.manufacturers.add(load.manufacturerId);
                if (load.cartridgeId) trackedIds.cartridges.add(load.cartridgeId);

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
                        
                        if (!trackedIds.bullets.has(load.bulletId)) {
                            trackedIds.bullets.add(load.bulletId);
                            dbImport.bullets.push(bullet);
                        }
                        
                        if (bullet.manufacturerId) trackedIds.manufacturers.add(bullet.manufacturerId);
                        if (bullet.diameterId) trackedIds.diameters.add(bullet.diameterId);
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
                        
                        if (!trackedIds.powders.has(load.powderId)) {
                            trackedIds.powders.add(load.powderId);
                            dbImport.powders.push(powder);
                        }
                        if (powder.manufacturerId) trackedIds.manufacturers.add(powder.manufacturerId);
                    }
                }
                if (load.primerId) {
                     const primer = await getItem('primers', load.primerId);
                     if (primer) {
                         readableData.load.primer = primer.name;
                         if (!trackedIds.primers.has(load.primerId)) {
                             trackedIds.primers.add(load.primerId);
                             dbImport.primers.push(primer);
                         }
                         if (primer.manufacturerId) trackedIds.manufacturers.add(primer.manufacturerId);
                     }
                }
                if (load.brassId) {
                     const brass = await getItem('brass', load.brassId);
                     if (brass) {
                         readableData.load.brass = brass.name;
                         if (!trackedIds.brass.has(load.brassId)) {
                             trackedIds.brass.add(load.brassId);
                             dbImport.brass.push(brass);
                         }
                         if (brass.manufacturerId) trackedIds.manufacturers.add(brass.manufacturerId);
                     }
                }
                if (load.coal) readableData.load.coal = load.coal;
                if (load.cbto) readableData.load.cbto = load.cbto;
            }
        }

        const stats = calculateStatsForSession(session.shots, session.targetDistance, session.distanceUnits);
        if (stats) {
            readableData.stats = stats;
            plotPayload.push({ session, shots: stats.normalizedShots || session.shots, stats, sessionName });
        }
        
        readableDataArray.push(readableData);
    } // End of session loop

    // Fetch relational dependencies that were crawled
    for (const mId of trackedIds.manufacturers) { const m = await getItem('manufacturers', mId); if (m) dbImport.manufacturers.push(m); }
    for (const dId of trackedIds.diameters) { const d = await getItem('diameters', dId); if (d) dbImport.diameters.push(d); }
    for (const cId of trackedIds.cartridges) { const c = await getItem('cartridges', cId); if (c) dbImport.cartridges.push(c); }

    const finalDbImport = {};
    for (const key in dbImport) {
        if (dbImport[key].length > 0) finalDbImport[key] = dbImport[key];
    }
    
    // Create combined JSON export
    const exportData = {
        developer_notes: {
            description: "This file contains a complete relational snapshot of one or more precision ballistics sessions.",
            image_decoding: [
                "The analysis plot is stored as a Base64 data URI in 'analysis_plot_base64'.",
                "Raw target images are stored in 'database_import.targetImages[].dataUrl' as Base64 data URIs.",
                "To save these strings as image files (e.g., in Python):",
                "1. Strip the prefix (e.g., 'data:image/png;base64,').",
                "2. Decode the remaining string using base64.b64decode().",
                "3. Write the resulting bytes to a file (e.g., 'image.png')."
            ]
        },
        readable_session_data: readableDataArray,
        database_import: finalDbImport,
        analysis_plot_base64: null
    };

    // Generate Plot Canvas and embed as Base64 string
    if (plotPayload.length > 0) {
        const canvas = await generateAnalysisCanvas(plotPayload);
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
