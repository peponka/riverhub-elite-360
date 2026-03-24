import os
import re

dir_path = r"c:\Users\pepeq\OneDrive\Desktop\RIverhub\riverhub_mobile\riverhub_mobile_v2\lib\screens"

# Mapping file -> name to display
mapping = {
    "tripulacion_screen.dart": "Nuevo",
    "trips_screen.dart": "Nuevo",
    "reportes_screen.dart": "Exportar",
    "panol_screen.dart": "Añadir",
    "notifications_screen.dart": "Limpiar",
    "loadmaster_screen.dart": "Calcular",
    "incidentes_screen.dart": "Reportar",
    "fuel_screen.dart": "Cargar",
    "draft_screen.dart": "Nuevo",
    "docs_screen.dart": "Subir",
    "commercial_screen.dart": "Nuevo",
    "bitacora_screen.dart": "Nueva",
    "mantenimiento_screen.dart": "Nueva",
    "convoys_screen.dart": "Nuevo",
    "auditoria_screen.dart": "Limpiar",
}

for fname in os.listdir(dir_path):
    if not fname.endswith(".dart"): continue
    
    path = os.path.join(dir_path, fname)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # match precisely `trailing: CupertinoButton(` or `CupertinoButton(` 
    # to avoid modifying back button
    
    # Let's find trailing: CupertinoButton(...)
    # and replace its child: const Icon( ... ) with a Row containing text + icon.

    pattern = r"(trailing:\s*CupertinoButton\(\s*padding:\s*EdgeInsets\.zero,\s*child:\s*const\s*Icon\(\s*)(CupertinoIcons\.\w+)(\s*,\s*color:\s*Color\([^)]+\))?(\s*\),)"

    def replacer(match):
        prefix = match.group(1)
        icon_name = match.group(2)
        color_part = match.group(3) or ", color: Color(0xFF00E5FF)"
        suffix = match.group(4)
        
        label = mapping.get(fname, "Acción")
        
        new_child = f"""Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('{label} ', style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 13, fontWeight: FontWeight.bold)),
              Icon({icon_name}{color_part}, size: 20),
            ],
          )"""
          
        return f"trailing: CupertinoButton(\n          padding: EdgeInsets.zero,\n          child: {new_child},"

    new_content = re.sub(pattern, replacer, content, count=1)
    
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {fname}")

