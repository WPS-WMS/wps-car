# Validação local completa antes de subir para QA.
# Uso: .\scripts\test-local.ps1
#      .\scripts\test-local.ps1 -SkipSeed -SkipImport
param(
  [switch]$SkipSeed,
  [switch]$SkipImport,
  [switch]$StartWeb
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$apiDir = Join-Path $repoRoot "apps\api"
$webDir = Join-Path $repoRoot "apps\web"

$localDb = "postgresql://wps_car:wps_car_secret@localhost:5432/wps_car?schema=public"
$env:DATABASE_URL = $localDb
$env:DIRECT_DATABASE_URL = $localDb

function Test-PortOpen([int]$Port) {
  $tcp = New-Object System.Net.Sockets.TcpClient
  try {
    $tcp.Connect("127.0.0.1", $Port)
    return $true
  } catch {
    return $false
  } finally {
    $tcp.Dispose()
  }
}

function Wait-ApiHealth {
  $deadline = (Get-Date).AddSeconds(90)
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/health" -Method Get -TimeoutSec 3
      if ($r.success) { return $true }
    } catch { }
    Start-Sleep -Seconds 2
  }
  return $false
}

Write-Host "=== WPS Car — teste local ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-PortOpen 5432)) {
  Write-Error @"
PostgreSQL nao esta acessivel em localhost:5432.
1. Inicie o servico postgresql-x64-16 (services.msc)
2. Ou rode: .\scripts\setup-postgres-db.ps1
Veja docs/SETUP-POSTGRES-WINDOWS.md
"@
}

Write-Host "[1/6] Migrations (banco local)..." -ForegroundColor Yellow
Set-Location $apiDir
npm run prisma:migrate:deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $SkipSeed) {
  Write-Host "[2/6] Seed Alpha + Beta..." -ForegroundColor Yellow
  npm run db:seed
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "[2/6] Seed ignorado (-SkipSeed)" -ForegroundColor DarkGray
}

Write-Host "[3/6] API (health check)..." -ForegroundColor Yellow
if (-not (Wait-ApiHealth)) {
  Write-Host "API nao responde em :3001. Abra outro terminal e rode:" -ForegroundColor Red
  Write-Host '  $env:DATABASE_URL="' + $localDb + '"; cd apps\api; npm run start:dev' -ForegroundColor White
  Write-Error "Suba a API e execute este script novamente (ou use -SkipImport se so quiser migrate/seed)."
}

Write-Host "[4/6] Testes E2E (veiculos/produtos)..." -ForegroundColor Yellow
npm run test:e2e
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $SkipImport) {
  Write-Host "[5/6] Import demo (Alpha + Beta)..." -ForegroundColor Yellow
  npm run import:vehicles:demo
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "[5/6] Import ignorado (-SkipImport)" -ForegroundColor DarkGray
}

Write-Host "[6/6] Build do frontend..." -ForegroundColor Yellow
Set-Location $webDir
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "=== Tudo OK no ambiente local ===" -ForegroundColor Green
Write-Host ""
Write-Host "Teste manual no navegador:" -ForegroundColor Cyan
Write-Host "  Terminal API:  cd apps\api  ->  npm run start:dev"
Write-Host "  Terminal Web:  cd apps\web  ->  npm run dev"
Write-Host "  http://localhost:3000"
Write-Host ""
Write-Host "Logins demo:" -ForegroundColor Cyan
Write-Host "  Alpha  CNPJ 00000000000191  admin@revendademo.com.br  / Admin@123"
Write-Host "  Beta   CNPJ 11222333000181  admin@revendabeta.com.br   / Admin@123"
Write-Host ""
Write-Host "Checklist manual:" -ForegroundColor Cyan
Write-Host "  - Login Alpha: veiculos, filiais, usuarios, dashboard"
Write-Host "  - Logout + login Beta: dados isolados (sem veiculos da Alpha)"
Write-Host "  - Gerente/vendedor com filial correta"
Write-Host ""
Write-Host "Antes do deploy QA, volte apps/api/.env para as URLs do Neon." -ForegroundColor Yellow

if ($StartWeb) {
  Set-Location $webDir
  npm run dev
}
