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

            // Revert all array.length_inches back to array.length
            content = content.replace(/\.length_inches\b/g, '.length');
            
            // Specifically change bullet lengths ONLY for clear references
            content = content.replace(/bullet\.length\b/g, 'bullet.length_inches');
            // Check components.js rendering
            // bulletLength input uses length
            // We want item.length_inches in components.js if it's the bullet object?
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Reverted length in: ${fullPath}`);
            }
        }
    }
}

crawlAndReplace(jsDir);
console.log('Revert script complete.');
