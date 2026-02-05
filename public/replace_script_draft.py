import os

file_path = r'c:\Users\pepeq\OneDrive\Desktop\RIverhub\public\app.html'

new_content_snippet = """                <div id="view-combustible" class="view-section" style="display:none;">
                    <div class="bunker-container">
                        <!-- HEADER -->
                        <div class="bunker-header">
                            <div class="header-icon-box"><i class="fas fa-gas-pump"></i></div>
                            <div class="header-titles">
                                <h2>BUNKERING & ENERGÍA</h2>
                                <span>AUDIT & CONSUMPTION INTELLIGENCE • NODE-BUNKER</span>
                            </div>
                            <button class="btn-register-load">
                                <i class="fas fa-plus-circle"></i> REGISTRAR CARGA
                            </button>
                        </div>

                        <div class="bunker-content">
                            <!-- LEFT SIDEBAR: UNITS -->
                            <div class="fleet-sidebar">
                                <div class="sidebar-title">UNIDADES DE FLOTA</div>
                                <div class="fleet-list-bunker">
                                    <!-- List Items Injected by JS -->
                                </div>
                            </div>

                            <!-- CENTER: TANK STATUS -->
                            <div class="tank-status-panel">
                                <div class="tank-header">
                                    <div class="vessel-title-bunker">
                                        <div class="v-icon"><i class="fas fa-ship"></i></div>
                                        <div>
                                            <h3>TB PARAGUAY 01</h3>
                                            <span class="tank-sub">ESTADO DE TANQUES EN TIEMPO REAL</span>
                                        </div>
                                    </div>
                                    <div class="sensor-badge">SENSORES: ACTIVOS</div>
                                </div>

                                <div class="tank-visual-container">
                                    <div class="tank-pill">
                                        <div class="tank-level" style="height: 69%;"></div>
                                        <div class="tank-overlay-lines"></div>
                                    </div>
                                    <div class="tank-percent">69%</div>
                                    <span class="sensor-active-text">SENSOR ACTIVO</span>
                                </div>

                                <div class="stats-row-bunker">
                                    <div class="stat-card-bunker">
                                        <span class="stat-label-bunker">AUTONOMÍA EST.</span>
                                        <span class="stat-val-bunker">182 <small>HRS</small></span>
                                    </div>
                                    <div class="stat-card-bunker">
                                        <span class="stat-label-bunker">EFICIENCIA MOTOR</span>
                                        <span class="stat-val-bunker" style="color:#00e5ff;">94 <small>%</small></span>
                                    </div>
                                </div>
                            </div>

                            <!-- RIGHT: HISTORY -->
                            <div class="history-panel-bunker">
                                <div class="history-title">HISTORIAL DE CARGAS</div>
                                <div class="history-list">
                                    <!-- HISTORY ITEMS Injected by JS -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>"""

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_index = -1
end_index = -1

for i, line in enumerate(lines):
    if '<div id="view-combustible"' in line:
        start_index = i
    if start_index != -1 and i > start_index:
        # We need to find the specific closing div.
        # Based on previous file reads, we know the structure.
        # It's indented. The closing div for view-combustible is usually at the same indentation level or close.
        # But simply looking for </div> is risky.
        # Let's count divs? No, complex.
        # We observed in the tool output that the section ends at line 1850 (1-based) which is index 1849.
        # And line 1850 content was "                </div>".
        # Let's verify context.
        pass

# Hardcoding lines based on confidence from view_file is risky but the file content might change.
# Let's use the content matching from previous view_file.
# We know the block starts with <div id="view-combustible"...
# And ends before <div id="view-docs" ... (Wait, check app.html step 16 & 19).
# Step 16: 
# 485: <div id="content-area">
# 490: <div id="view-tracking"...
# 556: <div id="view-dashboard"...
# 705: <div id="view-mapa"...
# 773: <div id="view-cotizador"...
# 843: <div id="view-docs"... (Step 19)
# 886: <div id="view-reportes"...
# 974: <div id="view-convoys"...
# 1017: <div id="view-viajes"...
# 1113: <div id="view-mantenimiento"...
# 1208: <div id="view-bitacora"...
# 1248: <div id="view-comunicaciones"...
# 1359: <div id="view-tripulacion"...
# 1421: <div id="view-incidentes"...
# 1468: <div id="view-panol"...
# 1592: <div id="view-combustible"...
# What comes after combustible?
# I haven't seen what comes AFTER combustible. Step 23 ended at 1800. Step 32 ended at 1850 with `</div>`.
# I should check what is at 1851.

pass

