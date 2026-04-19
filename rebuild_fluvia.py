"""
REBUILD FLUVIA v2 - Script definitivo.
Arregla TODOS los bugs HTML, inyecta CSS Fluvia, reemplaza cada vista.
"""
import os
import re

APP_HTML = "public/app.html"

VIEW_MAP = {
    "public/admin-fluvia.html":              "view-dashboard",
    "public/admin-convoys-fluvia.html":      "view-convoys",
    "public/admin-viajes-fluvia.html":       "view-viajes",
    "public/admin-tripulacion-fluvia.html":  "view-tripulacion",
    "public/admin-bitacora-fluvia.html":     "view-bitacora",
    "public/admin-mantenimiento-fluvia.html":"view-mantenimiento",
    "public/admin-combustible-fluvia.html":  "view-combustible",
    "public/admin-comunicaciones-fluvia.html":"view-comunicaciones",
    "public/admin-flota-fluvia.html":        "view-fleet-unique",
    "public/admin-mapa-flota-fluvia.html":   "view-mapa",
    "public/admin-hidrologia-fluvia.html":   "view-hidrologia",
    "public/admin-reportes-fluvia.html":     "view-reportes",
}


def find_matching_close_div(html, start_after):
    """Find the matching </div> starting after position start_after, skipping scripts."""
    pos = start_after
    depth = 1
    while pos < len(html) and depth > 0:
        # Skip <script>...</script>
        if html[pos:pos+7].lower() == '<script':
            se = html.find('</script>', pos)
            if se == -1: break
            pos = se + 9
            continue
        # Skip <!-- ... -->
        if html[pos:pos+4] == '<!--':
            ce = html.find('-->', pos + 4)
            if ce == -1: break
            pos = ce + 3
            continue

        no = html.find('<div', pos)
        nc = html.find('</div>', pos)
        if nc == -1: break

        # Skip script before next div
        ns = html.find('<script', pos)
        if ns != -1 and ns < nc and (no == -1 or ns < no):
            se = html.find('</script>', ns)
            if se == -1: break
            pos = se + 9
            continue

        if no != -1 and no < nc:
            ch = html[no+4:no+5]
            if ch in (' ', '>', '\t', '\n', '\r', '/'):
                depth += 1
            pos = no + 5
        else:
            depth -= 1
            if depth == 0:
                return nc
            pos = nc + 6
    return -1


def extract_content(filepath):
    """Extract the main content div from a Fluvia standalone file.
    Tries 'dashboard-content' first, then falls back to 'main-area'.
    For main-area, strips the topbar if present."""
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    # Try dashboard-content first
    m = re.search(r'<div\s+class="dashboard-content"[^>]*>', html)
    if m:
        start = m.start()
        end = find_matching_close_div(html, m.end())
        if end != -1:
            return html[start:end+6]

    # Fallback: main-area div
    m = re.search(r'<div\s+class="main-area"[^>]*>', html)
    if m:
        start = m.start()
        end = find_matching_close_div(html, m.end())
        if end != -1:
            chunk = html[start:end+6]
            # Strip the topbar div if present inside
            chunk = re.sub(r'<div\s+class="topbar"[^>]*>.*?</div>\s*</div>', '', chunk, count=1, flags=re.DOTALL)
            return chunk

    return None


def replace_view(app_html, view_id, new_html):
    """Replace the inner content of <div id="view-XXX"> in app.html."""
    pat = f'id="{view_id}"'
    idx = app_html.find(pat)
    if idx == -1:
        return app_html, False

    div_start = app_html.rfind('<div', 0, idx)
    if div_start == -1:
        return app_html, False

    tag_end = app_html.find('>', div_start) + 1
    close_pos = find_matching_close_div(app_html, tag_end)
    if close_pos == -1:
        return app_html, False

    result = app_html[:tag_end] + "\n" + new_html + "\n" + app_html[close_pos:]
    return result, True


def main():
    print("=" * 60)
    print("  REBUILD FLUVIA v2")
    print("=" * 60)

    with open(APP_HTML, "r", encoding="utf-8") as f:
        content = f.read()
    print(f"[1] Leido app.html: {len(content)} chars")

    # -- Fix broken comments --
    n1 = content.count("< !--")
    content = content.replace("< !--", "<!--")
    print(f"[2a] Fixed {n1} broken comments")

    # -- Fix orphaned REMOVED/DEPRECATED text --
    # The exact pattern in the file is: --><!-- DISABLED FOR REBOOT -->REMOVED/DEPRECATED -->
    # After fixing < !--, it becomes: --><!-- DISABLED FOR REBOOT -->REMOVED/DEPRECATED -->
    # We need to comment out the orphaned text
    content = content.replace(
        "-->REMOVED/DEPRECATED -->",
        "--><!-- REMOVED/DEPRECATED -->"
    )
    # Also check if there's a variant without the arrow
    content = content.replace(
        ">REMOVED/DEPRECATED -->",
        "><!-- REMOVED/DEPRECATED -->"
    )
    print("[2b] Fixed REMOVED/DEPRECATED orphan text")

    # -- Double-check: scan for any remaining -->TEXT patterns outside comments --
    # Fix the specific broken line more aggressively
    content = content.replace(
        '</script>--><!-- DISABLED FOR REBOOT --><!-- REMOVED/DEPRECATED -->',
        '</script><!-- DISABLED FOR REBOOT --><!-- REMOVED/DEPRECATED -->'
    )

    # -- Add fluvia-override.css import --
    if 'fluvia-override.css' not in content:
        content = content.replace(
            'elite-bundle.css?v=ELITE_PROX_GEN">',
            'elite-bundle.css?v=FLUVIA_REBUILD">\n    <link rel="stylesheet" href="css/fluvia-override.css?v=2">'
        )
        print("[3] Added fluvia-override.css import")
    else:
        print("[3] fluvia-override.css already imported")

    # -- Inject Fluvia views --
    injected = 0
    for fluvia_file, view_id in VIEW_MAP.items():
        if not os.path.exists(fluvia_file):
            print(f"  SKIP: {fluvia_file} not found")
            continue

        new_content = extract_content(fluvia_file)
        if not new_content:
            print(f"  SKIP: Could not extract from {os.path.basename(fluvia_file)}")
            continue

        content, ok = replace_view(content, view_id, new_content)
        if ok:
            print(f"  OK: {view_id} <- {os.path.basename(fluvia_file)}")
            injected += 1
        else:
            print(f"  FAIL: {view_id} not found in app.html")

    print(f"\n[4] Injected {injected} Fluvia views")

    # -- Sanity check --
    bad_patterns = ["< !--", "REMOVED/DEPRECATED -->"]
    found = [p for p in bad_patterns if p in content]
    if found:
        print(f"[5] WARNING: Still found: {found}")
        # Nuclear fix: just delete the offending text entirely
        for p in found:
            content = content.replace(p, "")
        print("    -> Force-removed all remaining bad text")
    else:
        print("[5] OK: No broken text remains")

    # -- Write --
    with open(APP_HTML, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\n[6] Written app.html: {len(content)} chars")
    print("=" * 60)
    print("  DONE")
    print("=" * 60)


if __name__ == "__main__":
    main()
