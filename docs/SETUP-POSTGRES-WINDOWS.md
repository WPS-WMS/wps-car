# PostgreSQL no Windows (sem Docker)

## 1. Instalar PostgreSQL 16

**Opção A — winget** (PowerShell como administrador):

```powershell
winget install -e --id PostgreSQL.PostgreSQL.16 --accept-package-agreements --accept-source-agreements
```

**Opção B — instalador:** https://www.postgresql.org/download/windows/

Durante a instalação:

- Anote a **senha do usuário `postgres`** (se não definiu ou não lembra, veja abaixo)
- Porta padrão: **5432**

### Não definiu / não lembra a senha do `postgres`

PowerShell **como administrador** (botão direito → Executar como administrador):

```powershell
cd C:\Users\User\Desktop\wps-flowa\wps-car
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
.\scripts\reset-postgres-password.ps1
```

Isso define a senha como `wps_postgres_123` (ou passe `-NewPassword "SuaSenha"`).

Depois rode `.\scripts\setup-postgres-db.ps1` e use essa senha quando o `psql` pedir.
- Marque para instalar **Stack Builder / Command Line Tools** (inclui `psql`)

Reinicie o terminal após instalar.

---

## 2. Criar banco do WPS Car

No PowerShell, na pasta do projeto:

```powershell
cd C:\Users\User\Desktop\wps-flowa\wps-car
.\scripts\setup-postgres-db.ps1
```

Ou com caminho completo do `psql` (se o script não rodar):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -f scripts\setup-postgres-db.sql
```

Informe a senha do `postgres` quando pedir.

**Opcional — colocar `psql` no PATH:**  
Configurações → Sistema → Variáveis de ambiente → Path → Novo →  
`C:\Program Files\PostgreSQL\16\bin`

---

## 3. Configurar a API

```powershell
cd apps\api
Copy-Item .env.example .env
```

O `.env` já deve conter:

```env
DATABASE_URL="postgresql://wps_car:wps_car_secret@localhost:5432/wps_car?schema=public"
```

---

## 4. Migrar e popular dados demo

Se `prisma migrate dev` falhar com **P3014 / shadow database**, conceda `CREATEDB` ao usuário:

```powershell
cd C:\Users\User\Desktop\wps-flowa\wps-car
$env:PGPASSWORD = "wps_postgres_123"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -f scripts\grant-wps-car-createdb.sql
```

Depois:

```powershell
cd apps\api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
```

Health: http://localhost:3001/api/v1/health

---

## 5. Frontend

Outro terminal:

```powershell
cd apps\web
Copy-Item .env.example .env.local
npm install
npm run dev
```

http://localhost:3000 — CNPJ `00000000000191`

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@revendademo.com.br | Admin@123 |
| Gerente | gerente@revendademo.com.br | Manager@123 |
| Vendedor | vendedor@revendademo.com.br | Seller@123 |

---

## Problemas comuns

| Erro | Solução |
|------|---------|
| `psql` não encontrado | Adicione `C:\Program Files\PostgreSQL\16\bin` ao PATH ou use o caminho completo |
| `password authentication failed` | Senha do `postgres` incorreta |
| `database "wps_car" does not exist` | Rode `scripts/setup-postgres-db.sql` |
| Porta 5432 em uso | Outro Postgres ou serviço; mude a porta no instalador e na `DATABASE_URL` |
| Serviço parado | `services.msc` → **postgresql-x64-16** → Iniciar |
