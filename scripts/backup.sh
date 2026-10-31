#!/usr/bin/env bash
# PostgreSQL yedeği: sıkıştırılmış özel biçim, tarih damgalı; BACKUP_KEEP_DAYS günden eski yedekler silinir.
# Kullanım: DATABASE_URL=... BACKUP_DIR=/var/backups/yarinlab ./scripts/backup.sh   (cron ile günlük çalıştırın)
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL gerekli}"
DIR="${BACKUP_DIR:-./backups}"
KEEP="${BACKUP_KEEP_DAYS:-14}"
mkdir -p "$DIR"
FILE="$DIR/yarinlab-$(date +%Y%m%d-%H%M%S).dump"
pg_dump --format=custom --no-owner --dbname="${DATABASE_URL%%\?*}" --file="$FILE"
chmod 600 "$FILE"
find "$DIR" -name 'yarinlab-*.dump' -mtime "+$KEEP" -delete
echo "Yedek alındı: $FILE"
# Geri yükleme: pg_restore --clean --no-owner --dbname="$DATABASE_URL" "$FILE"
