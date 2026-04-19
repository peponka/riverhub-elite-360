import json

# App HTML
with open("public/app.html", "r", encoding="utf-8") as f:
    app_lines = f.read().splitlines()

# Fluvia HTML
with open("public/admin-fluvia.html", "r", encoding="utf-8") as f:
    fluvia_lines = f.read().splitlines()

# Extract dashboard-content from fluvia (lines 66-302, which is index 65 to 301)
fluvia_content_lines = fluvia_lines[65:302]

# Replace app_html view-dashboard (lines 718-861, which is index 717 to 861)
# Keep the wrapper <div id="view-dashboard" class="view-section"...> (line 717)
# Keep the closing </div> of the wrapper (line 862)

new_app_lines = app_lines[:717] + fluvia_content_lines + app_lines[861:]

with open("public/app.html", "w", encoding="utf-8") as f:
    f.write("\n".join(new_app_lines))
    f.write("\n")
