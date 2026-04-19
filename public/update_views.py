import os
import re

APP_HTML_PATH = "public/app.html"

MAPPINGS = {
    "admin-fluvia.html": "view-dashboard",
    "admin-convoys-fluvia.html": "view-convoys",
    "admin-viajes-fluvia.html": "view-viajes",
    "admin-mapa-flota-fluvia.html": "view-mapa",
    "admin-tripulacion-fluvia.html": "view-tripulacion",
    "admin-bitacora-fluvia.html": "view-bitacora",
    "admin-mantenimiento-fluvia.html": "view-mantenimiento",
    "admin-flota-fluvia.html": "view-fleet-unique",
    "admin-combustible-fluvia.html": "view-combustible",
    # Communications has duplicate ID in app.html, let's just do the first one or both
    "admin-comunicaciones-fluvia.html": "view-comunicaciones",
    # mapa ais
    "admin-mapa-fluvia.html": "view-mapa", # wait, we mapped mapa-flota to view-mapa. Let's see later.
}

def extract_dashboard_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try to find <div class="dashboard-content"> which is the standard wrapper from the screenshots
    match = re.search(r'(<div class="dashboard-content">.*?)\s*</div>\s*</div>\s*(</body>|<!-- LOAD)', content, re.DOTALL)
    if match:
        return match.group(1)
        
    # If not found, just try to grab what's inside <div class="main-area"> after topbar
    match2 = re.search(r'<div class="topbar">.*?</div>\s*(<div.*?)</div>\s*</body>', content, re.DOTALL)
    if match2:
        return match2.group(1)
    
    return None

def update_app_html():
    with open(APP_HTML_PATH, 'r', encoding='utf-8') as f:
        app_html = f.read()
        
    for fluvia_file, view_id in MAPPINGS.items():
        fluvia_path = os.path.join("public", fluvia_file)
        if not os.path.exists(fluvia_path):
            print(f"Skipping {fluvia_file}, not found.")
            continue
            
        new_content = extract_dashboard_content(fluvia_path)
        if not new_content:
            print(f"Could not extract content from {fluvia_file}")
            continue
            
        # We need to find the <div id="view_id"... slice and replace its INSIDES.
        # Find start tag
        start_pattern = f'(<div id="{view_id}"[^>]*>)'
        match = re.search(start_pattern, app_html)
        if not match:
            print(f"Could not find {view_id} in app.html")
            continue
            
        start_idx = match.end()
        # Find the matching closing div
        div_count = 1
        end_idx = start_idx
        while div_count > 0 and end_idx < len(app_html):
            next_open = app_html.find('<div', end_idx)
            next_close = app_html.find('</div', end_idx)
            
            if next_close == -1:
                break
                
            if next_open != -1 and next_open < next_close:
                div_count += 1
                end_idx = next_open + 4
            else:
                div_count -= 1
                end_idx = next_close + 5

        # Also get past the closing >
        end_idx = app_html.find('>', end_idx) + 1
        
        # Replace the content
        opening_tag = match.group(1)
        # Instead of replacing the container, we wrap the extracted content with the container's opening tag
        app_html = app_html[:match.start()] + opening_tag + "\n" + new_content + "\n" + app_html[end_idx:]
        print(f"Successfully injected {fluvia_file} into {view_id}")
        
    with open(APP_HTML_PATH + ".new", 'w', encoding='utf-8') as f:
        f.write(app_html)
        
    print("Write complete to app.html.new")

update_app_html()
