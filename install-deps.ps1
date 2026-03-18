# ============================================================
# install-deps.ps1 - Install ALL dependencies for every service
# Run from the repo root:  .\install-deps.ps1
# ============================================================

$ErrorActionPreference = "Continue"
$ROOT = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Archion - Dependency Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------
# 1. Python packages (global)
# ----------------------------------------------------------
Write-Host "[1/4] Installing Python packages..." -ForegroundColor Yellow

pip install fastapi "uvicorn[standard]" sqlalchemy pydantic python-dotenv "python-jose[cryptography]" psycopg2-binary python-multipart anthropic httpx aiofiles requests trimesh shapely scipy numpy reportlab matplotlib sse-starlette pillow pymupdf ezdxf pytest pytest-asyncio 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  -> Python packages installed successfully." -ForegroundColor Green
} else {
    Write-Host "  -> Some Python packages may have failed." -ForegroundColor Red
}

# ----------------------------------------------------------
# 2. Landing Page Frontend (Next.js)
# ----------------------------------------------------------
Write-Host ""
Write-Host "[2/4] Installing landing-page/frontend (npm)..." -ForegroundColor Yellow
Push-Location "$ROOT\landing-page\frontend"
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  -> landing-page/frontend installed." -ForegroundColor Green
} else {
    Write-Host "  -> landing-page/frontend install failed." -ForegroundColor Red
}
Pop-Location

# ----------------------------------------------------------
# 3. Archion Community Backend (Express.js)
# ----------------------------------------------------------
Write-Host ""
Write-Host "[3/4] Installing archion-community/backend (npm)..." -ForegroundColor Yellow
Push-Location "$ROOT\archion-community\backend"
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  -> archion-community/backend installed." -ForegroundColor Green
} else {
    Write-Host "  -> archion-community/backend install failed." -ForegroundColor Red
}
Pop-Location

# ----------------------------------------------------------
# 4. Summary
# ----------------------------------------------------------
Write-Host ""
Write-Host "[4/4] Verifying key packages..." -ForegroundColor Yellow

$pythonOk = (pip show fastapi 2>$null) -ne $null
$frontendOk = Test-Path "$ROOT\landing-page\frontend\node_modules"
$communityOk = Test-Path "$ROOT\archion-community\backend\node_modules"

Write-Host ""
Write-Host "  Python (fastapi)          : $(if ($pythonOk) {'OK'} else {'MISSING'})" -ForegroundColor $(if ($pythonOk) {'Green'} else {'Red'})
Write-Host "  landing-page/frontend     : $(if ($frontendOk) {'OK'} else {'MISSING'})" -ForegroundColor $(if ($frontendOk) {'Green'} else {'Red'})
Write-Host "  archion-community/backend : $(if ($communityOk) {'OK'} else {'MISSING'})" -ForegroundColor $(if ($communityOk) {'Green'} else {'Red'})

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done! Run .\start-all.ps1 to launch." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
