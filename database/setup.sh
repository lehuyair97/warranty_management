#!/bin/bash
set -e

HOST="${DB_HOST:-database}"
PASSWORD="${MSSQL_SA_PASSWORD:-Warranty@Pass123}"

echo "Waiting for SQL Server at ${HOST}:1433 to be ready..."
until /opt/mssql-tools18/bin/sqlcmd -S "${HOST}" -U sa -P "${PASSWORD}" -C -Q "SELECT 1" > /dev/null 2>&1 || \
      /opt/mssql-tools/bin/sqlcmd -S "${HOST}" -U sa -P "${PASSWORD}" -Q "SELECT 1" > /dev/null 2>&1; do
    echo "SQL Server is unavailable - waiting..."
    sleep 2
done

echo "SQL Server is ready. Running database initialization script..."
if [ -f /opt/mssql-tools18/bin/sqlcmd ]; then
    /opt/mssql-tools18/bin/sqlcmd -S "${HOST}" -U sa -P "${PASSWORD}" -C -i /docker-entrypoint-initdb.d/init-db.sql
elif [ -f /opt/mssql-tools/bin/sqlcmd ]; then
    /opt/mssql-tools/bin/sqlcmd -S "${HOST}" -U sa -P "${PASSWORD}" -i /docker-entrypoint-initdb.d/init-db.sql
fi

echo "Database initialization completed successfully."
