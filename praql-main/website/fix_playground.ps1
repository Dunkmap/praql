$file = "d:\PRAQL\website\src\pages\playground.js"
$lines = Get-Content $file
$cutoff = -1
for ($i = $lines.Length - 1; $i -ge 0; $i--) {
    if ($lines[$i] -match 'content\.innerHTML\s*=\s*html') {
        $cutoff = $i + 2
        break
    }
}
if ($cutoff -gt 0 -and $cutoff -lt $lines.Length) {
    $lines[0..($cutoff - 1)] | Set-Content $file
    Write-Host "Truncated at line $cutoff"
} else {
    Write-Host "No truncation needed"
}
