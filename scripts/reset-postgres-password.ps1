# Define senha do usuario postgres — OBRIGATORIO: PowerShell como ADMINISTRADOR.
# Botao direito no PowerShell -> Executar como administrador

param(
  [string]$NewPassword = "wps_postgres_123"
)

$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "ERRO: Execute este script como ADMINISTRADOR." -ForegroundColor Red
  Write-Host "  Iniciar -> PowerShell -> botao direito -> Executar como administrador"
  Write-Host "  Depois: cd C:\Users\User\Desktop\wps-flowa\wps-car"
  Write-Host "          .\scripts\reset-postgres-password.ps1"
  exit 1
}

$pgData = "C:\Program Files\PostgreSQL\16\data"
$pgHba = Join-Path $pgData "pg_hba.conf"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$serviceName = "postgresql-x64-16"
$backup = "$pgHba.backup-wps-car"

if (-not (Test-Path $pgHba)) {
  Write-Error "Arquivo nao encontrado: $pgHba"
}

# Garante backup original (antes de trust)
if (-not (Test-Path $backup)) {
  Copy-Item $pgHba $backup
  Write-Host "Backup criado: $backup"
}

# Ativa trust temporario
$hba = Get-Content $pgHba -Raw
if ($hba -notmatch '127\.0\.0\.1/32\s+trust') {
  $trustContent = $hba -replace 'scram-sha-256', 'trust'
  Set-Content -Path $pgHba -Value $trustContent -NoNewline
  Write-Host "pg_hba.conf ajustado para trust (temporario)."
}

Write-Host "Reiniciando servico $serviceName..."
Restart-Service $serviceName -Force
Start-Sleep -Seconds 3

Write-Host "Definindo senha do postgres..."
$escaped = $NewPassword.Replace("'", "''")
& $psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$escaped';"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Falha ao alterar senha. Verifique se o servico PostgreSQL esta rodando."
}

# Restaura autenticacao normal
Copy-Item $backup $pgHba -Force
Write-Host "pg_hba.conf restaurado (scram-sha-256)."

Restart-Service $serviceName -Force
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "OK — Senha do postgres: $NewPassword" -ForegroundColor Green
Write-Host "Proximo: .\scripts\setup-postgres-db.ps1 (use essa senha quando pedir)"
