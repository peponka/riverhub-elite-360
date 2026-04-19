from bs4 import BeautifulSoup
import os

APP_HTML_PATH = "public/app.html"

# Mapping from standalone file to app.html view ID
MAPPINGS = {
    "admin-fluvia.html": "view-dashboard",
    "admin-convoys-fluvia.html": "view-convoys",
    "admin-viajes-fluvia.html": "view-viajes",
    "admin-mapa-flota-fluvia.html": "view-mapa", # Let's see if view-mapa handles this
    "admin-tripulacion-fluvia.html": "view-tripulacion",
    "admin-bitacora-fluvia.html": "view-bitacora",
    "admin-mantenimiento-fluvia.html": "view-mantenimiento",
    "admin-flota-fluvia.html": "view-fleet-unique",
    "admin-combustible-fluvia.html": "view-combustible",
    "admin-comunicaciones-fluvia.html": "view-comunicaciones",
    # admin-mapa-fluvia.html maybe is view-ais? The user had two map screenshots
    "admin-copiloto-fluvia.html": "view-copiloto",
}

def extract_content(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")
        
    main_area = soup.find("div", class_=lambda c: c and "main-area" in c)
    if not main_area:
        return None
        
    # Remove topbar
    topbar = main_area.find("div", class_="topbar")
    if topbar:
        topbar.decompose()
        
    # The remainder of main_area is the content.
    # We will grab all child elements of main_area as a string
    html_content = "".join(str(child) for child in main_area.contents if str(child).strip())
    return html_content

def update_app_html():
    with open(APP_HTML_PATH, "r", encoding="utf-8") as f:
        app_html = f.read()
        
    soup_app = BeautifulSoup(app_html, "html.parser")
    
    for fluvia_file, view_id in MAPPINGS.items():
        fluvia_path = os.path.join("public", fluvia_file)
        if not os.path.exists(fluvia_path):
            print(f"Skipped {fluvia_file}: not found.")
            continue
            
        new_content = extract_content(fluvia_path)
        if not new_content:
            print(f"Skipped {fluvia_file}: could not extract content.")
            continue
            
        target_view = soup_app.find("div", id=view_id)
        if not target_view:
            # Maybe there are multiple div instances with the same id (comunicaciones)
            targets = soup_app.find_all("div", id=view_id)
            if not targets:
                print(f"Skipped {fluvia_file}: view {view_id} not found in app.html.")
                continue
            target_view = targets[0]
            
        # Parse the new content
        new_soup = BeautifulSoup(new_content, "html.parser")
        
        # Clear existing contents
        target_view.clear()
        
        # Append new contents
        for elem in new_soup.contents:
            target_view.append(elem)
            
        print(f"Successfully updated {view_id} with contents of {fluvia_file}")
        
    # Save back to app.html (directly overwrite)
    with open(APP_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(str(soup_app))

if __name__ == "__main__":
    update_app_html()
