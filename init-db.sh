#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE fepa_budget'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fepa_budget')\gexec
    GRANT ALL PRIVILEGES ON DATABASE fepa_budget TO fepa;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "fepa_budget" <<-EOSQL
    GRANT ALL ON SCHEMA public TO fepa;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fepa;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fepa;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fepa;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fepa;
EOSQL

echo "✅ Budget database created successfully!"
