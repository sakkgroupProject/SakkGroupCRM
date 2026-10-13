#!/usr/bin/env bash
# SAKK CRM backup — requires DATABASE_URL. Produces compressed pg_dump in backups/
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
mkdir -p backups
FILE="backups/sakk-crm-$(date +%Y%m%d-%H%M%S).dump"
pg_dump "$DATABASE_URL" -Fc -f "$FILE"
echo "Backup written: $FILE ($(du -h "$FILE" | cut -f1))"
