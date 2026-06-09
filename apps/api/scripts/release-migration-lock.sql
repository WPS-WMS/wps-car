-- Libera advisory lock do Prisma Migrate (id 72707369) quando ficou preso.
-- Rode: npm run db:unlock
-- Use DIRECT_DATABASE_URL (conexão direct do Neon, sem -pooler).

SELECT pg_terminate_backend(psa.pid)
FROM pg_locks AS pl
INNER JOIN pg_stat_activity AS psa ON psa.pid = pl.pid
WHERE pl.locktype = 'advisory'
  AND pl.objid = 72707369
  AND psa.pid <> pg_backend_pid();
