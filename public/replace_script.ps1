$file = "c:\Users\pepeq\OneDrive\Desktop\RIverhub\public\app.html"
$newContentFile = "c:\Users\pepeq\OneDrive\Desktop\RIverhub\public\new_combustible.html"

# Read lines (using List for easy manipulation)
$lines = [System.Collections.Generic.List[string]]::new([System.IO.File]::ReadAllLines($file))
$newLines = [System.IO.File]::ReadAllLines($newContentFile)

$startIdx = -1
$endIdx = -1

# Find Start
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '<div id="view-combustible"') {
        $startIdx = $i
        break
    }
}

# Find End
if ($startIdx -ne -1) {
    for ($i = $startIdx + 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '<div id="view-hidrologia"') {
            $endIdx = $i 
            break
        }
    }
}

if ($startIdx -ne -1 -and $endIdx -ne -1) {
    # We want to remove from startIdx up to (endIdx - 1)
    # But wait, there might be empty lines between them. 
    # Logic: The lines to remove are from startIdx to ($endIdx - 1)
    # BUT we want to ensure we leave ONE empty line if consistent? 
    # Usually replacing the block directly is fine.
    
    # We need to preserve the lines AFTER the block (from endIdx onwards)
    # And BEFORE (from 0 to startIdx - 1)
    # To be safe, let's assume we remove everything from startIdx to endIdx - 1 and insert new lines.
    
    Write-Host "Replacing from line $startIdx to $endIdx"
    
    $range = $endIdx - $startIdx
    $lines.RemoveRange($startIdx, $range)
    $lines.InsertRange($startIdx, $newLines)
    
    # Save
    [System.IO.File]::WriteAllLines($file, $lines)
    Write-Host "Success"
} else {
    Write-Host "Markers not found. Start: $startIdx End: $endIdx"
}
