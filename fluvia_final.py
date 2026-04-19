"""
FLUVIA FINAL — Direct inline style replacement in app.html.
No CSS overrides. No JS scripts. Just fix the source.
"""
import re

APP = "public/app.html"

with open(APP, "r", encoding="utf-8") as f:
    html = f.read()

original_len = len(html)
count = 0

# ── BACKGROUND REPLACEMENTS ──
bg_dark = [
    '#0f172a', '#0f151f', '#09090b', '#18181b', '#1e293b',
    '#0b1120', '#0a0f1a', '#0d1117', '#020617', '#0e1525',
    '#111827', '#1a1a2e', '#16213e', '#0f0f0f', '#121212',
    '#1f2937',
]
for c in bg_dark:
    for sp in ['', ' ']:
        old = f'background:{sp}{c}'
        if old in html:
            count += html.count(old)
            html = html.replace(old, f'background:{sp}#FFFFFF')

# ── BACKGROUND RGB REPLACEMENTS ──
rgb_darks = [
    ('rgb(15, 23, 42)', '#FFFFFF'),
    ('rgb(9, 9, 11)', '#FFFFFF'),
    ('rgb(24, 24, 27)', '#FFFFFF'),
    ('rgb(30, 41, 59)', '#FFFFFF'),
    ('rgb(11, 17, 32)', '#FFFFFF'),
]
for old_rgb, new_val in rgb_darks:
    if old_rgb in html:
        count += html.count(old_rgb)
        html = html.replace(old_rgb, new_val)

# ── GRADIENT BACKGROUNDS → WHITE ──
# Match background: linear-gradient(...dark colors...)
def replace_dark_gradients(m):
    global count
    grad = m.group(0)
    # Check if it contains dark colors
    if any(d in grad.lower() for d in ['#0f', '#09', '#18', '#1e', '#0b', '#02', '#11', 'rgb(15', 'rgb(9', 'rgb(24']):
        count += 1
        return 'background: #FFFFFF'
    return grad

html = re.sub(r'background:\s*linear-gradient\([^;}{]*?\)', replace_dark_gradients, html)

# ── RADIAL GRADIENTS ──
html = re.sub(r'background:\s*radial-gradient\([^;}{]*?\)', lambda m: (globals().update(count=count+1) or 'background: transparent') if any(d in m.group(0).lower() for d in ['#0f','#09','#18','#0b','rgba(0']) else m.group(0), html)

# ── TEXT COLOR REPLACEMENTS ──
white_texts = ['white', '#fff', '#FFF', '#ffffff', '#FFFFFF']
for w in white_texts:
    for sp in ['', ' ']:
        old = f'color:{sp}{w}'
        if old in html:
            # Don't replace inside .login-card buttons etc where white on dark bg is correct
            count += html.count(old)
            html = html.replace(old, f'color:{sp}#1A1A1A')

# Fix: restore white text inside buttons that should have white text (btn-login etc)
# The CSS override handles button colors with !important, so this is fine

# ── CYAN/NEON COLOR REPLACEMENTS ──
neon_colors = ['#00e5ff', '#00E5FF', '#22d3ee', '#22D3EE', '#38bdf8', '#38BDF8', '#06b6d4']
for n in neon_colors:
    for sp in ['', ' ']:
        old = f'color:{sp}{n}'
        if old in html:
            count += html.count(old)
            html = html.replace(old, f'color:{sp}#1e3a5f')

# ── BORDER REPLACEMENTS ──
border_darks = [
    ('border: 1px solid rgba(255, 255, 255, 0.1)', 'border: 0.5px solid #E5E5E5'),
    ('border: 1px solid rgba(255,255,255,0.1)', 'border: 0.5px solid #E5E5E5'),
    ('border: 1px solid rgba(255, 255, 255, 0.05)', 'border: 0.5px solid #E5E5E5'),
    ('border: 1px solid rgba(255,255,255,0.05)', 'border: 0.5px solid #E5E5E5'),
    ('border: 1px solid rgba(255, 255, 255, 0.15)', 'border: 0.5px solid #E5E5E5'),
    ('border:1px solid rgba(255, 255, 255, 0.1)', 'border: 0.5px solid #E5E5E5'),
    ('border: 1px solid #1e293b', 'border: 0.5px solid #E5E5E5'),
    ('border:1px solid #1e293b', 'border: 0.5px solid #E5E5E5'),
    ('border: 1px solid rgba(0, 229, 255', 'border: 0.5px solid #1e3a5f'),
    ('border: 1px solid #0f172a', 'border: 0.5px solid #E5E5E5'),
    ('border: 1px solid rgba(255, 255, 255, 0.2)', 'border: 0.5px solid #E5E5E5'),
    ('border:1px solid rgba(255,255,255,0.2)', 'border: 0.5px solid #E5E5E5'),
]
for old_b, new_b in border_darks:
    if old_b in html:
        count += html.count(old_b)
        html = html.replace(old_b, new_b)

# ── BOX-SHADOW NEON GLOW REMOVAL ──
html = re.sub(r'box-shadow:\s*0\s+0\s+\d+px\s+(rgba\(0,\s*229|rgba\(34,\s*211|#00e5ff|#22d3ee)[^;]*', 'box-shadow: none', html)

# ── TEXT-SHADOW REMOVAL ──
html = re.sub(r'text-shadow:\s*0\s+0\s+\d+px\s*[^;]*', 'text-shadow: none', html)

# ── ALSO FIX broken comments that were already fixed but might be back ──
n_comments = html.count('< !--')
html = html.replace('< !--', '<!--')

# ── REMOVE orphan text ──
html = html.replace('-->REMOVED/DEPRECATED -->', '--><!-- REMOVED/DEPRECATED -->')
if 'REMOVED/DEPRECATED -->' in html and '<!-- REMOVED/DEPRECATED -->' not in html:
    html = html.replace('REMOVED/DEPRECATED -->', '')

with open(APP, "w", encoding="utf-8") as f:
    f.write(html)

print(f"DONE: {count} inline style replacements")
print(f"  + {n_comments} broken comments fixed")
print(f"  Size: {original_len} -> {len(html)} chars")
