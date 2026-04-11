const fs = require('fs');

const raw = fs.readFileSync('/home/jbelcher/Documents/github/loathengine.github.io/master-db.json', 'utf8');
const db = JSON.parse(raw);

const newDb = {
  "_metadata": {
    "schemaVersion": "1.0.0",
    "lastUpdated": new Date().toISOString(),
    "unitSystem": "imperial",
    "license": "MIT",
    "description": "Open Source Ballistics Component Database"
  }
};

for (const key of ['manufacturers', 'diameters', 'powders', 'primers']) {
  newDb[key] = db[key] || [];
}

newDb.cartridges = (db.cartridges || []).map(c => {
  return {
    id: c.id,
    name: c.name,
    diameterId: c.diameterId,
    max_oal_inches: c.oal,
    max_case_length_inches: c.maxCaseLength,
    trim_length_inches: c.trimLength
  };
});

newDb.brass = (db.brass || []).map(b => {
  let pp = b.primerPocket;
  let pps = pp ? (pp.toLowerCase().includes('small') ? 'SMALL' : 'LARGE') : null;
  return {
    id: b.id,
    cartridgeId: b.cartridgeId,
    manufacturerId: b.manufacturerId,
    primer_pocket_size: pps,
    primerHole: b.primerHole
  };
});

newDb.bullets = (db.bullets || []).map(b => {
  const st = b.stability_vars || {};
  return {
    id: b.id,
    manufacturerId: b.manufacturerId,
    diameterId: b.diameterId,
    name: b.name,
    weight_grains: b.weight,
    length_inches: b.length,
    stability_vars: {
      ix: st.ix,
      iy: st.iy,
      cg_from_base: st.cg_from_base,
      meplat_diameter_inches: st.meplat_diameter,
      is_tipped: st.is_tipped,
      tip_length_inches: st.tip_length
    },
    ballistics: b.ballistics,
    drag_model: b.drag_model
  };
});

for (const key of ['firearms', 'loads', 'impactData', 'targetImages', 'customTargets']) {
  if (db[key]) newDb[key] = db[key];
}

fs.writeFileSync('/home/jbelcher/Documents/github/loathengine.github.io/master-db.json', JSON.stringify(newDb, null, 2));
