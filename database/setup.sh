#!/bin/bash
# ============================================================
# Script: setup.sh
# Purpose: Initialize database warranty_management on MSSQL
# Runs numbered migrations sequentially: 01 -> 02 -> 03 -> 04 -> 05
# ============================================================

set -e

SA_PASSWORD="${MSSQL_SA_PASSWORD:-Warranty@Pass123}"
DB_NAME="${DB_DATABASE:-warranty_management}"
DB_HOST="${DB_HOST:-localhost}"

echo "Waiting for Microsoft SQL Server at [$DB_HOST] to start..."

SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
if [ ! -f "$SQLCMD" ]; then
    SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

for i in {1..60}; do
    if $SQLCMD -S "$DB_HOST" -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1 || \
       $SQLCMD -S "$DB_HOST" -U sa -P "$SA_PASSWORD" -Q "SELECT 1" > /dev/null 2>&1; then
        echo "SQL Server is ready!"
        break
    fi
    echo "SQL Server starting up... waiting 2s ($i/60)"
    sleep 2
done

# Ensure database exists
echo "Ensuring database [$DB_NAME] exists..."
$SQLCMD -S "$DB_HOST" -U sa -P "$SA_PASSWORD" -C -Q "IF DB_ID('$DB_NAME') IS NULL CREATE DATABASE [$DB_NAME];" || \
$SQLCMD -S "$DB_HOST" -U sa -P "$SA_PASSWORD" -Q "IF DB_ID('$DB_NAME') IS NULL CREATE DATABASE [$DB_NAME];"

# Run migrations in order
MIGRATIONS_DIR="/docker-entrypoint-initdb.d/migrations"
for sql_file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
    echo "--> Running migration: $(basename "$sql_file")..."
    $SQLCMD -S "$DB_HOST" -U sa -P "$SA_PASSWORD" -C -i "$sql_file" || \
    $SQLCMD -S "$DB_HOST" -U sa -P "$SA_PASSWORD" -i "$sql_file"
done

echo "All migrations applied successfully!"
