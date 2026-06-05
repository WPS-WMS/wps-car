-- Execute como superusuário (postgres) após instalar o PostgreSQL no Windows.
-- psql -U postgres -f scripts/setup-postgres-db.sql

CREATE USER wps_car WITH PASSWORD 'wps_car_secret' CREATEDB;
CREATE DATABASE wps_car OWNER wps_car;
GRANT ALL PRIVILEGES ON DATABASE wps_car TO wps_car;

\c wps_car
GRANT ALL ON SCHEMA public TO wps_car;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wps_car;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wps_car;
