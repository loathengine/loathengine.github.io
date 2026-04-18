import os, re
from glob import glob

# Collect all IDs from HTML files
html_ids = set()
for filepath in glob('tabs/*.html') + ['index.html']:
    with open(filepath, 'r') as f:
        content = f.read()
        ids = re.findall(r'id=["\']([^"\']+)["\']', content)
        html_ids.update(ids)

# Check all getElementById in JS files
js_files = glob('js/*.js') + glob('js/*/*.js')
for filepath in js_files:
    with open(filepath, 'r') as f:
        content = f.read()
        js_ids = re.findall(r'getElementById\([\'"]([^\'"]+)[\'"]\)', content)
        for js_id in js_ids:
            if js_id not in html_ids:
                print(f"MISSING ID: '{js_id}' referenced in {filepath}")

