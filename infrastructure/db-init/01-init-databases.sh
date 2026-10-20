#!/bin/sh
set -e
set -u

create_user_and_database() {
    database=$1
    echo "  Creating database '$database'..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE $database;
        GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres_duy_dao') THEN
                CREATE ROLE postgres_duy_dao WITH LOGIN SUPERUSER PASSWORD '1234567';
            END IF;
        END
        \$\$;
        GRANT ALL PRIVILEGES ON DATABASE $database TO postgres_duy_dao;
EOSQL
}

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
    echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_user_and_database "$db"
    done
    echo "All databases initialized successfully!"
fi
