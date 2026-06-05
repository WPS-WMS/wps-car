-- Necessário para: npx prisma migrate dev (banco shadow)
-- Execute como postgres:
-- psql -U postgres -f scripts/grant-wps-car-createdb.sql

ALTER USER wps_car CREATEDB;
