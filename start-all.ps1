# ============================================================
# start-all.ps1 - Start ALL Archion microservices
# Run from the repo root:  .\start-all.ps1
# Each service opens in its own terminal window.
# ============================================================

$ROOT = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Archion - Service Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Archion Build (FastAPI - port 8000)
Write-Host "[1/5] Starting Archion Build on port 8000..." -ForegroundColor Yellow
$buildCmd = "Set-Location '$ROOT\archion-build\backend'; Write-Host 'Archion Build - port 8000' -ForegroundColor Green; uvicorn app.main:app --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $buildCmd

# 2. Archion Sim (FastAPI - port 8001)
Write-Host "[2/5] Starting Archion Sim on port 8001..." -ForegroundColor Yellow
$simCmd = "Set-Location '$ROOT\archion-sim\backend'; Write-Host 'Archion Sim - port 8001' -ForegroundColor Green; uvicorn main:app --port 8001 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $simCmd

# 3. Archion Viewer (FastAPI - port 8002)
Write-Host "[3/5] Starting Archion Viewer on port 8002..." -ForegroundColor Yellow
$viewerCmd = "Set-Location '$ROOT\archion-viewer\backend'; Write-Host 'Archion Viewer - port 8002' -ForegroundColor Green; uvicorn app.main:app --port 8002 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $viewerCmd

# 4. Archion Community (Express.js - port 5000)
Write-Host "[4/5] Starting Archion Community on port 5000..." -ForegroundColor Yellow
$communityCmd = "Set-Location '$ROOT\archion-community\backend'; Write-Host 'Archion Community - port 5000' -ForegroundColor Green; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $communityCmd

# 5. Landing Page Frontend (Next.js - port 3000)
Write-Host "[5/5] Starting Landing Page on port 3000..." -ForegroundColor Yellow
$frontendCmd = "Set-Location '$ROOT\landing-page\frontend'; Write-Host 'Landing Page - port 3000' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All services launched!" -ForegroundColor Green
Write-Host ""
Write-Host "  Archion Build     -> http://localhost:8000"
Write-Host "  Archion Sim       -> http://localhost:8001"
Write-Host "  Archion Viewer    -> http://localhost:8002"
Write-Host "  Archion Community -> http://localhost:5000"
Write-Host "  Landing Page      -> http://localhost:3000"
Write-Host ""
Write-Host "  Close the spawned terminal windows to stop." -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
