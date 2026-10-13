#!/usr/bin/env bash
# Restore-verify: restore latest backup into a DISPOSABLE database, count tables, drop it.
# Never touches the source database. Usage: scripts/restore-verify.sh [backup-file]
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
FILE="${1:-$(ls -t backups/*.dump | head -1)}"
TEST_DB="sakk_restore_verify_$$"
ADMIN_URL="${DATABASE_URL%/*}/postgres"
echo "Restoring $FILE into disposable DB $TEST_DB ..."
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "create database $TEST_DB" >/dev/null
TARGET="${DATABASE_URL%/*}/$TEST_DB"
pg_restore --no-owner --dbname="$TARGET" "$FILE"
TABLES=$(psql "$TARGET" -t -A -c "select count(*) from information_schema.tables where table_schema='public'")
echo "Restored tables: $TABLES"
psql "$TARGET" -t -A -c "select 'users='||count(*) from users"
psql "$ADMIN_URL" -c "drop database $TEST_DB" >/dev/null
echo "RESTORE VERIFY: PASS (disposable DB dropped, source untouched)"
