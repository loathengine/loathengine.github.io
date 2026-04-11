const fs = require('fs');
const path = require('path');

const jsDir = '/home/jbelcher/Documents/github/loathengine.github.io/js';

function crawlAndReplace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            crawlAndReplace(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // 1. Bullet properties
            content = content.replace(/\.weight\b/g, '.weight_grains');
            content = content.replace(/\.length\b/g, '.length_inches');
            content = content.replace(/\.meplat_diameter\b/g, '.meplat_diameter_inches');
            content = content.replace(/\.tip_length\b/g, '.tip_length_inches');
            
            // 2. Cartridge properties
            content = content.replace(/\.maxCaseLength\b/g, '.max_case_length_inches');
            content = content.replace(/\.trimLength\b/g, '.trim_length_inches');
            
            content = content.replace(/\bcartridge\.oal\b/g, 'cartridge.max_oal_inches');
            content = content.replace(/\bc\.oal\b/g, 'c.max_oal_inches');
            content = content.replace(/['"]oal['"]/g, '"max_oal_inches"'); // In components.js it uses string headers

            content = content.replace(/['"]maxCaseLength['"]/g, '"max_case_length_inches"');
            content = content.replace(/['"]trimLength['"]/g, '"trim_length_inches"');

            // 3. Brass properties
            content = content.replace(/\.primerPocket\b/g, '.primer_pocket_size');
            content = content.replace(/['"]primerPocket['"]/g, '"primer_pocket_size"');
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

crawlAndReplace(jsDir);
console.log('Mass replace script complete.');
