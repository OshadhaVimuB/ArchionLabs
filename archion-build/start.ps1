# Archion Build - Start Backend & Frontend
# Usage: .\start.ps1

Write-Host ""
Write-Host "  Archion Build - Starting Services..." -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

# Start backend (FastAPI + Uvicorn) in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; Write-Host '  [Backend] Starting FastAPI on http://localhost:8000' -ForegroundColor Green; python -m uvicorn app.main:app --reload --port 8000"

# Start frontend (Next.js) in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; Write-Host '  [Frontend] Starting Next.js on http://localhost:3000' -ForegroundColor Green; npm run dev"

Write-Host "  [Backend]  -> http://localhost:8000" -ForegroundColor Green
Write-Host "  [Frontend] -> http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  Both services launched in separate windows." -ForegroundColor Yellow
Write-Host "  Close each window to stop the respective service." -ForegroundColor Yellow
Write-Host ""
