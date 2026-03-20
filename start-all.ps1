# ============================================================
# start-all.ps1 - Start ALL Archion microservices
# Run from the repo root:  .\start-all.ps1
# All services will run in THIS terminal window.
# ============================================================

$ROOT = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Archion - Service Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All services will output to this terminal." -ForegroundColor Yellow
Write-Host "Press [ENTER] at any time to STOP all services." -ForegroundColor Magenta
Write-Host ""

$processes = @()

try {
    # --- Backends ---
    Write-Host "[1/9] Starting Archion Build Backend on port 8000..." -ForegroundColor Green
    $processes += Start-Process "python" -ArgumentList "-m uvicorn app.main:app --port 8000 --reload" -WorkingDirectory "$ROOT\archion-build\backend" -NoNewWindow -PassThru

    Write-Host "[2/9] Starting Archion Sim Backend on port 8001..." -ForegroundColor Green
    $processes += Start-Process "python" -ArgumentList "-m uvicorn main:app --port 8001 --reload" -WorkingDirectory "$ROOT\archion-sim\backend" -NoNewWindow -PassThru

    Write-Host "[3/9] Starting Archion Viewer Backend on port 8002..." -ForegroundColor Green
    $processes += Start-Process "python" -ArgumentList "-m uvicorn app.main:app --port 8002 --reload" -WorkingDirectory "$ROOT\archion-viewer\backend" -NoNewWindow -PassThru

    Write-Host "[4/9] Starting Archion Community Backend on port 5000..." -ForegroundColor Green
    $processes += Start-Process "node" -ArgumentList "server.js" -WorkingDirectory "$ROOT\archion-community\backend" -NoNewWindow -PassThru

    # --- Frontends ---
    Write-Host "[5/9] Starting Landing Page Frontend on port 3000..." -ForegroundColor Green
    $processes += Start-Process "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$ROOT\landing-page\frontend" -NoNewWindow -PassThru

    Write-Host "[6/9] Starting Archion Build Frontend on port 3001..." -ForegroundColor Green
    $processes += Start-Process "npm.cmd" -ArgumentList "run dev -- -p 3001" -WorkingDirectory "$ROOT\archion-build\frontend" -NoNewWindow -PassThru

    Write-Host "[7/9] Starting Archion Sim Frontend on port 3002..." -ForegroundColor Green
    $processes += Start-Process "npm.cmd" -ArgumentList "run dev -- -p 3002" -WorkingDirectory "$ROOT\archion-sim\frontend" -NoNewWindow -PassThru

    Write-Host "[8/9] Starting Archion Viewer Frontend on port 3003..." -ForegroundColor Green
    $processes += Start-Process "npm.cmd" -ArgumentList "run dev -- -p 3003" -WorkingDirectory "$ROOT\archion-viewer\frontend" -NoNewWindow -PassThru

    Write-Host "[9/9] Starting Archion Community Frontend on port 3004..." -ForegroundColor Green
    $processes += Start-Process "npm.cmd" -ArgumentList "run dev -- -p 3004" -WorkingDirectory "$ROOT\archion-community" -NoNewWindow -PassThru

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
    Write-Host "  Press [ENTER] to stop all services." -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Wait for user input to kill everything gracefully
    [Console]::ReadLine() | Out-Null

} finally {
    Write-Host "Stopping all services..." -ForegroundColor Magenta
    foreach ($p in $processes) {
        if (-not $p.HasExited) {
            # Try to kill the whole process tree (requires taskkill on Windows to ensure child node/python processes die)
            Write-Host "Killing process ID $($p.Id)..." -ForegroundColor DarkGray
            & taskkill /F /T /PID $p.Id 2>&1 | Out-Null
        }
    }
    Write-Host "All processes cleanly stopped." -ForegroundColor Green
}
