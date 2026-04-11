const fs = require('fs');
const path = require('path');

const projectRoot = '/home/jbelcher/Documents/github/loathengine.github.io';
const jsDir = path.join(projectRoot, 'js');
const dbFile = path.join(projectRoot, 'master-db.json');

// 1. Update Master DB
let rawDb = fs.readFileSync(dbFile, 'utf8');
let db = JSON.parse(rawDb);

if (db._metadata) {
  db._metadata.schemaVersion = "1.1.0";
  db._metadata.unitStandards = {
    weight: "grains",
    length: "inches",
    diameter: "inches",
    velocity: "fps",
    pressure: "psi"
  };
}

// Convert bullets back
if (db.bullets) {
  db.bullets = db.bullets.map(b => {
    let newB = { ...b };
    if (newB.weight_grains !== undefined) {
      newB.weight = newB.weight_grains;
      delete newB.weight_grains;
    }
    if (newB.length_inches !== undefined) {
      newB.length = newB.length_inches;
      delete newB.length_inches;
    }
    if (newB.stability_vars) {
      if (newB.stability_vars.tip_length_inches !== undefined) {
        newB.stability_vars.tip_length = newB.stability_vars.tip_length_inches;
        delete newB.stability_vars.tip_length_inches;
      }
      if (newB.stability_vars.meplat_diameter_inches !== undefined) {
        newB.stability_vars.meplat_diameter = newB.stability_vars.meplat_diameter_inches;
        delete newB.stability_vars.meplat_diameter_inches;
      }
    }
    return newB;
  });
}

// Convert Cartridges back
if (db.cartridges) {
  db.cartridges = db.cartridges.map(c => {
    let newC = { ...c };
    if (newC.max_case_length_inches !== undefined) {
      newC.maxCaseLength = newC.max_case_length_inches;
      delete newC.max_case_length_inches;
    }
    if (newC.trim_length_inches !== undefined) {
      newC.trimLength = newC.trim_length_inches;
      delete newC.trim_length_inches;
    }
    if (newC.max_oal_inches !== undefined) {
      newC.oal = newC.max_oal_inches;
      delete newC.max_oal_inches;
    }
    return newC;
  });
}

// Brass changes
if (db.brass) {
  db.brass = db.brass.map(b => {
    let newB = { ...b };
    if (newB.primer_pocket_size !== undefined) {
      newB.primerPocket = newB.primer_pocket_size;
      delete newB.primer_pocket_size;
    }
    return newB;
  });
}

fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
console.log('Updated master-db.json');

// 2. Crawl and Revert JS/HTML files
function crawlAndReplace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            crawlAndReplace(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Simple replacements
            content = content.replace(/\.weight_grains\b/g, '.weight');
            content = content.replace(/\.length_inches\b/g, '.length');
            content = content.replace(/\.meplat_diameter_inches\b/g, '.meplat_diameter');
            content = content.replace(/\.tip_length_inches\b/g, '.tip_length');
            
            content = content.replace(/\.max_case_length_inches\b/g, '.maxCaseLength');
            content = content.replace(/\.trim_length_inches\b/g, '.trimLength');
            
            content = content.replace(/\.max_oal_inches\b/g, '.oal');
            content = content.replace(/['"]max_oal_inches['"]/g, '"oal"');
            
            content = content.replace(/['"]max_case_length_inches['"]/g, '"maxCaseLength"');
            content = content.replace(/['"]trim_length_inches['"]/g, '"trimLength"');
            
            content = content.replace(/\.primer_pocket_size\b/g, '.primerPocket');
            content = content.replace(/['"]primer_pocket_size['"]/g, '"primerPocket"');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Reverted JS file: ${fullPath}`);
            }
        }
    }
}

crawlAndReplace(jsDir);
console.log('Script complete.');
