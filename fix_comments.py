import os

filepath = "public/app.html"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix the broken HTML comments
fixed_content = content.replace("< !--", "<!--")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(fixed_content)
