"""
FLUVIA CSS-ONLY — No HTML replacement.
Only fixes broken comments + adds CSS import.
All visual transformation happens in fluvia-override.css.
"""
import os

APP_HTML = "public/app.html"

with open(APP_HTML, "r", encoding="utf-8") as f:
    content = f.read()

print(f"[1] Read app.html: {len(content)} chars")

# Fix broken comments
n = content.count("< !--")
content = content.replace("< !--", "<!--")
print(f"[2] Fixed {n} broken comments")

# Fix orphaned text
content = content.replace("-->REMOVED/DEPRECATED -->", "--><!-- REMOVED/DEPRECATED -->")
# Nuclear: remove any remaining REMOVED/DEPRECATED text
if "REMOVED/DEPRECATED -->" in content:
    content = content.replace("REMOVED/DEPRECATED -->", "<!-- REMOVED/DEPRECATED -->")
print("[3] Fixed orphaned text")

# Add fluvia-override.css import (THE KEY FIX)
if 'fluvia-override.css' not in content:
    content = content.replace(
        'elite-bundle.css?v=ELITE_PROX_GEN">',
        'elite-bundle.css?v=ELITE_PROX_GEN">\n    <link rel="stylesheet" href="css/fluvia-override.css?v=3">'
    )
    print("[4] Added fluvia-override.css import")

# Also add Newsreader font import if missing
if 'Newsreader' not in content:
    content = content.replace(
        '<link\n        href="https://fonts.googleapis.com/css2?family=Inter',
        '<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500;6..72,600;6..72,700&display=swap" rel="stylesheet">\n    <link\n        href="https://fonts.googleapis.com/css2?family=Inter'
    )
    print("[5] Added Newsreader font import")

with open(APP_HTML, "w", encoding="utf-8") as f:
    f.write(content)

# Verify
problems = ["< !--"]
found = [p for p in problems if p in content]
if found:
    print(f"WARNING: {found}")
else:
    print("[OK] Clean HTML, no broken text")

print(f"Written: {len(content)} chars")
