# Sobe a API após o Postgres estar configurado.
$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\..\apps\api"

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Criado apps/api/.env a partir do .env.example"
}

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
