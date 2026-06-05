# Cria usuário e banco wps_car. Pede a senha do usuário postgres.
$ErrorActionPreference = "Stop"

$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (-not (Test-Path $psql)) {
  $found = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { $psql = $found.FullName }
  else {
    Write-Error "psql não encontrado. Instale o PostgreSQL 16 ou ajuste o caminho neste script."
  }
}

$sqlFile = Join-Path $PSScriptRoot "setup-postgres-db.sql"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "Usando: $psql"
Write-Host "Script SQL: $sqlFile"
Write-Host ""
Write-Host "Digite a senha do usuario postgres quando solicitado."
Write-Host ""

Set-Location $repoRoot
& $psql -U postgres -f $sqlFile

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Banco configurado. Proximo passo:"
  Write-Host "  cd apps\api"
  Write-Host "  npx prisma migrate dev --name init"
  Write-Host "  npm run db:seed"
  Write-Host "  npm run start:dev"
}
