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

# --- Backends ---

# 1. Archion Build Backend (FastAPI - port 8000)
Write-Host "[1/9] Starting Archion Build Backend on port 8000..." -ForegroundColor Yellow
$buildCmd = "Set-Location '$ROOT\archion-build\backend'; Write-Host 'Archion Build Backend - port 8000' -ForegroundColor Green; uvicorn app.main:app --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $buildCmd

# 2. Archion Sim Backend (FastAPI - port 8001)
Write-Host "[2/9] Starting Archion Sim Backend on port 8001..." -ForegroundColor Yellow
$simCmd = "Set-Location '$ROOT\archion-sim\backend'; Write-Host 'Archion Sim Backend - port 8001' -ForegroundColor Green; uvicorn main:app --port 8001 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $simCmd

# 3. Archion Viewer Backend (FastAPI - port 8002)
Write-Host "[3/9] Starting Archion Viewer Backend on port 8002..." -ForegroundColor Yellow
$viewerCmd = "Set-Location '$ROOT\archion-viewer\backend'; Write-Host 'Archion Viewer Backend - port 8002' -ForegroundColor Green; uvicorn app.main:app --port 8002 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $viewerCmd

# 4. Archion Community Backend (Express.js - port 5000)
Write-Host "[4/9] Starting Archion Community Backend on port 5000..." -ForegroundColor Yellow
$communityCmd = "Set-Location '$ROOT\archion-community\backend'; Write-Host 'Archion Community Backend - port 5000' -ForegroundColor Green; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $communityCmd

# --- Frontends ---

# 5. Landing Page Frontend (Next.js - port 3000)
Write-Host "[5/9] Starting Landing Page Frontend on port 3000..." -ForegroundColor Yellow
$frontendCmd = "Set-Location '$ROOT\landing-page\frontend'; Write-Host 'Landing Page - port 3000' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

# 6. Archion Build Frontend (Next.js - port 3001)
Write-Host "[6/9] Starting Archion Build Frontend on port 3001..." -ForegroundColor Yellow
$buildFrontendCmd = "Set-Location '$ROOT\archion-build\frontend'; Write-Host 'Archion Build Frontend - port 3001' -ForegroundColor Green; npm run dev -- -p 3001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $buildFrontendCmd

# 7. Archion Sim Frontend (Next.js - port 3002)
Write-Host "[7/9] Starting Archion Sim Frontend on port 3002..." -ForegroundColor Yellow
$simFrontendCmd = "Set-Location '$ROOT\archion-sim\frontend'; Write-Host 'Archion Sim Frontend - port 3002' -ForegroundColor Green; npm run dev -- -p 3002"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $simFrontendCmd

# 8. Archion Viewer Frontend (Next.js - port 3003)
Write-Host "[8/9] Starting Archion Viewer Frontend on port 3003..." -ForegroundColor Yellow
$viewerFrontendCmd = "Set-Location '$ROOT\archion-viewer\frontend'; Write-Host 'Archion Viewer Frontend - port 3003' -ForegroundColor Green; npm run dev -- -p 3003"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $viewerFrontendCmd

# 9. Archion Community Frontend (Next.js - port 3004)
Write-Host "[9/9] Starting Archion Community Frontend on port 3004..." -ForegroundColor Yellow
$communityFrontendCmd = "Set-Location '$ROOT\archion-community'; Write-Host 'Archion Community Frontend - port 3004' -ForegroundColor Green; npm run dev -- -p 3004"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $communityFrontendCmd

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All services launched!" -ForegroundColor Green
Write-Host ""
Write-Host "  BACKENDS:" -ForegroundColor DarkGray
Write-Host "  Archion Build     -> http://localhost:8000"
Write-Host "  Archion Sim       -> http://localhost:8001"
Write-Host "  Archion Viewer    -> http://localhost:8002"
Write-Host "  Archion Community -> http://localhost:5000"
Write-Host ""
Write-Host "  FRONTENDS:" -ForegroundColor DarkGray
Write-Host "  Landing Page      -> http://localhost:3000"
Write-Host "  Build Frontend    -> http://localhost:3001"
Write-Host "  Sim Frontend      -> http://localhost:3002"
Write-Host "  Viewer Frontend   -> http://localhost:3003"
Write-Host "  Community Frontend-> http://localhost:3004"
Write-Host ""
Write-Host "  Close the spawned terminal windows to stop." -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
