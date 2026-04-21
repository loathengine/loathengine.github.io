import os

js_dir = '/home/jobelche/Documents/github/loathengine.github.io/js'

replacements = [
    ("m.type && m.type.includes('bullet')", "m.type && m.type.includes && m.type.includes('bullet')"),
    ("m.type && m.type.includes('powder')", "m.type && m.type.includes && m.type.includes('powder')"),
    ("m.type && m.type.includes('primer')", "m.type && m.type.includes && m.type.includes('primer')"),
    ("m.type && m.type.includes('brass')", "m.type && m.type.includes && m.type.includes('brass')"),
    ("m.type && m.type.includes('ammo')", "m.type && m.type.includes && m.type.includes('ammo')"),
    ("m => m.type && m.type.includes(filterType)", "m => m.type && m.type.includes && m.type.includes(filterType)"),
    ("item.type && item.type.includes(cb.value)", "item.type && item.type.includes && item.type.includes(cb.value)"),
    ("d.imperial && d.imperial.toLowerCase().includes", "d.imperial && String(d.imperial).toLowerCase().includes"),
    ("d.metric && d.metric.toLowerCase().includes", "d.metric && String(d.metric).toLowerCase().includes"),
]

for root, dirs, files in os.walk(js_dir):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r') as fp:
                content = fp.read()
            
            new_content = content
            for old, new in replacements:
                new_content = new_content.replace(old, new)
                
            if new_content != content:
                with open(path, 'w') as fp:
                    fp.write(new_content)
                print(f'Patched includes in {f}')
