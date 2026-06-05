# Use SOMENTE se reset-postgres-password.ps1 parou no meio e pg_hba ja esta em "trust".
# PowerShell como ADMINISTRADOR.

$ErrorActionPreference = "Stop"
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Error "Execute como administrador."; exit 1 }

$pgHba = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
$backup = "$pgHba.backup-wps-car"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$pwd = "wps_postgres_123"

Restart-Service postgresql-x64-16 -Force
Start-Sleep -Seconds 3

& $psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$pwd';"
Copy-Item $backup $pgHba -Force
Restart-Service postgresql-x64-16 -Force

Write-Host "Senha: $pwd — pg_hba restaurado."
