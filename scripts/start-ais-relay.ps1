# Starts the local AIS relay without saving provider credentials to disk.
$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host 'ViaBarcazas - Relay AIS local' -ForegroundColor Cyan
Write-Host 'Pega la clave AISStream nueva. No se guardara en este equipo.' -ForegroundColor Yellow
$env:AIS_API_KEY = Read-Host 'AIS API key'

Write-Host ''
Write-Host 'Pega el AIS_RELAY_TOKEN configurado en Render.' -ForegroundColor Yellow
$env:AIS_RELAY_TOKEN = Read-Host 'AIS relay token'
$env:AIS_RELAY_URL = 'https://viabarcazas.com/api/internal/ais-ingest'

if ([string]::IsNullOrWhiteSpace($env:AIS_API_KEY) -or [string]::IsNullOrWhiteSpace($env:AIS_RELAY_TOKEN)) {
    throw 'Ambas claves son obligatorias.'
}

& npm.cmd run ais:relay
