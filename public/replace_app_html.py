import os

file_path = r'c:\Users\pepeq\OneDrive\Desktop\RIverhub\public\app.html'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    start_idx = -1
    end_idx = -1

    print(f"Total lines: {len(lines)}")

    for i, line in enumerate(lines):
        if '<div id="view-combustible"' in line:
            start_idx = i
            print(f"Found START at line {i}")
            break
    
    if start_idx != -1:
        for i in range(start_idx + 1, len(lines)):
            if '<div id="view-' in lines[i]:
                print(f"Found END marker at line {i}: {lines[i].strip()}")
                end_idx = i
                break

    if start_idx != -1 and end_idx != -1:
        print(f"Replacing lines {start_idx} to {end_idx}")
        
        # New content
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
        
        new_lines_list = new_content_snippet.split('\n')
        new_lines_list = [l + '\n' for l in new_lines_list]

        final_lines = lines[:start_idx] + new_lines_list + ['\n'] + lines[end_idx:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(final_lines)
        print("Successfully replaced content.")
    else:
        print("Could not find start or end markers.")

except Exception as e:
    print(f"Error: {e}")
