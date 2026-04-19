import os
import re

APP_HTML_PATH = "public/app.html"

MAPPINGS = {
    "admin-fluvia.html": "view-dashboard",
    "admin-convoys-fluvia.html": "view-convoys",
    "admin-viajes-fluvia.html": "view-viajes",
    "admin-tripulacion-fluvia.html": "view-tripulacion",
    "admin-bitacora-fluvia.html": "view-bitacora",
    "admin-mantenimiento-fluvia.html": "view-mantenimiento",
    "admin-combustible-fluvia.html": "view-combustible",
    # we leave map alone for a second
}

def extract_content(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extract the dashboard-content inside the standalone files
    # The standalone files have <div class="dashboard-content"...>
    start_tag = 'class="dashboard-content'
    idx = content.find(start_tag)
    if idx == -1: return None
        
    start_idx = content.rfind('<div', 0, idx)
    
    # Balance tags to find the end
    div_count = 0
    end_idx = start_idx
    while end_idx < len(content):
        next_open = content.find('<div', end_idx)
        next_close = content.find('</div', end_idx)
        
        if next_close == -1: break
        
        if next_open != -1 and next_open < next_close:
            div_count += 1
            end_idx = next_open + 4
        else:
            div_count -= 1
            end_idx = next_close + 5
            if div_count == 0:
                end_idx = content.find('>', end_idx) + 1
                break
                
    return content[start_idx:end_idx]

def update_app_html():
    with open(APP_HTML_PATH, "r", encoding="utf-8") as f:
        app_html = f.read()
        
    for fluvia_file, view_id in MAPPINGS.items():
        fluvia_path = os.path.join("public", fluvia_file)
        if not os.path.exists(fluvia_path): continue
        new_content = extract_content(fluvia_path)
        if not new_content: continue
            
        start_pattern = f'id="{view_id}"'
        idx = app_html.find(start_pattern)
        if idx == -1: continue
            
        # Find the <div just before
        start_idx = app_html.rfind('<div', 0, idx)
        
        # Balance tags
        div_count = 0
        end_idx = start_idx
        while end_idx < len(app_html):
            next_open = app_html.find('<div', end_idx)
            next_close = app_html.find('</div', end_idx)
            if next_close == -1: break
            if next_open != -1 and next_open < next_close:
                div_count += 1
                end_idx = next_open + 4
            else:
                div_count -= 1
                end_idx = next_close + 5
                if div_count == 0:
                    end_idx = app_html.find('>', end_idx) + 1
                    break
        
        # Replace the inner part, we keep the original view container!
        # The container is <div id="view-X" class="view-section" style="...">
        container_end = app_html.find('>', start_idx) + 1
        container_start_tag = app_html[start_idx:container_end]
        
        # Inject the new content
        replacement = container_start_tag + "\n" + new_content + "\n</div>"
        
        app_html = app_html[:start_idx] + replacement + app_html[end_idx:]
        print(f"Injected {fluvia_file} into {view_id}")
        
    with open(APP_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(app_html)

if __name__ == "__main__":
    update_app_html()
