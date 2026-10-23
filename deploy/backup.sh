#!/bin/sh
set -eu
cd /opt/cuidados/deploy
. ./backup.env
# Uma só instância SQLite. Pausa curta mantém banco e mídias da mesma operação.
docker compose stop api
trap 'docker compose start api >/dev/null' EXIT
arquivo=$(
  /opt/cuidados/.venv/bin/python ../scripts/backup.py create \
    --database /srv/cuidados/data/cuidados.db \
    --media /srv/cuidados/data/media \
    --output /srv/cuidados/backups \
    --key-file "$BACKUP_KEY_FILE" \
    --api-stopped
)
docker compose start api >/dev/null
trap - EXIT
# O bucket configurado deve ser privado. Só o arquivo cifrado sai da VM.
if [ -n "$BACKUP_BUCKET" ]; then
  gcloud storage cp "$arquivo" "gs://$BACKUP_BUCKET/"
fi
# Apaga apenas arquivos próprios na pasta fixa de backup, após cópia bem-sucedida.
find /srv/cuidados/backups -maxdepth 1 -type f -name 'cuidados-*.cam' -mtime +30 -delete
