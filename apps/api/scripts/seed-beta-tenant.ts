/**
 * Cria apenas a empresa Beta (tenant 2) — útil em QA sem rodar o seed completo.
 *
 * Uso:
 *   $env:DATABASE_URL="postgresql://..."
 *   npm run db:seed:beta
 */
import {
  DEMO_TENANT_BETA,
  prisma,
  printTenantCredentials,
  seedDemoTenant,
} from '../prisma/seed-helpers';

async function main() {
  console.log('Criando empresa Beta...');
  await seedDemoTenant(DEMO_TENANT_BETA);
  console.log('\nPronto.\n');
  printTenantCredentials(DEMO_TENANT_BETA);
  console.log('\nNo login, informe o CNPJ acima para entrar nesta empresa.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
